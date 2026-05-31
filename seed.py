import os
import django
import sys
from datetime import datetime, timedelta
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecom_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from authentication.models import Address, Badge, UserBadge
from products.models import Category, Product, ProductImage, Review, FlashSale, Notification
from orders.models import Order, OrderItem, CartItem

User = get_user_model()

def seed_db():
    print("Starting database seeding...")

    # 1. Create Badges
    print("Creating badges...")
    rookie_badge, _ = Badge.objects.get_or_create(
        name="Rookie Shopper 🎒",
        description="Welcome to the platform! Awarded for registration.",
        icon_class="fa-solid fa-user-plus",
        criteria_type="registration"
    )
    first_order_badge, _ = Badge.objects.get_or_create(
        name="First Purchase 🏷️",
        description="Completed your first purchase. Welcome to the club!",
        icon_class="fa-solid fa-tags",
        criteria_type="orders"
    )
    shopaholic_badge, _ = Badge.objects.get_or_create(
        name="Shopaholic 🛍️",
        description="Placed 5 or more orders. Master consumer!",
        icon_class="fa-solid fa-bag-shopping",
        criteria_type="orders"
    )
    bronze_badge, _ = Badge.objects.get_or_create(
        name="Bronze Shopper 🥉",
        description="Reach level 2",
        icon_class="fa-solid fa-medal",
        criteria_type="level"
    )
    silver_badge, _ = Badge.objects.get_or_create(
        name="Silver Shopper 🥈",
        description="Reach level 3",
        icon_class="fa-solid fa-award",
        criteria_type="level"
    )
    gold_badge, _ = Badge.objects.get_or_create(
        name="Gold Shopper 🥇",
        description="Reach level 5",
        icon_class="fa-solid fa-crown",
        criteria_type="level"
    )

    # 2. Create Users
    print("Creating users...")
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        admin_user.phone = '9999999999'
        admin_user.save()
        print("Created superuser 'admin' with password 'adminpassword'")
    
    demo_user = User.objects.filter(username='demo').first()
    if not demo_user:
        demo_user = User.objects.create_user('demo', 'demo@example.com', 'demopassword')
        demo_user.phone = '9876543210'
        demo_user.add_points(150) # Give 150 points to demo user (makes them level 2)
        demo_user.save()
        
        # Award initial badges
        UserBadge.objects.get_or_create(user=demo_user, badge=rookie_badge)
        UserBadge.objects.get_or_create(user=demo_user, badge=bronze_badge)
        
        # Add Address for demo user
        Address.objects.create(
            user=demo_user,
            street_address="Flat 402, Green Glen Layout",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            country="India",
            is_default=True
        )
        Address.objects.create(
            user=demo_user,
            street_address="12th Floor, Prestige Tech Park",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            country="India",
            is_default=False
        )
        print("Created demo user 'demo' with password 'demopassword'")

    # 3. Create Categories
    print("Creating categories...")
    categories_data = [
        {"title": "Electronics", "slug": "electronics", "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500"},
        {"title": "Fashion", "slug": "fashion", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500"},
        {"title": "Home & Kitchen", "slug": "home-kitchen", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500"},
        {"title": "Eco-friendly Specials", "slug": "eco-friendly", "image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500"},
        {"title": "Books", "slug": "books", "image_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500"}
    ]
    categories = {}
    for cat in categories_data:
        category, _ = Category.objects.get_or_create(
            title=cat["title"],
            slug=cat["slug"],
            defaults={"image_url": cat["image_url"]}
        )
        categories[cat["slug"]] = category

    # 4. Create Products
    print("Creating products...")
    products_data = [
        # Electronics
        {
            "title": "EcoSound Wireless Headphones",
            "description": "Premium wireless headphones manufactured using 85% recycled ocean plastic. High-fidelity audio with active noise cancellation (ANC), 40-hour battery life, and ultra-comfortable earcups. Includes a biodegradable carrying pouch.",
            "price": 2499.00,
            "original_price": 3999.00,
            "stock": 15,
            "category": categories["electronics"],
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            "eco_score": 85,
            "gallery": [
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500",
                "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500"
            ]
        },
        {
            "title": "SolarCharge Rugged Power Bank",
            "description": "High capacity 20,000mAh external battery equipped with clean, solar-assist charging panels. Waterproof, dustproof, and shockproof casing made from post-consumer recycled rubber. Includes super-bright emergency LED flashlight.",
            "price": 1899.00,
            "original_price": 2499.00,
            "stock": 3, # Low stock to trigger predictor
            "category": categories["electronics"],
            "image_url": "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500",
            "eco_score": 95,
            "gallery": []
        },
        {
            "title": "Bamboo Wireless Keyboard & Mouse",
            "description": "Elegant desktop set handmade from 100% natural, biodegradable bamboo wood. Compact, ergonomic layout with silent click keys. Powered by a long-lasting rechargeable battery via USB-C. Combines minimalist design with eco-friendly engineering.",
            "price": 3499.00,
            "original_price": 4999.00,
            "stock": 8,
            "category": categories["electronics"],
            "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
            "eco_score": 98,
            "gallery": [
                "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500"
            ]
        },
        # Fashion
        {
            "title": "Organic Cotton Classic Hoodie",
            "description": "Ultra-soft hoodie made from 100% certified organic cotton. Dyed using chemical-free, low-impact plant pigments. Features a double-lined hood, kangaroo pocket, and ribbed cuffs. Comfortable, durable, and highly breathable.",
            "price": 1499.00,
            "original_price": 1999.00,
            "stock": 25,
            "category": categories["fashion"],
            "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500",
            "eco_score": 90,
            "gallery": []
        },
        {
            "title": "Recycled Plastic Fiber Sneakers",
            "description": "Stunning lifestyle sneakers engineered using fibers woven from recycled plastic water bottles. Sole crafted using natural, sustainably-sourced tree rubber. Ergonomic insole provides clouds-like cushioning and support all day.",
            "price": 4999.00,
            "original_price": 5999.00,
            "stock": 12,
            "category": categories["fashion"],
            "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
            "eco_score": 88,
            "gallery": []
        },
        {
            "title": "Hemp Messenger Bag",
            "description": "Sleek, heavy-duty shoulder bag hand-loomed from pure industrial hemp fibers. Naturally water-resistant, antimicrobial, and incredibly tough. Features multiple organized compartments, padded laptop sleeve, and adjustable strap.",
            "price": 2199.00,
            "original_price": 2999.00,
            "stock": 10,
            "category": categories["fashion"],
            "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
            "eco_score": 92,
            "gallery": []
        },
        # Home & Kitchen
        {
            "title": "HydroPure Vacuum Insulated Bottle",
            "description": "Premium 18/8 food-grade stainless steel flask featuring dual-wall vacuum insulation. Keeps beverages ice-cold for 24 hours or piping hot for 12 hours. Zero condensation, BPA-free leakproof lid. Includes premium powder coat finish.",
            "price": 899.00,
            "original_price": 1299.00,
            "stock": 50,
            "category": categories["home-kitchen"],
            "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
            "eco_score": 92,
            "gallery": [
                "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500"
            ]
        },
        {
            "title": "Organic Beeswax Food Wraps (Pack of 5)",
            "description": "Zero-waste alternative to plastic wrap. Handcrafted from organic cotton sheets infused with sustainably-harvested beeswax, jojoba oil, and tree resin. Reusable, washable, and compostable. Keeps veggies, fruits, and bread fresh naturally.",
            "price": 499.00,
            "original_price": 699.00,
            "stock": 40,
            "category": categories["home-kitchen"],
            "image_url": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500",
            "eco_score": 100,
            "gallery": []
        },
        {
            "title": "Coconut Shell Bowls (Set of 4)",
            "description": "Hand-carved reclaimed coconut shells salvaged from local agricultural waste. Completely organic, polished with virgin coconut oil. Includes 4 wooden spoons. Perfect for serving salads, smoothie bowls, and healthy snacks.",
            "price": 799.00,
            "original_price": 999.00,
            "stock": 14,
            "category": categories["home-kitchen"],
            "image_url": "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?w=500",
            "eco_score": 98,
            "gallery": []
        },
        # Eco-friendly Specials
        {
            "title": "Solar Powered Garden Lights (Set of 6)",
            "description": "Beautiful outdoor pathway lights that harvest solar energy during the day and auto-illuminate at dusk. Casing made from rust-free recycled aluminum. Weatherproof IP65 rating. Warm white light glow adds premium ambiance.",
            "price": 1299.00,
            "original_price": 1899.00,
            "stock": 18,
            "category": categories["eco-friendly"],
            "image_url": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500",
            "eco_score": 96,
            "gallery": []
        },
        {
            "title": "Plantable Seed Stationery Kit",
            "description": "Stunning eco-stationery kit containing 10 seed pens, 5 seed pencils, and 2 seed diaries. Paper pages are recycled, chemical-free. Pen casings contain seeds that grow into herbs/vegetables when planted upside down after use.",
            "price": 349.00,
            "original_price": 499.00,
            "stock": 35,
            "category": categories["eco-friendly"],
            "image_url": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500",
            "eco_score": 99,
            "gallery": []
        },
        # Books
        {
            "title": "Sustainable Living 101: A Beginner's Guide",
            "description": "The ultimate handbook outlining practical strategies to minimize carbon footprint, reduce household waste, embrace slow fashion, and save energy. Printed on 100% post-consumer recycled paper with soy-based organic ink.",
            "price": 399.00,
            "original_price": 499.00,
            "stock": 2, # Low stock!
            "category": categories["books"],
            "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
            "eco_score": 95,
            "gallery": []
        },
        {
            "title": "Zero Waste Home by Bea Johnson",
            "description": "The globally acclaimed bestseller on how to reduce your waste and simplify your life. Explains how the author and her family reduced their yearly waste to a single quart jar using the 5 Rs (Refuse, Reduce, Reuse, Recycle, Rot).",
            "price": 450.00,
            "original_price": 599.00,
            "stock": 10,
            "category": categories["books"],
            "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500",
            "eco_score": 90,
            "gallery": []
        }
    ]

    for prod in products_data:
        gallery_urls = prod.pop("gallery", [])
        product, _ = Product.objects.get_or_create(
            title=prod["title"],
            defaults={
                "description": prod["description"],
                "price": prod["price"],
                "original_price": prod["original_price"],
                "stock": prod["stock"],
                "category": prod["category"],
                "image_url": prod["image_url"],
                "eco_score": prod["eco_score"]
            }
        )
        
        # Add gallery images
        for url in gallery_urls:
            ProductImage.objects.get_or_create(product=product, image_url=url)

    # 5. Create Flash Sales
    print("Setting up Flash Sales...")
    # Add a flash sale to Bamboo Wireless Keyboard
    keyboard = Product.objects.get(title="Bamboo Wireless Keyboard & Mouse")
    FlashSale.objects.get_or_create(
        product=keyboard,
        defaults={
            "discount_price": 2799.00,
            "end_time": timezone.now() + timedelta(days=2),
            "is_active": True
        }
    )
    
    # Add a flash sale to Organic Cotton Classic Hoodie
    hoodie = Product.objects.get(title="Organic Cotton Classic Hoodie")
    FlashSale.objects.get_or_create(
        product=hoodie,
        defaults={
            "discount_price": 999.00,
            "end_time": timezone.now() + timedelta(hours=36),
            "is_active": True
        }
    )

    # 6. Create Sample Reviews
    print("Creating reviews...")
    if demo_user:
        headphones = Product.objects.get(title="EcoSound Wireless Headphones")
        Review.objects.get_or_create(
            user=demo_user,
            product=headphones,
            defaults={
                "rating": 5,
                "comment": "Amazing sound quality and very comfortable to wear for hours! Love that it's made from recycled plastics."
            }
        )
        
        bottle = Product.objects.get(title="HydroPure Vacuum Insulated Bottle")
        Review.objects.get_or_create(
            user=demo_user,
            product=bottle,
            defaults={
                "rating": 4,
                "comment": "Keeps water cold all day. The powder coat finish has a great premium grip. Highly recommend."
            }
        )

        beexwax = Product.objects.get(title="Organic Beeswax Food Wraps (Pack of 5)")
        Review.objects.get_or_create(
            user=demo_user,
            product=beexwax,
            defaults={
                "rating": 5,
                "comment": "Smells fantastic (like natural honey!) and works perfectly to seal bowls or wrap leftovers. Easy to wash. Will buy again."
            }
        )

    # 7. Create in-app Notifications for Demo User
    if demo_user:
        Notification.objects.get_or_create(
            user=demo_user,
            title="Welcome Bonus Points! 🎁",
            message="You received 10 points for signing up on the platform.",
            is_read=True
        )
        Notification.objects.get_or_create(
            user=demo_user,
            title="Level Up! 🌟",
            message="Congratulations! You reached Level 2 and unlocked the 'Bronze Shopper' badge.",
            is_read=False
        )

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
