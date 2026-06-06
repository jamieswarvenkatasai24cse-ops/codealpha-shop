from decimal import Decimal

from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import CartItem, Wishlist, Order, OrderItem
from .serializers import CartItemSerializer, WishlistSerializer, OrderSerializer
from products.models import Product, FlashSale, Notification

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # We can list active cart items or saved items depending on the query param
        save_for_later = self.request.query_params.get('save_for_later', 'false') == 'true'
        return CartItem.objects.filter(user=self.request.user, save_for_later=save_for_later)

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)
        save_for_later = serializer.validated_data.get('save_for_later', False)
        
        # Check if item already exists in cart with this saved status
        existing_item = CartItem.objects.filter(
            user=self.request.user, product=product, save_for_later=save_for_later
        ).first()
        
        if existing_item:
            # Add quantities and update
            new_qty = existing_item.quantity + quantity
            if new_qty > product.stock:
                new_qty = product.stock
            existing_item.quantity = new_qty
            existing_item.save()
            return existing_item
        else:
            serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_save_later(self, request, pk=None):
        cart_item = self.get_object()
        # Create a new cart item or update an existing one with toggled save_for_later
        other_status_item = CartItem.objects.filter(
            user=request.user, product=cart_item.product, save_for_later=not cart_item.save_for_later
        ).first()

        if other_status_item:
            # Combine quantities
            other_status_item.quantity += cart_item.quantity
            if other_status_item.quantity > cart_item.product.stock:
                other_status_item.quantity = cart_item.product.stock
            other_status_item.save()
            cart_item.delete()
            serializer = CartItemSerializer(other_status_item)
        else:
            cart_item.save_for_later = not cart_item.save_for_later
            cart_item.save()
            serializer = CartItemSerializer(cart_item)

        return Response(serializer.data)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        # Don't add duplicate wishlist items
        wishlist_item, created = Wishlist.objects.get_or_create(user=self.request.user, product=product)
        serializer.instance = wishlist_item

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        product = get_object_or_404(Product, id=product_id)
        wishlist_item = Wishlist.objects.filter(user=request.user, product=product).first()
        
        if wishlist_item:
            wishlist_item.delete()
            return Response({"status": "removed", "is_in_wishlist": False})
        else:
            Wishlist.objects.create(user=request.user, product=product)
            return Response({"status": "added", "is_in_wishlist": True})

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        address_id = request.data.get('address')
        if not address_id:
            return Response({"error": "Shipping address is required."}, status=status.HTTP_400_BAD_REQUEST)

        from authentication.models import Address
        address = get_object_or_404(Address, id=address_id, user=user)

        # Get active cart items
        cart_items = CartItem.objects.filter(user=user, save_for_later=False).select_related('product')
        if not cart_items.exists():
            return Response({"error": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify stock and calculate total
        total_amount = 0
        order_items_to_create = []
        products_to_update = []

        for item in cart_items:
            product = item.product
            if product.stock < item.quantity:
                return Response({"error": f"Not enough stock for {product.title}. Only {product.stock} left."}, status=status.HTTP_400_BAD_REQUEST)

            # Determine price (check if flash sale is active)
            price = product.price
            try:
                if hasattr(product, 'flash_sale') and product.flash_sale.is_active:
                    if product.flash_sale.end_time > timezone.now():
                        price = product.flash_sale.discount_price
            except FlashSale.DoesNotExist:
                pass

            total_amount += price * item.quantity
            order_items_to_create.append((product, item.quantity, price))

            # Prepare stock update
            product.stock -= item.quantity
            products_to_update.append(product)

        # Create Order
        order = Order.objects.create(
            user=user,
            address=address,
            total_amount=total_amount,
            status='Processing'
        )

        # Save order items & update product stock
        for product, quantity, price in order_items_to_create:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )

        for product in products_to_update:
            product.save(update_fields=['stock'])

        # Clear active cart
        cart_items.delete()

        # Award gamification points: 10% of total order in points
        points_earned = int(total_amount * Decimal('0.1'))
        if points_earned > 0:
            user.add_points(points_earned)

        # Award badges based on order criteria
        order_count = user.orders.count()
        from authentication.models import Badge, UserBadge
        if order_count == 1:
            first_order_badge, _ = Badge.objects.get_or_create(
                name="First Purchase 🏷️",
                description="Completed your first purchase. Welcome to the club!",
                icon_class="fa-solid fa-tags",
                criteria_type="orders"
            )
            UserBadge.objects.get_or_create(user=user, badge=first_order_badge)
        elif order_count >= 5:
            shopaholic_badge, _ = Badge.objects.get_or_create(
                name="Shopaholic 🛍️",
                description="Placed 5 or more orders. Master consumer!",
                icon_class="fa-solid fa-bag-shopping",
                criteria_type="orders"
            )
            UserBadge.objects.get_or_create(user=user, badge=shopaholic_badge)

        # Create in-app Notification
        Notification.objects.create(
            user=user,
            title="Order Placed! 🎉",
            message=f"Your order #{order.id} for ₹{total_amount} was successfully placed! Points earned: {points_earned}."
        )

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
