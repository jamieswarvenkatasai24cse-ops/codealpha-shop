# CodeAlpha Shop | Premium Sustainable E-Commerce Platform

CodeAlpha Shop is a state-of-the-art e-commerce application designed to promote eco-friendly goods while delivering a visually stunning, premium shopping experience. Inspired by Amazon and Flipkart, it features a robust Django REST Framework backend and a highly responsive, vanilla HTML/CSS/JS Single Page Application (SPA) frontend.

---

## 🚀 Tech Stack
- **Frontend**: Single Page Application using clean Vanilla HTML5, Vanilla CSS3 (Custom design system with variables, light/dark themes, glassmorphism, responsive grids, loading skeletons, and micro-animations), and modern modular ES6 JavaScript.
- **Backend**: Django (Python) with Django REST Framework (DRF) and Simple JWT (JSON Web Tokens) for authentication.
- **Database**: SQLite (configured for local zero-config execution; ready to scale to PostgreSQL).
- **Gamification Engine**: Direct points tracking, level calculations, and automatic badges award triggers integrated directly into the database save cycles.
- **AI Recommendation Index**: Content & collaborative filtering recommendations based on user browsing history, categories of interest, and sales velocity data.

---

## ✨ Features
1. **User Authentication & Profiles**:
   - JWT-based Login, Registration, and automatic Token Refresh mechanisms.
   - Address list management (default, home, work billing options).
2. **Product Catalog & Searching**:
   - Catalog filtering by category, price ranges, minimum ratings, and sustainability scores.
   - Smart autocomplete suggestions list while typing in the search bar.
   - Low-stock Availability Predictor indicators ("Only 3 left!", "Out of Stock").
3. **Shopping Cart & Checkout**:
   - Double lists for Cart items: active items and saved-for-later items.
   - Quantity spinners with automatic backend stock depletion verification.
   - Simulated checkout with address selections.
4. **Gamification System**:
   - Points earned on registration (+10) and order checkout (+10% of spend in points) and reviews (+15).
   - Dynamic user levels ("Level 2 Green Ambassador") and progress bars.
   - Badges shelf displaying earned icons (e.g. Rookie Shopper 🎒, First Purchase 🏷️, Bronze Shopper 🥉).
5. **Exclusive Features**:
   - **AI Product Recommendations**: Dynamic custom selections based on user browsing history.
   - **Smart Price Drop Alerts**: Watch specific products and receive notifications (bell icon) when prices decrease.
   - **Frequently Bought Together & Customers Also Viewed**: Contextual recommendations on details page.
   - **Flash Sales Widgets**: Live timer countdown for limited-time offers.
   - **Product Comparison Sheet**: Select and compare up to 3 products side-by-side on prices, eco-scores, ratings, and availability.
   - **Eco-Friendly Scores**: Sustainability ratings (1-100) embedded in product grids.
   - **Dual Theme Support**: Beautiful light and dark themes using CSS variables, synced to local storage.
6. **Admin Analytics Dashboard**:
   - Totals trackers: revenue, order count, users.
   - Status distributions progress bars.
   - Daily revenue trends chart (using pure CSS bars layout).
   - Low stock warning logs with a 1-click **Restock +10** button.
   - Order fulfillment control table allowing admins to change order states (Processing ➔ Packed ➔ Shipped ➔ Delivered).

---

## 🛠️ Installation & Setup (Windows Guide)

Follow these simple steps to run CodeAlpha Shop on your Windows system:

### 1. Open Workspace
Make sure your terminal is running inside the directory containing the project. 

### 2. Create and Activate Virtual Environment
```powershell
# Create venv
python -m venv venv

# Activate venv in PowerShell
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Create and Seed Database
```powershell
# Apply model migrations
python manage.py makemigrations authentication products orders analytics
python manage.py migrate

# Seed database with sample categories, products, active flash sales, and badges
python seed.py
```

### 5. Run Local Server
```powershell
python manage.py runserver
```

---

## 🔑 Default Accounts (Pre-Seeded)
Use these pre-configured login credentials to explore different roles:

### 👤 Demo Customer Account (To explore gamification, cart, orders, and reviews)
- **Username**: `demo`
- **Password**: `demopassword`
- *Notes*: Pre-configured with 150 points (Level 2), 2 badges, 2 addresses, and sample notifications.

### ⚙️ Administrator Account (To explore the analytics dashboard and order fulfillment)
- **Username**: `admin`
- **Password**: `adminpassword`
- *Notes*: Can access the **Admin Panel** link under the profile icon dropdown to update order tracking status and restock low-stock products.
