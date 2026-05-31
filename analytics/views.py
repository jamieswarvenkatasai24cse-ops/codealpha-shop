from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from products.models import Product, Category
from authentication.serializers import UserSerializer

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 1. Total Stats
        total_revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = Order.objects.count()
        total_products = Product.objects.count()
        total_users = User.objects.count()
        
        # 2. Status Counts
        status_counts = Order.objects.values('status').annotate(count=Count('status'))
        status_map = {
            'Processing': 0,
            'Packed': 0,
            'Shipped': 0,
            'Delivered': 0
        }
        for item in status_counts:
            status_map[item['status']] = item['count']
        
        # 3. Revenue Trend (last 7 days/orders)
        revenue_trend = Order.objects.annotate(date=TruncDate('created_at')).values('date').annotate(revenue=Sum('total_amount')).order_by('-date')[:7]
        trend_data = [{'date': str(item['date']), 'revenue': float(item['revenue'])} for item in revenue_trend]
        
        # 4. Top Selling Products
        top_selling = OrderItem.objects.values('product__title', 'product__price').annotate(units_sold=Sum('quantity'), revenue=Sum('price')).order_by('-units_sold')[:5]
        top_selling_data = [{
            'title': item['product__title'],
            'price': float(item['product__price']),
            'units_sold': item['units_sold'],
            'revenue': float(item['revenue'])
        } for item in top_selling]

        # 5. Low Stock Alert (stock <= 5)
        low_stock_products = Product.objects.filter(stock__lte=5).values('id', 'title', 'stock')
        
        return Response({
            'totals': {
                'revenue': float(total_revenue),
                'orders': total_orders,
                'products': total_products,
                'users': total_users
            },
            'status_distribution': status_map,
            'revenue_trend': trend_data,
            'top_selling': top_selling_data,
            'low_stock': list(low_stock_products)
        })

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset to view, list, and edit users.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
