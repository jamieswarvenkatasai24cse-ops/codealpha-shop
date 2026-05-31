const Components = {
    // 1. Toast Notifications
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        
        let icon = '<i class="fa-solid fa-circle-check" style="color: var(--primary-color)"></i>';
        if (type === 'error') {
            icon = '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger-color)"></i>';
        }

        toast.innerHTML = `
            ${icon}
            <span class="toast-msg">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove toast
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    },

    // 2. Stars Rating Renderer
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.4 && rating % 1 <= 0.8;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        
        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="fa-solid fa-star"></i>';
        }
        if (hasHalf) {
            html += '<i class="fa-solid fa-star-half-stroke"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '<i class="fa-regular fa-star"></i>';
        }
        return `<div class="stars">${html}</div>`;
    },

    // 3. Product Card Renderer
    renderProductCard(product) {
        const avgRating = product.average_rating || 0;
        const reviewCount = product.reviews_count || 0;
        
        // Determine active price
        let price = product.price;
        let isFlash = false;
        let originalPriceHtml = '';

        if (product.flash_sale_details) {
            price = product.flash_sale_details.discount_price;
            isFlash = true;
            originalPriceHtml = `<span class="original-price">₹${product.price}</span>`;
        } else if (product.original_price && Number(product.original_price) > Number(product.price)) {
            originalPriceHtml = `<span class="original-price">₹${product.original_price}</span>`;
        }

        // Eco badge
        const ecoBadge = `<span class="card-badge-eco" title="Eco Score: ${product.eco_score}/100"><i class="fa-solid fa-leaf"></i> ${product.eco_score}</span>`;
        
        // Flash tag
        const flashBadge = isFlash ? `<span class="card-badge-flash"><i class="fa-solid fa-bolt"></i> Flash Sale</span>` : '';

        // Stock indicator / Predictor
        let stockHtml = '';
        if (product.stock === 0) {
            stockHtml = '<div class="stock-warning">Out of Stock</div>';
        } else if (product.stock <= 3) {
            stockHtml = `<div class="stock-warning"><i class="fa-solid fa-triangle-exclamation"></i> Only ${product.stock} left!</div>`;
        } else if (product.stock <= 5) {
            stockHtml = `<div class="stock-good" style="color: var(--accent-color); font-weight: 700;">Selling fast!</div>`;
        } else {
            stockHtml = '<div class="stock-good">In Stock</div>';
        }

        // Compare checklist helper
        const compareList = JSON.parse(localStorage.getItem('compare_products') || '[]');
        const isCompared = compareList.includes(product.id);
        const compareClass = isCompared ? 'active' : '';

        // Wishlist visual helper
        const wishlistClass = product.is_in_wishlist ? 'active' : '';

        return `
            <article class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <a href="#/product/${product.id}">
                        <img src="${product.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}" alt="${product.title}">
                    </a>
                    ${ecoBadge}
                    ${flashBadge}
                    
                    <!-- Quick actions over card -->
                    <div class="card-actions-overlay">
                        <button class="action-btn-circle quick-wishlist-btn ${wishlistClass}" data-id="${product.id}" title="Add to Wishlist">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                        <button class="action-btn-circle quick-compare-btn ${compareClass}" data-id="${product.id}" title="Compare Product">
                            <i class="fa-solid fa-code-compare"></i>
                        </button>
                    </div>
                </div>
                <div class="product-card-details">
                    <span class="product-card-category">${product.category_title || 'Sustainable'}</span>
                    <h3 class="product-card-title">
                        <a href="#/product/${product.id}">${product.title}</a>
                    </h3>
                    <div class="product-card-rating">
                        ${this.renderStars(avgRating)}
                        <span class="rating-count">(${reviewCount})</span>
                    </div>
                    ${stockHtml}
                    <div class="product-card-footer">
                        <div class="product-card-price">
                            <span class="current-price">₹${parseFloat(price).toLocaleString('en-IN')}</span>
                            ${originalPriceHtml}
                        </div>
                        ${product.stock > 0 ? `
                            <button class="add-cart-btn quick-add-cart" data-id="${product.id}" title="Add to Cart">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    },

    // 4. Loading Skeletons
    renderProductGridSkeleton(count = 6) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="product-card">
                    <div class="skeleton skeleton-img" style="width: 100%; aspect-ratio: 4/3;"></div>
                    <div class="product-card-details">
                        <div class="skeleton skeleton-text" style="width: 30%;"></div>
                        <div class="skeleton skeleton-title" style="width: 90%;"></div>
                        <div class="skeleton skeleton-text" style="width: 50%;"></div>
                        <div class="skeleton skeleton-text" style="width: 40%;"></div>
                        <div class="product-card-footer" style="margin-top: 10px;">
                            <div class="skeleton skeleton-text" style="width: 40%; height: 20px;"></div>
                            <div class="skeleton" style="width: 38px; height: 38px; border-radius: 12px;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        return `<div class="products-grid">${html}</div>`;
    },

    renderProductDetailSkeleton() {
        return `
            <div class="product-main-info">
                <div class="product-gallery">
                    <div class="skeleton main-img-wrapper" style="width: 100%; aspect-ratio: 1/1; border-radius: 12px;"></div>
                    <div class="thumbnail-strip">
                        <div class="skeleton thumb-wrapper" style="width: 80px; height: 80px;"></div>
                        <div class="skeleton thumb-wrapper" style="width: 80px; height: 80px;"></div>
                    </div>
                </div>
                <div class="product-meta-col" style="flex: 1;">
                    <div class="skeleton skeleton-text" style="width: 20%;"></div>
                    <div class="skeleton skeleton-title" style="width: 80%; height: 36px;"></div>
                    <div class="skeleton skeleton-text" style="width: 40%;"></div>
                    <div class="skeleton skeleton-text" style="width: 30%; height: 32px; margin-top: 10px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100%; height: 100px; margin-top: 20px;"></div>
                    <div class="skeleton" style="width: 200px; height: 48px; border-radius: 12px; margin-top: 20px;"></div>
                </div>
            </div>
        `;
    }
};
