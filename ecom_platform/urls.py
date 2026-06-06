from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import views
from authentication.views import RegisterView, UserProfileView, AddressViewSet, LeaderboardView, CustomTokenObtainPairView
from products.views import (
    CategoryViewSet, ProductViewSet, RecommendationView, PriceDropWatchViewSet,
    RecentlyViewedViewSet, NotificationViewSet, TrendingProductsView, FlashSaleProductsView
)
from products.views import RestockLogViewSet
from orders.views import CartItemViewSet, WishlistViewSet, OrderViewSet
from analytics.views import AdminDashboardStatsView, AdminUserViewSet

# Setup REST Router
router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'price-watches', PriceDropWatchViewSet, basename='price-watch')
router.register(r'recently-viewed', RecentlyViewedViewSet, basename='recently-viewed')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'cart', CartItemViewSet, basename='cart')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'restock-logs', RestockLogViewSet, basename='restock-log')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('admin/django/', admin.site.urls), # Django Admin panel prefix
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Custom API endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth-register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('api/auth/profile/', UserProfileView.as_view(), name='auth-profile'),
    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    
    path('api/recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('api/trending/', TrendingProductsView.as_view(), name='trending'),
    path('api/flash-sales/', FlashSaleProductsView.as_view(), name='flash-sales'),
    
    path('api/admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    
    # Frontend SPA entry point
    path('', TemplateView.as_view(template_name='index.html'), name='frontend'),
]
