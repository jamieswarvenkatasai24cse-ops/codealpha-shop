import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','ecom_platform.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='testuser').exists():
    User.objects.create_user('testuser', 'testuser@example.com', 'Testpass123')
    print('Created testuser')
else:
    print('testuser already exists')
print('Done')
