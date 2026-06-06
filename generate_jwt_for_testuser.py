import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','ecom_platform.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
User = get_user_model()
user = User.objects.filter(username='testuser').first()
if not user:
    raise SystemExit('testuser not found')
refresh = RefreshToken.for_user(user)
print('ACCESS='+str(refresh.access_token))
print('REFRESH='+str(refresh))
