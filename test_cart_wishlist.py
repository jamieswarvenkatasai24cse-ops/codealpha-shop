import os, json, urllib.request
os.environ.setdefault('DJANGO_SETTINGS_MODULE','ecom_platform.settings')
import django
django.setup()
from pathlib import Path
# Read token from environment variable TEST_ACCESS
ACCESS = os.environ.get('TEST_ACCESS')
if not ACCESS:
    print('No TEST_ACCESS environment variable set.')
    raise SystemExit(1)
headers = {'Content-Type':'application/json', 'Authorization':f'Bearer {ACCESS}'}
# Add to cart
data = json.dumps({'product_id':1,'quantity':1}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/cart/', data=data, headers=headers, method='POST')
try:
    resp = urllib.request.urlopen(req)
    print('AddToCart response:', resp.status, resp.read().decode())
except urllib.error.HTTPError as e:
    print('AddToCart error:', e.code, e.read().decode())
# Toggle wishlist
data = json.dumps({'product_id':1}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/wishlist/toggle/', data=data, headers=headers, method='POST')
try:
    resp = urllib.request.urlopen(req)
    print('ToggleWishlist response:', resp.status, resp.read().decode())
except urllib.error.HTTPError as e:
    print('ToggleWishlist error:', e.code, e.read().decode())
