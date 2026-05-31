from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Address, Badge, UserBadge

User = get_user_model()

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon_class', 'criteria_type']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'awarded_at']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street_address', 'city', 'state', 'postal_code', 'country', 'is_default']
        read_only_fields = ['id', 'user']

    def create(self, validated_data):
        user = self.context['request'].user
        # Create address
        return Address.objects.create(user=user, **validated_data)

class UserSerializer(serializers.ModelSerializer):
    badges = UserBadgeSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'points', 'level', 'badges', 'addresses', 'is_staff']
        read_only_fields = ['id', 'points', 'level', 'badges', 'addresses', 'is_staff']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'phone']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        phone = validated_data.get('phone', '')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            phone=phone
        )
        
        # Award a starting badge or initial points (Gamification)
        user.add_points(10) # 10 welcome points
        welcome_badge, created = Badge.objects.get_or_create(
            name="Rookie Shopper 🎒",
            description="Welcome to the platform! Awarded for registration.",
            icon_class="fa-solid fa-user-plus",
            criteria_type="registration"
        )
        UserBadge.objects.get_or_create(user=user, badge=welcome_badge)
        
        return user
