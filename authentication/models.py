from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, null=True)
    points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)

    def add_points(self, amount):
        self.points += amount
        # Recalculate level: 1 level per 100 points
        self.level = (self.points // 100) + 1
        self.save(update_fields=['points', 'level'])
        # Check badges
        self.check_badge_eligibility()

    def check_badge_eligibility(self):
        # We can award badges based on points or other stats
        # For simplicity, we award level-based badges
        badges = Badge.objects.filter(criteria_type='level')
        for badge in badges:
            try:
                required_level = int(badge.description.split()[-1]) # e.g. "Reach level 5" -> 5
            except ValueError:
                required_level = 999
            
            if self.level >= required_level:
                UserBadge.objects.get_or_create(user=self, badge=badge)

    def __str__(self):
        return self.username

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_default:
            # Mark all other addresses of this user as non-default
            Address.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.street_address}, {self.city} - {self.postal_code}"

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon_class = models.CharField(max_length=100) # For FontAwesome / CSS icons
    criteria_type = models.CharField(max_length=50) # 'level', 'orders', 'reviews'

    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
