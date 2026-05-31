from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Category, Product, ProductImage, Review, RecentlyViewed, PriceDropWatch, FlashSale, Notification

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'title', 'slug', 'image_url']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url']

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class FlashSaleSerializer(serializers.ModelSerializer):
    time_left_seconds = serializers.SerializerMethodField()

    class Meta:
        model = FlashSale
        fields = ['discount_price', 'end_time', 'time_left_seconds', 'is_active']

    def get_time_left_seconds(self, obj):
        now = timezone.now()
        if obj.end_time > now:
            return int((obj.end_time - now).total_seconds())
        return 0

class ProductSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    flash_sale_details = serializers.SerializerMethodField()
    is_in_wishlist = serializers.SerializerMethodField()
    is_watched = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'original_price', 
            'stock', 'category', 'category_title', 'image_url', 
            'images', 'reviews', 'average_rating', 'reviews_count', 
            'eco_score', 'flash_sale_details', 'is_in_wishlist', 
            'is_watched', 'created_at'
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def get_flash_sale_details(self, obj):
        try:
            if hasattr(obj, 'flash_sale') and obj.flash_sale.is_active:
                if obj.flash_sale.end_time > timezone.now():
                    return FlashSaleSerializer(obj.flash_sale).data
        except FlashSale.DoesNotExist:
            pass
        return None

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from orders.models import Wishlist
            return Wishlist.objects.filter(user=request.user, product=obj).exists()
        return False

    def get_is_watched(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PriceDropWatch.objects.filter(user=request.user, product=obj, is_active=True).exists()
        return False

class RecentlyViewedSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = RecentlyViewed
        fields = ['id', 'product', 'viewed_at']

class PriceDropWatchSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.URLField(source='product.image_url', read_only=True)

    class Meta:
        model = PriceDropWatch
        fields = ['id', 'product', 'product_title', 'product_price', 'product_image', 'target_price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
