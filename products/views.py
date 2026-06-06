from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser
from django.db import models
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Category, Product, Review, RecentlyViewed, PriceDropWatch, FlashSale, Notification, RestockLog
from .serializers import (
    CategorySerializer, ProductSerializer, ReviewSerializer, RecentlyViewedSerializer,
    PriceDropWatchSerializer, NotificationSerializer, FlashSaleSerializer, RestockLogSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Product.objects.all().prefetch_related('reviews', 'images')
        
        # 1. Search Query
        q = self.request.query_params.get('q', None)
        if q:
            queryset = queryset.filter(Q(title__icontains=q) | Q(description__icontains=q))
            
        # 2. Category Filter
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
            
        # 3. Price Filter
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        # 4. Rating Filter
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            # We filter products whose average review rating is >= min_rating
            queryset = queryset.annotate(avg_rating=Count('reviews__rating')).filter(avg_rating__gte=min_rating)

        # 5. Eco Score Filter
        min_eco = self.request.query_params.get('min_eco', None)
        if min_eco:
            queryset = queryset.filter(eco_score__gte=min_eco)

        # 6. Sorting
        sort = self.request.query_params.get('sort', None)
        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'rating_desc':
            # Sort by annotated average rating
            queryset = queryset.annotate(avg_rating=models.Avg('reviews__rating')).order_by('-avg_rating')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')

        return queryset

    # Track recently viewed on retrieving detail page
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object_or_404_viewed(request, kwargs.get('pk'))
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_object_or_404_viewed(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        if request.user.is_authenticated:
            # Save to RecentlyViewed (update viewed_at if exists, otherwise create)
            RecentlyViewed.objects.update_or_create(
                user=request.user,
                product=product
            )
        return product

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        q = request.query_params.get('q', '')
        if not q or len(q) < 2:
            return Response([])
        # Retrieve top 5 matching product titles
        products = Product.objects.filter(title__icontains=q)[:5]
        suggestions = [{'id': p.id, 'title': p.title} for p in products]
        return Response(suggestions)

    @action(detail=True, methods=['get'])
    def frequently_bought(self, request, pk=None):
        from orders.models import OrderItem
        # Find orders containing this product
        order_ids = OrderItem.objects.filter(product_id=pk).values_list('order_id', flat=True)
        # Find other products in these same orders
        other_items = OrderItem.objects.filter(order_id__in=order_ids).exclude(product_id=pk) \
            .values('product').annotate(count=Count('product')).order_by('-count')[:3]
        product_ids = [item['product'] for item in other_items]
        products = Product.objects.filter(id__in=product_ids)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def customers_viewed(self, request, pk=None):
        # Find users who viewed this product
        user_ids = RecentlyViewed.objects.filter(product_id=pk).values_list('user_id', flat=True)
        # Find other products viewed by those users
        other_views = RecentlyViewed.objects.filter(user_id__in=user_ids).exclude(product_id=pk) \
            .values('product').annotate(count=Count('product')).order_by('-count')[:4]
        product_ids = [view['product'] for view in other_views]
        products = Product.objects.filter(id__in=product_ids)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        product = self.get_object()
        user = request.user
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not rating:
            return Response({"error": "Rating is required."}, status=status.HTTP_400_BAD_REQUEST)

        review, created = Review.objects.update_or_create(
            user=user, product=product,
            defaults={'rating': rating, 'comment': comment}
        )

        # Gamification: award 15 points for submitting a review
        if created:
            user.add_points(15)

        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class RecommendationView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            # Fallback for anonymous: high sustainability scores
            products = Product.objects.order_by('-eco_score')[:6]
            serializer = ProductSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)

        # 1. Categories viewed / purchased
        recent_views = RecentlyViewed.objects.filter(user=user).select_related('product')
        viewed_product_ids = [rv.product.id for rv in recent_views]
        viewed_categories = [rv.product.category_id for rv in recent_views]

        from orders.models import OrderItem
        purchased_items = OrderItem.objects.filter(order__user=user).select_related('product')
        purchased_product_ids = [item.product.id for item in purchased_items]
        purchased_categories = [item.product.category_id for item in purchased_items]

        interest_categories = list(set(viewed_categories + purchased_categories))

        # 2. Get recommendations in those categories
        recommendations = Product.objects.filter(category_id__in=interest_categories) \
            .exclude(id__in=purchased_product_ids)
        
        # Avoid recommending items recently viewed too if possible, but keep them if recommendations are low
        exclude_viewed = recommendations.exclude(id__in=viewed_product_ids)
        if exclude_viewed.count() >= 4:
            recommendations = exclude_viewed

        # 3. Fallback padding
        if recommendations.count() < 6:
            additional = Product.objects.exclude(id__in=purchased_product_ids).order_by('-price')[:6]
            recommendations = list(recommendations) + list(additional)
            
            seen = set()
            recommendations = [x for x in recommendations if not (x.id in seen or seen.add(x.id))]

        recommendations = recommendations[:6]
        serializer = ProductSerializer(recommendations, many=True, context={'request': request})
        return Response(serializer.data)

class PriceDropWatchViewSet(viewsets.ModelViewSet):
    serializer_class = PriceDropWatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PriceDropWatch.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        # If target price not specified, default to 95% of current price
        target_price = serializer.validated_data.get('target_price', product.price * 0.95)
        
        # Update or create watch
        serializer.save(user=self.request.user, target_price=target_price, is_active=True)

class RecentlyViewedViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecentlyViewedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecentlyViewed.objects.filter(user=self.request.user)[:12]

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all marked as read"})

class TrendingProductsView(APIView):
    def get(self, request):
        # Trending = Top viewed (RecentlyViewed count) + Top purchased (OrderItem quantity sum)
        # For simplicity, aggregate views and purchases
        viewed = RecentlyViewed.objects.values('product').annotate(view_count=Count('product')).order_by('-view_count')[:6]
        from orders.models import OrderItem
        purchased = OrderItem.objects.values('product').annotate(sales_count=Sum('quantity')).order_by('-sales_count')[:6]

        trending_ids = list(set([item['product'] for item in viewed] + [item['product'] for item in purchased]))
        
        # If database has no views/orders yet, get newest products
        if not trending_ids:
            products = Product.objects.all().order_by('-created_at')[:6]
        else:
            products = Product.objects.filter(id__in=trending_ids)[:6]

        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

class FlashSaleProductsView(APIView):
    def get(self, request):
        sales = FlashSale.objects.filter(is_active=True, end_time__gt=timezone.now())
        # We can extract the products with flash sale details embedded
        product_ids = sales.values_list('product_id', flat=True)
        products = Product.objects.filter(id__in=product_ids)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class RestockLogViewSet(viewsets.ModelViewSet):
    queryset = RestockLog.objects.all().select_related('product', 'user')
    serializer_class = RestockLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        # Optionally filter by product via ?product=<id>
        product_id = self.request.query_params.get('product', None)
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        # Ensure user is set for audit
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)
