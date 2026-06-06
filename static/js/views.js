const Views = {
    // --------------------------------------------------------------------------
    // UTILS
    // --------------------------------------------------------------------------
    renderTitle(title) {
        return `<div class="section-wrapper" style="margin-top: 30px; margin-bottom: 20px;">
            <h1 style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800;">${title}</h1>
        </div>`;
    },

    // --------------------------------------------------------------------------
    // HOME VIEW
    // --------------------------------------------------------------------------
    async Home(container) {
        container.innerHTML = `
            <!-- Hero -->
            <section class="hero-section">
                <div class="hero-container">
                    <span class="hero-badge">🌿 Eco-Friendly Shopping</span>
                    <h1>Empower the Planet with Every Purchase</h1>
                    <p>Discover high-quality, sustainable alternatives for everyday items. From recycled electronics to organic fashion, shopping green has never felt this premium.</p>
                    <div class="hero-actions">
                        <a href="#/catalog" class="btn-primary">Shop Catalog</a>
                        <a href="#/catalog?min_eco=90" class="btn-secondary">Super Eco (>90)</a>
                    </div>
                </div>
            </section>
            
            <!-- CategoryStrip -->
            <section class="section-wrapper">
                <div class="section-header">
                    <h2>Shop by <span>Category</span></h2>
                </div>
                <div class="categories-grid" id="home-categories">
                    <!-- Skeletons -->
                    <div class="skeleton" style="height: 100px; border-radius: 12px;"></div>
                    <div class="skeleton" style="height: 100px; border-radius: 12px;"></div>
                    <div class="skeleton" style="height: 100px; border-radius: 12px;"></div>
                    <div class="skeleton" style="height: 100px; border-radius: 12px;"></div>
                </div>
            </section>

            <!-- Flash Sales -->
            <section class="section-wrapper hidden" id="flash-sale-wrapper">
                <div class="flash-sales-banner">
                    <div class="flash-sales-info">
                        <h2><i class="fa-solid fa-bolt"></i> Flash Sales <span>Ending Soon!</span></h2>
                        <p>Exclusive eco-friendly discounts for a limited time.</p>
                    </div>
                    <div class="flash-timer" id="flash-countdown">
                        <div class="timer-box"><span class="timer-num" id="countdown-hours">00</span><span class="timer-lbl">HRS</span></div>
                        <div class="timer-box"><span class="timer-num" id="countdown-mins">00</span><span class="timer-lbl">MINS</span></div>
                        <div class="timer-box"><span class="timer-num" id="countdown-secs">00</span><span class="timer-lbl">SECS</span></div>
                    </div>
                </div>
                <div class="products-grid" id="flash-products"></div>
            </section>

            <!-- Recommendations -->
            <section class="section-wrapper" id="recommendation-section">
                <div class="section-header">
                    <h2>Recommended <span>for You</span></h2>
                </div>
                <div id="home-recommendations">
                    ${Components.renderProductGridSkeleton(3)}
                </div>
            </section>

            <!-- Trending Section -->
            <section class="section-wrapper">
                <div class="section-header">
                    <h2>Trending <span>Now</span></h2>
                    <a href="#/catalog" class="view-all-link">View All <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div id="home-trending">
                    ${Components.renderProductGridSkeleton(3)}
                </div>
            </section>
        `;

        // Load Categories
        API.getCategories().then(cats => {
            const catGrid = document.getElementById('home-categories');
            if (cats && cats.length) {
                catGrid.innerHTML = cats.map(c => `
                    <a href="#/catalog?category=${c.slug}" class="category-card">
                        <img src="${c.image_url}" class="category-img" alt="${c.title}">
                        <h3>${c.title}</h3>
                    </a>
                `).join('');
            } else {
                catGrid.innerHTML = '<p>No categories found.</p>';
            }
        });

        // Load Flash Sales
        API.getFlashSales().then(products => {
            if (products && products.length) {
                document.getElementById('flash-sale-wrapper').classList.remove('hidden');
                const list = document.getElementById('flash-products');
                list.innerHTML = products.map(p => Components.renderProductCard(p)).join('');
                
                // Initialize countdown
                const details = products[0].flash_sale_details;
                if (details && details.time_left_seconds) {
                    let secondsLeft = details.time_left_seconds;
                    const timerInterval = setInterval(() => {
                        if (secondsLeft <= 0) {
                            clearInterval(timerInterval);
                            const wrapper = document.getElementById('flash-sale-wrapper');
                            if (wrapper) wrapper.classList.add('hidden');
                            return;
                        }
                        secondsLeft--;
                        const hrs = Math.floor(secondsLeft / 3600);
                        const mins = Math.floor((secondsLeft % 3600) / 60);
                        const secs = secondsLeft % 60;
                        
                        const hoursEl = document.getElementById('countdown-hours');
                        const minsEl = document.getElementById('countdown-mins');
                        const secsEl = document.getElementById('countdown-secs');
                        
                        if (hoursEl) hoursEl.textContent = hrs.toString().padStart(2, '0');
                        if (minsEl) minsEl.textContent = mins.toString().padStart(2, '0');
                        if (secsEl) secsEl.textContent = secs.toString().padStart(2, '0');
                    }, 1000);
                }
            }

            // Bind Demo button
            const demoBtn = document.getElementById('admin-run-demo-btn');
            if (demoBtn) {
                demoBtn.addEventListener('click', () => runAdminDemo(container));
            }
        });

        // Load Recommendations
        API.getRecommendations().then(products => {
            const recGrid = document.getElementById('home-recommendations');
            if (products && products.length) {
                recGrid.innerHTML = `<div class="products-grid">${products.slice(0, 3).map(p => Components.renderProductCard(p)).join('')}</div>`;
            } else {
                recGrid.innerHTML = '<p class="text-center text-muted">Register to get personalized recommendation insights!</p>';
            }
        });

        // Load Trending
        API.getTrending().then(products => {
            const trendGrid = document.getElementById('home-trending');
            if (products && products.length) {
                trendGrid.innerHTML = `<div class="products-grid">${products.slice(0, 3).map(p => Components.renderProductCard(p)).join('')}</div>`;
            } else {
                trendGrid.innerHTML = '<p>No products trending.</p>';
            }
        });
    },

    // --------------------------------------------------------------------------
    // CATALOG VIEW
    // --------------------------------------------------------------------------
    async Catalog(container, searchParams = {}) {
        container.innerHTML = `
            <div class="catalog-layout">
                <!-- Sidebar Filters -->
                <aside class="catalog-sidebar">
                    <h3 class="sidebar-title">Filters</h3>
                    
                    <div class="filter-group">
                        <h4>Price Range</h4>
                        <div class="price-inputs">
                            <input type="number" id="min-price-input" placeholder="Min" value="${searchParams.min_price || ''}">
                            <input type="number" id="max-price-input" placeholder="Max" value="${searchParams.max_price || ''}">
                        </div>
                    </div>

                    <div class="filter-group">
                        <h4>Categories</h4>
                        <div class="filter-list" id="categories-filter-list">
                            <!-- Populated dynamically -->
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text"></div>
                        </div>
                    </div>

                    <div class="filter-group">
                        <h4>Sustainability Score</h4>
                        <div class="filter-list">
                            <label class="filter-item">
                                <input type="checkbox" name="eco_filter" value="95" ${searchParams.min_eco === '95' ? 'checked' : ''}>
                                Super Eco (>95)
                            </label>
                            <label class="filter-item">
                                <input type="checkbox" name="eco_filter" value="90" ${searchParams.min_eco === '90' ? 'checked' : ''}>
                                Very Eco (>90)
                            </label>
                            <label class="filter-item">
                                <input type="checkbox" name="eco_filter" value="80" ${searchParams.min_eco === '80' ? 'checked' : ''}>
                                Eco-friendly (>80)
                            </label>
                        </div>
                    </div>

                    <button class="btn-filter-apply" id="apply-filters-btn">Apply Filters</button>
                </aside>

                <!-- Product Catalog Content -->
                <section class="catalog-content">
                    <div class="catalog-controls">
                        <div class="control-info">
                            Showing products for: <strong id="catalog-query-label">All</strong>
                        </div>
                        <div class="control-sorting">
                            <select id="catalog-sort" class="sort-select">
                                <option value="" ${!searchParams.sort ? 'selected' : ''}>Featured</option>
                                <option value="price_asc" ${searchParams.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                                <option value="price_desc" ${searchParams.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                                <option value="rating_desc" ${searchParams.sort === 'rating_desc' ? 'selected' : ''}>Customer Rating</option>
                                <option value="newest" ${searchParams.sort === 'newest' ? 'selected' : ''}>New Arrivals</option>
                            </select>
                        </div>
                    </div>

                    <div id="catalog-products-wrapper">
                        ${Components.renderProductGridSkeleton(6)}
                    </div>

                    <!-- Pagination -->
                    <div class="pagination" id="catalog-pagination"></div>
                </section>
            </div>
        `;

        // Display current search filters labels
        let filterLabel = 'All';
        if (searchParams.q) filterLabel = `Search: "${searchParams.q}"`;
        else if (searchParams.category) filterLabel = `Category: ${searchParams.category}`;
        document.getElementById('catalog-query-label').textContent = filterLabel;

        // Fetch Categories for Sidebar checkboxes
        API.getCategories().then(cats => {
            const list = document.getElementById('categories-filter-list');
            list.innerHTML = cats.map(c => `
                <label class="filter-item">
                    <input type="checkbox" name="category_filter" value="${c.slug}" ${searchParams.category === c.slug ? 'checked' : ''}>
                    ${c.title}
                </label>
            `).join('');
        });

        // Trigger loading catalog products
        const loadProducts = async () => {
            try {
                const res = await API.getProducts(searchParams);
                const productsWrapper = document.getElementById('catalog-products-wrapper');
                
                // DRF Paginated results have a `results` field
                const list = res.results || res;
                
                if (list && list.length) {
                    productsWrapper.innerHTML = `<div class="products-grid">${list.map(p => Components.renderProductCard(p)).join('')}</div>`;
                    
                    // Render Pagination
                    const pag = document.getElementById('catalog-pagination');
                    if (res.count && res.count > 12) {
                        const totalPages = Math.ceil(res.count / 12);
                        const currentPage = parseInt(searchParams.page || 1);
                        let pagHtml = `
                            <button class="page-btn" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                        `;
                        for (let i = 1; i <= totalPages; i++) {
                            pagHtml += `
                                <button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">
                                    ${i}
                                </button>
                            `;
                        }
                        pagHtml += `
                            <button class="page-btn" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        `;
                        pag.innerHTML = pagHtml;
                        
                        // Add handlers
                        pag.querySelectorAll('[data-page]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                searchParams.page = btn.dataset.page;
                                window.location.hash = `#/catalog?${new URLSearchParams(searchParams).toString()}`;
                            });
                        });
                        const prev = document.getElementById('prev-page');
                        if (prev) prev.addEventListener('click', () => {
                            searchParams.page = currentPage - 1;
                            window.location.hash = `#/catalog?${new URLSearchParams(searchParams).toString()}`;
                        });
                        const next = document.getElementById('next-page');
                        if (next) next.addEventListener('click', () => {
                            searchParams.page = currentPage + 1;
                            window.location.hash = `#/catalog?${new URLSearchParams(searchParams).toString()}`;
                        });
                    } else {
                        pag.innerHTML = '';
                    }
                } else {
                    productsWrapper.innerHTML = '<div class="text-center text-muted" style="padding: 40px;"><i class="fa-solid fa-box-open" style="font-size: 40px; margin-bottom:10px;"></i><p>No products match your criteria.</p></div>';
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadProducts();

        // Apply filters handler
        document.getElementById('apply-filters-btn').addEventListener('click', () => {
            const minPrice = document.getElementById('min-price-input').value;
            const maxPrice = document.getElementById('max-price-input').value;
            
            // Checkboxes
            const selectedCats = Array.from(document.querySelectorAll('input[name="category_filter"]:checked')).map(cb => cb.value);
            const selectedEcos = Array.from(document.querySelectorAll('input[name="eco_filter"]:checked')).map(cb => cb.value);
            
            const params = { ...searchParams };
            if (minPrice) params.min_price = minPrice; else delete params.min_price;
            if (maxPrice) params.max_price = maxPrice; else delete params.max_price;
            if (selectedCats.length) params.category = selectedCats[0]; else delete params.category; // Simple single category support in DRF query
            if (selectedEcos.length) params.min_eco = Math.min(...selectedEcos); else delete params.min_eco;
            params.page = 1; // reset to page 1

            window.location.hash = `#/catalog?${new URLSearchParams(params).toString()}`;
        });

        // Sorting handler
        document.getElementById('catalog-sort').addEventListener('change', (e) => {
            const params = { ...searchParams, sort: e.target.value, page: 1 };
            window.location.hash = `#/catalog?${new URLSearchParams(params).toString()}`;
        });
    },

    // --------------------------------------------------------------------------
    // PRODUCT DETAILS VIEW
    // --------------------------------------------------------------------------
    async Product(container, params, id) {
        container.innerHTML = `<div class="product-details-container">${Components.renderProductDetailSkeleton()}</div>`;
        
        try {
            const product = await API.getProduct(id);
            const detailContainer = container.querySelector('.product-details-container');
            
            // Calc stats
            const avgRating = product.average_rating || 0;
            const reviewCount = product.reviews_count || 0;
            
            // Price drop calculations
            let price = product.price;
            let originalPrice = product.original_price;
            let isFlash = false;
            if (product.flash_sale_details) {
                price = product.flash_sale_details.discount_price;
                originalPrice = product.price;
                isFlash = true;
            }
            
            const hasDiscount = Number(originalPrice) > Number(price);
            const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
            
            // Watch button active check
            const watchActive = product.is_watched;
            const watchClass = watchActive ? 'active' : '';

            // Stock Availability text
            let stockHtml = '';
            if (product.stock === 0) {
                stockHtml = '<span class="stock-warning">Out of Stock</span>';
            } else if (product.stock <= 3) {
                stockHtml = `<span class="stock-warning"><i class="fa-solid fa-triangle-exclamation"></i> Only ${product.stock} left - order soon!</span>`;
            } else if (product.stock <= 5) {
                stockHtml = `<span class="stock-warning" style="color: var(--accent-color);"><i class="fa-solid fa-fire"></i> Liked by many, only ${product.stock} left!</span>`;
            } else {
                stockHtml = '<span class="stock-good" style="color: var(--primary-color)"><i class="fa-solid fa-circle-check"></i> In Stock</span>';
            }

            detailContainer.innerHTML = `
                <div class="product-main-info">
                    <!-- Gallery -->
                    <div class="product-gallery">
                        <div class="main-img-wrapper">
                            <img src="${product.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}" id="detail-main-img" alt="${product.title}">
                        </div>
                        <div class="thumbnail-strip" id="detail-thumb-strip">
                            <div class="thumb-wrapper active" data-url="${product.image_url}">
                                <img src="${product.image_url}" alt="Thumbnail">
                            </div>
                            ${(product.images || []).map(img => `
                                <div class="thumb-wrapper" data-url="${img.image_url}">
                                    <img src="${img.image_url}" alt="Gallery Thumbnail">
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Meta details -->
                    <div class="product-meta-col">
                        <span class="product-category-path">Shop &gt; ${product.category_title || 'Sustainable'}</span>
                        <h1 class="product-details-title">${product.title}</h1>
                        
                        <div class="details-rating-strip">
                            ${Components.renderStars(avgRating)}
                            <span class="rating-count">${reviewCount} reviews</span>
                            <span class="eco-details-badge" title="Sustainability Index">
                                <i class="fa-solid fa-leaf"></i> Eco Score: ${product.eco_score}/100
                            </span>
                            ${stockHtml}
                        </div>

                        <div class="product-details-price">
                            <span class="price-now">₹${parseFloat(price).toLocaleString('en-IN')}</span>
                            ${hasDiscount ? `
                                <span class="price-was">₹${parseFloat(originalPrice).toLocaleString('en-IN')}</span>
                                <span class="discount-percentage">${discountPct}% OFF</span>
                            ` : ''}
                        </div>

                        <!-- Eco Score indicator -->
                        <div class="eco-rating-strip">
                            <span style="font-size: 13px; font-weight: 700; display:flex; align-items:center; gap: 6px;">
                                <i class="fa-solid fa-seedling" style="color: var(--primary-color)"></i> Sustainability Impact Score: ${product.eco_score}/100
                            </span>
                            <div class="eco-progress-bar">
                                <div class="eco-progress" style="width: ${product.eco_score}%"></div>
                            </div>
                            <p style="font-size: 11px; margin-top:6px; color: var(--text-secondary)">Products with high Eco Scores utilize recycled components, organic inputs, and low-waste packaging materials.</p>
                        </div>

                        <div class="product-details-desc">
                            ${product.description}
                        </div>

                        <!-- Purchase buttons -->
                        <div class="purchase-controls">
                            ${product.stock > 0 ? `
                                <div class="qty-spinner">
                                    <button class="qty-btn" id="qty-dec">-</button>
                                    <span class="qty-val" id="qty-val">1</span>
                                    <button class="qty-btn" id="qty-inc">+</button>
                                </div>
                                <button class="btn-add-to-cart" id="add-to-cart-detail">
                                    <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                                </button>
                            ` : ''}
                            
                            <!-- Smart Price Watcher trigger -->
                            <button class="btn-watch-price ${watchClass}" id="watch-price-btn">
                                <i class="fa-solid fa-bell"></i> Watch Price
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Purchase Insights: Frequently bought & Customers also viewed -->
                <div class="section-wrapper" style="padding:0; margin-bottom: 40px;">
                    <h3 style="font-family:'Outfit',sans-serif; margin-bottom: 20px; font-size:20px;">Frequently Bought Together</h3>
                    <div id="freq-bought-grid" class="products-grid">
                        <p class="text-muted">Loading combinations...</p>
                    </div>
                </div>

                <div class="section-wrapper" style="padding:0; margin-bottom: 40px;">
                    <h3 style="font-family:'Outfit',sans-serif; margin-bottom: 20px; font-size:20px;">Customers Also Viewed</h3>
                    <div id="customers-viewed-grid" class="products-grid">
                        <p class="text-muted">Loading views...</p>
                    </div>
                </div>

                <!-- Reviews and rating system tabs -->
                <div class="details-tabs">
                    <button class="tab-btn active">Reviews (${reviewCount})</button>
                </div>

                <div class="reviews-grid">
                    <div class="review-summary">
                        <div class="summary-rating-num">${avgRating}</div>
                        ${Components.renderStars(avgRating)}
                        <p style="font-size: 13px; color:var(--text-secondary); margin-top:10px;">Based on ${reviewCount} reviews</p>
                        
                        <!-- Review form -->
                        <div class="review-form">
                            <h4>Write a Review</h4>
                            <div class="star-rating-select" id="star-rating-select">
                                <i class="fa-solid fa-star star-select" data-rating="1"></i>
                                <i class="fa-solid fa-star star-select" data-rating="2"></i>
                                <i class="fa-solid fa-star star-select" data-rating="3"></i>
                                <i class="fa-solid fa-star star-select" data-rating="4"></i>
                                <i class="fa-solid fa-star star-select" data-rating="5"></i>
                            </div>
                            <textarea id="review-comment" placeholder="What did you think of this sustainable product?"></textarea>
                            <button class="btn-primary" style="background-color: var(--primary-color); color:white; width:100%;" id="submit-review-btn">Submit Review</button>
                        </div>
                    </div>

                    <div class="reviews-list" id="reviews-list-target">
                        ${product.reviews && product.reviews.length ? 
                            product.reviews.map(r => `
                                <div class="review-item">
                                    <div class="review-item-header">
                                        <span class="review-user">${r.username}</span>
                                        <span class="review-date">${new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    ${Components.renderStars(r.rating)}
                                    <p class="review-comment" style="margin-top:10px;">${r.comment}</p>
                                </div>
                            `).join('') : '<p class="text-muted">No reviews yet for this product. Be the first to write one!</p>'
                        }
                    </div>
                </div>
            `;

            // Thumbnails toggle
            detailContainer.querySelectorAll('.thumb-wrapper').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    detailContainer.querySelectorAll('.thumb-wrapper').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    document.getElementById('detail-main-img').src = thumb.dataset.url;
                });
            });

            // Qty adjustments
            let qty = 1;
            const qtyVal = document.getElementById('qty-val');
            const dec = document.getElementById('qty-dec');
            const inc = document.getElementById('qty-inc');
            if (dec) {
                dec.addEventListener('click', () => {
                    if (qty > 1) {
                        qty--;
                        qtyVal.textContent = qty;
                    }
                });
                inc.addEventListener('click', () => {
                    if (qty < product.stock) {
                        qty++;
                        qtyVal.textContent = qty;
                    }
                });
            }

            // Cart Placement
            const cartBtn = document.getElementById('add-to-cart-detail');
            if (cartBtn) {
                cartBtn.addEventListener('click', async () => {
                    try {
                        await API.addToCart(product.id, qty);
                        Components.showToast("Product added to cart!");
                        window.dispatchEvent(new Event('cart_change'));
                    } catch (e) {
                        Components.showToast("Please log in to add items to cart.", "error");
                    }
                });
            }

            // Price watcher Modal setup
            document.getElementById('watch-price-btn').addEventListener('click', async () => {
                if (!API.getAccessToken()) {
                    Components.showToast("Please login to setup price drop watches.", "error");
                    return;
                }
                
                const inputPrice = prompt("Enter target price to watch (₹):", Math.round(product.price * 0.9));
                if (inputPrice) {
                    const priceVal = parseFloat(inputPrice);
                    if (isNaN(priceVal) || priceVal <= 0) {
                        alert("Invalid price value.");
                        return;
                    }
                    try {
                        await API.watchPrice(product.id, priceVal);
                        Components.showToast(`Watching price drop at ₹${priceVal}!`);
                        document.getElementById('watch-price-btn').classList.add('active');
                    } catch (e) {
                        Components.showToast("Watch creation failed.", "error");
                    }
                }
            });

            // Stars hover handler
            let selectedRating = 0;
            const stars = detailContainer.querySelectorAll('.star-select');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    selectedRating = parseInt(star.dataset.rating);
                    stars.forEach((s, idx) => {
                        if (idx < selectedRating) s.classList.add('active');
                        else s.classList.remove('active');
                    });
                });
            });

            // Review submission handler
            document.getElementById('submit-review-btn').addEventListener('click', async () => {
                const comment = document.getElementById('review-comment').value;
                if (selectedRating === 0) {
                    Components.showToast("Please pick a star rating first.", "error");
                    return;
                }
                if (!comment) {
                    Components.showToast("Please write a comment.", "error");
                    return;
                }
                try {
                    const res = await API.addReview(product.id, selectedRating, comment);
                    Components.showToast("Review submitted! +15 Eco Points!");
                    // Reload view to see review
                    Views.Product(container, id);
                } catch (e) {
                    Components.showToast("Error submitting review. You may have reviewed already.", "error");
                }
            });

            // Frequently bought together load
            API.getFrequentlyBought(product.id).then(products => {
                const grid = document.getElementById('freq-bought-grid');
                if (products && products.length) {
                    grid.innerHTML = products.map(p => Components.renderProductCard(p)).join('');
                } else {
                    grid.innerHTML = '<p class="text-muted">No combo data available.</p>';
                }
            });

            // Customers also viewed load
            API.getCustomersAlsoViewed(product.id).then(products => {
                const grid = document.getElementById('customers-viewed-grid');
                if (products && products.length) {
                    grid.innerHTML = products.map(p => Components.renderProductCard(p)).join('');
                } else {
                    grid.innerHTML = '<p class="text-muted">No viewing patterns loaded.</p>';
                }
            });

        } catch (err) {
            console.error(err);
            detailContainer.innerHTML = '<p>Error loading product.</p>';
        }
    },

    // --------------------------------------------------------------------------
    // CART VIEW
    // --------------------------------------------------------------------------
    async Cart(container) {
        container.innerHTML = `
            ${this.renderTitle('Shopping Cart')}
            <div class="cart-layout">
                <!-- Cart list -->
                <div class="cart-items-section">
                    <div class="cart-list" id="active-cart-list">
                        <p class="text-muted">Loading cart...</p>
                    </div>

                    <div style="margin-top: 50px;">
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom: 20px; font-size: 20px;">Saved for Later</h3>
                        <div class="cart-list" id="saved-cart-list">
                            <p class="text-muted">No saved items.</p>
                        </div>
                    </div>
                </div>

                <!-- Summary side-box -->
                <aside class="cart-summary-section">
                    <div class="summary-box" id="cart-summary-box">
                        <p class="text-muted">Recalculating...</p>
                    </div>
                </aside>
            </div>
        `;

        const reloadCart = async () => {
            try {
                const active = await API.getCart(false);
                const saved = await API.getCart(true);
                
                const activeList = document.getElementById('active-cart-list');
                const savedList = document.getElementById('saved-cart-list');
                const summaryBox = document.getElementById('cart-summary-box');

                // Render active
                if (active && active.length) {
                    activeList.innerHTML = active.map(item => `
                        <div class="cart-card" data-id="${item.id}">
                            <img src="${item.product.image_url}" class="cart-card-img" alt="${item.product.title}">
                            <div class="cart-card-details">
                                <h4 class="cart-card-title"><a href="#/product/${item.product.id}">${item.product.title}</a></h4>
                                <span class="product-card-category" style="margin-bottom:10px;">Eco Score: ${item.product.eco_score}/100</span>
                                <div class="cart-card-actions">
                                    <div class="qty-spinner" style="height:32px;">
                                        <button class="qty-btn change-qty-btn" data-id="${item.id}" data-offset="-1">-</button>
                                        <span class="qty-val">${item.quantity}</span>
                                        <button class="qty-btn change-qty-btn" data-id="${item.id}" data-offset="1">+</button>
                                    </div>
                                    <button class="save-cart-item" data-id="${item.id}">Save for later</button>
                                    <button class="remove-cart-item" data-id="${item.id}">Remove</button>
                                </div>
                            </div>
                            <div class="cart-card-price">
                                <span class="cart-item-price">₹${parseFloat(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                                <span class="text-muted" style="font-size:11px;">₹${item.product.price} each</span>
                            </div>
                        </div>
                    `).join('');

                    // Math totals
                    const subtotal = active.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
                    const shipping = subtotal > 1500 ? 0 : 99; // Free shipping > ₹1500
                    const total = subtotal + shipping;

                    summaryBox.innerHTML = `
                        <h3 class="summary-title">Order Summary</h3>
                        <div class="summary-row"><span>Subtotal (${active.length} items)</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
                        <div class="summary-row"><span>Eco Delivery Shipping</span><span>${shipping === 0 ? '<span style="color:var(--primary-color)">FREE</span>' : '₹' + shipping}</span></div>
                        <div class="summary-row" style="font-size:11px; color:var(--primary-color);">🌿 Eco-friendly packaging included!</div>
                        <div class="summary-row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
                        <a href="#/checkout" class="checkout-btn">
                            Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    `;
                } else {
                    activeList.innerHTML = `
                        <div class="text-center text-muted" style="padding: 40px; background-color: var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px;">
                            <i class="fa-solid fa-basket-shopping" style="font-size: 40px; margin-bottom: 12px; color:var(--text-muted)"></i>
                            <p>Your shopping cart is currently empty.</p>
                            <a href="#/catalog" class="btn-primary" style="margin-top:16px; display:inline-block; font-size:14px; background-color: var(--primary-color); color:white;">Go Shopping</a>
                        </div>
                    `;
                    summaryBox.innerHTML = `
                        <h3 class="summary-title">Order Summary</h3>
                        <p class="text-muted">No items to compute.</p>
                    `;
                }

                // Render saved for later
                if (saved && saved.length) {
                    savedList.innerHTML = saved.map(item => `
                        <div class="cart-card" data-id="${item.id}" style="opacity: 0.85;">
                            <img src="${item.product.image_url}" class="cart-card-img" alt="${item.product.title}">
                            <div class="cart-card-details">
                                <h4 class="cart-card-title"><a href="#/product/${item.product.id}">${item.product.title}</a></h4>
                                <div class="cart-card-actions">
                                    <button class="save-cart-item" style="color:var(--primary-color)" data-id="${item.id}">Move to Cart</button>
                                    <button class="remove-cart-item" data-id="${item.id}">Remove</button>
                                </div>
                            </div>
                            <div class="cart-card-price">
                                <span class="cart-item-price">₹${item.product.price}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    savedList.innerHTML = '<p class="text-muted">No saved items.</p>';
                }

                // Setup Action Handlers
                const addHandlers = (listSelector) => {
                    const listElement = document.getElementById(listSelector);
                    if (!listElement) return;

                    // Qty changer
                    listElement.querySelectorAll('.change-qty-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const itemId = btn.dataset.id;
                            const offset = parseInt(btn.dataset.offset);
                            const currentItem = active.find(i => i.id == itemId);
                            if (currentItem) {
                                const newQty = currentItem.quantity + offset;
                                if (newQty < 1) return;
                                try {
                                    await API.updateCartQuantity(itemId, newQty);
                                    reloadCart();
                                    window.dispatchEvent(new Event('cart_change'));
                                } catch (e) {
                                    alert("Not enough stock available.");
                                }
                            }
                        });
                    });

                    // Save / Move toggler
                    listElement.querySelectorAll('.save-cart-item').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            await API.toggleSaveLater(btn.dataset.id);
                            reloadCart();
                            window.dispatchEvent(new Event('cart_change'));
                        });
                    });

                    // Remove item
                    listElement.querySelectorAll('.remove-cart-item').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            await API.removeFromCart(btn.dataset.id);
                            reloadCart();
                            window.dispatchEvent(new Event('cart_change'));
                        });
                    });
                };

                addHandlers('active-cart-list');
                addHandlers('saved-cart-list');

            } catch (err) {
                console.error(err);
                container.innerHTML = '<p class="text-center text-muted">Please log in to view your shopping cart.</p>';
            }
        };

        reloadCart();
    },

    // --------------------------------------------------------------------------
    // CHECKOUT VIEW
    // --------------------------------------------------------------------------
    async Checkout(container) {
        container.innerHTML = `
            ${this.renderTitle('Secure Checkout')}
            <div class="checkout-layout">
                <!-- Address & Shipping selector -->
                <div style="flex-grow: 1;">
                    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom: 20px;">1. Shipping Address</h3>
                        <div class="address-select-grid" id="checkout-address-list">
                            <p class="text-muted">Loading addresses...</p>
                        </div>
                        <button class="btn-secondary" style="font-size:13px; padding:8px 16px; border-radius:6px;" id="add-checkout-address-btn">+ Add New Address</button>
                    </div>

                    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius:12px; padding: 24px;">
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom: 20px;">2. Payment Method</h3>
                        <p style="font-size:13px; color: var(--text-secondary);"><i class="fa-solid fa-shield-halved" style="color:var(--primary-color)"></i> Currently supporting cash on delivery / test checkout simulator. Fully secure.</p>
                    </div>
                </div>

                <!-- Order items summary -->
                <aside class="cart-summary-section">
                    <div class="summary-box">
                        <h3 class="summary-title">Place Order</h3>
                        <div id="checkout-items-summary" style="max-height: 200px; overflow-y:auto; margin-bottom: 20px;"></div>
                        <div id="checkout-total-summary"></div>
                        <button class="checkout-btn" id="place-order-btn" style="background-color: var(--primary-color)">Place Order</button>
                    </div>
                </aside>
            </div>
        `;

        const loadAddresses = async () => {
            const list = document.getElementById('checkout-address-list');
            try {
                const addresses = await API.getAddresses();
                if (addresses && addresses.length) {
                    list.innerHTML = addresses.map(addr => `
                        <label class="address-card ${addr.is_default ? 'selected' : ''}">
                            <input type="radio" name="selected_address" value="${addr.id}" ${addr.is_default ? 'checked' : ''}>
                            <div class="address-name">${addr.street_address}</div>
                            <div class="address-details">${addr.city}, ${addr.state} - ${addr.postal_code}</div>
                        </label>
                    `).join('');

                    // Selected class helper
                    list.querySelectorAll('input[type="radio"]').forEach(rad => {
                        rad.addEventListener('change', () => {
                            list.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
                            rad.closest('.address-card').classList.add('selected');
                        });
                    });
                } else {
                    list.innerHTML = '<p class="text-muted">No addresses saved. Please create one.</p>';
                }
            } catch (e) {
                list.innerHTML = '<p>Error loading addresses.</p>';
            }
        };

        loadAddresses();

        // Get Cart details
        try {
            const active = await API.getCart(false);
            const itemsDiv = document.getElementById('checkout-items-summary');
            const totalDiv = document.getElementById('checkout-total-summary');

            if (active && active.length) {
                itemsDiv.innerHTML = active.map(item => `
                    <div style="display:flex; justify-content:space-between; font-size:12.5px; border-bottom:1px solid var(--border-color); padding: 8px 0;">
                        <span style="width: 70%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.product.title} x ${item.quantity}</span>
                        <span>₹${parseFloat(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                `).join('');

                const subtotal = active.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
                const shipping = subtotal > 1500 ? 0 : 99;
                const total = subtotal + shipping;

                totalDiv.innerHTML = `
                    <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
                    <div class="summary-row"><span>Eco Shipping</span><span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span></div>
                    <div class="summary-row total"><span>Total Amount</span><span>₹${total.toLocaleString('en-IN')}</span></div>
                `;

                // Place Order Handler
                document.getElementById('place-order-btn').addEventListener('click', async () => {
                    const activeRadio = document.querySelector('input[name="selected_address"]:checked');
                    if (!activeRadio) {
                        Components.showToast("Please choose a shipping address.", "error");
                        return;
                    }
                    try {
                        const order = await API.placeOrder(activeRadio.value);
                        Components.showToast("Order placed successfully! Eco points rewarded!");
                        window.dispatchEvent(new Event('cart_change'));
                        // Move to profile to track order
                        window.location.hash = '#/profile';
                    } catch (e) {
                        let message = "Order placement failed.";
                        try {
                            const err = JSON.parse(e.message || '{}');
                            message = err.error || err.detail || e.message || message;
                        } catch (_err) {
                            message = e.message || message;
                        }
                        Components.showToast(message, "error");
                    }
                });

            } else {
                window.location.hash = '#/cart';
            }
        } catch (e) {
            console.error(e);
        }

        // Add new Address handler
        document.getElementById('add-checkout-address-btn').addEventListener('click', async () => {
            const street = prompt("Enter Street Address:");
            const city = prompt("Enter City:");
            const state = prompt("Enter State:");
            const zip = prompt("Enter Postal Code:");
            if (street && city && state && zip) {
                try {
                    await API.addAddress({
                        street_address: street,
                        city,
                        state,
                        postal_code: zip,
                        is_default: true
                    });
                    Components.showToast("New address added!");
                    loadAddresses();
                } catch (e) {
                    Components.showToast("Failed to save address.", "error");
                }
            }
        });
    },

    // --------------------------------------------------------------------------
    // PROFILE VIEW & GAMIFICATION DETAILS
    // --------------------------------------------------------------------------
    async Profile(container) {
        container.innerHTML = `
            <div class="profile-layout">
                <!-- User gamification card -->
                <div class="profile-card-header" id="profile-card-header">
                    <p class="text-muted">Loading profile details...</p>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 30px;">
                    <!-- Orders History & Timelines -->
                    <div>
                        <h2 style="font-family:'Outfit',sans-serif; margin-bottom: 24px;">Order Tracking History</h2>
                        <div id="profile-orders-list">
                            <p class="text-muted">Loading order log...</p>
                        </div>
                    </div>

                    <!-- Price drop watch list -->
                    <div>
                        <h2 style="font-family:'Outfit',sans-serif; margin-bottom: 24px;">Price Watchlist 📉</h2>
                        <div class="reviews-list" id="price-watches-list" style="display:flex; flex-direction:column; gap:16px;">
                            <p class="text-muted">Checking watchers...</p>
                        </div>
                    </div>
                </div>
            </div>

                <div style="margin-top:30px;">
                    <h3 style="font-family:'Outfit',sans-serif; margin-bottom:12px;">Recent Restock Logs</h3>
                    <div class="admin-table-wrapper" style="margin-bottom:30px;">
                        <table class="admin-table" id="admin-restock-logs-table">
                            <thead>
                                <tr><th>When</th><th>Product</th><th>By</th><th>Qty</th><th>Prev → New</th><th>Note</th></tr>
                            </thead>
                            <tbody id="admin-restock-logs-body">
                                <tr><td colspan="6" class="text-center text-muted">Loading restock logs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
        `;

        try {
            // Load user data
            const user = await API.getProfile();
            const header = document.getElementById('profile-card-header');
            
            // Calculate gamification percentages
            const pointsToNextLevel = 100 - (user.points % 100);
            const levelProgress = user.points % 100;

            header.innerHTML = `
                <div class="profile-avatar-lg">
                    ${user.username[0].toUpperCase()}
                </div>
                <div class="gamification-widget">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h2 style="font-family:'Outfit',sans-serif; font-size:24px; font-weight:800; margin-bottom:4px;">Hello, ${user.username}</h2>
                            <p style="font-size:12.5px; color:var(--text-secondary);"><i class="fa-solid fa-phone"></i> ${user.phone || 'No phone set'} | <i class="fa-solid fa-envelope"></i> ${user.email}</p>
                        </div>
                        <button class="btn-secondary-sm" id="logout-btn" style="background-color:var(--danger-color); color:white; border-radius:6px; padding:6px 12px;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
                    </div>

                    <!-- Gamification tracker -->
                    <div style="margin-top: 20px;">
                        <div class="game-level-row">
                            <span>Level ${user.level} Green Ambassador</span>
                            <span style="font-size:13px; color: var(--text-secondary);">${user.points} Eco Points</span>
                        </div>
                        <div class="game-level-bar">
                            <div class="game-level-progress" style="width: ${levelProgress}%"></div>
                        </div>
                        <div class="game-stats">
                            <span>🚀 ${pointsToNextLevel} points to Level ${user.level + 1}</span>
                            <span>🌱 Level multiplier active: ${user.level}x points reward booster!</span>
                        </div>
                    </div>

                    <!-- Badges section -->
                    <div style="margin-top:20px;">
                        <span style="font-size:13px; font-weight:700; display:block; margin-bottom:8px;">Earned Badges (${user.badges.length})</span>
                        <div class="badges-row">
                            ${user.badges.length ? user.badges.map(b => `
                                <div class="badge-pill" title="${b.badge.description}">
                                    <i class="${b.badge.icon_class}" style="color:var(--accent-color)"></i>
                                    <span>${b.badge.name}</span>
                                </div>
                            `).join('') : '<p class="text-muted" style="font-size:12px;">Complete purchases to earn your first badge!</p>'}
                        </div>
                    </div>
                </div>
            `;

            // Logout listener
            document.getElementById('logout-btn').addEventListener('click', () => {
                API.logout();
                Components.showToast("Logged out successfully.");
                window.location.hash = '#/';
            });

            // Load Orders History with Tracking Timeline
            const orders = await API.getOrders();
            const ordersList = document.getElementById('profile-orders-list');
            
            if (orders && orders.length) {
                ordersList.innerHTML = orders.map(order => {
                    const orderDate = new Date(order.created_at).toLocaleDateString();
                    
                    // Tracking states
                    const statusVal = order.status;
                    const steps = ['Processing', 'Packed', 'Shipped', 'Delivered'];
                    const currentStepIdx = steps.indexOf(statusVal);

                    const timelineHtml = steps.map((step, idx) => {
                        let activeClass = '';
                        let icon = '<i class="fa-regular fa-circle"></i>';
                        if (idx <= currentStepIdx) {
                            activeClass = 'active';
                            icon = '<i class="fa-solid fa-circle-check"></i>';
                        }
                        if (idx === currentStepIdx && statusVal !== 'Delivered') {
                            icon = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        }
                        return `
                            <div class="tracking-step ${activeClass}">
                                <div class="step-indicator">${icon}</div>
                                <span>${step}</span>
                            </div>
                        `;
                    }).join('');

                    return `
                        <div class="order-history-card">
                            <div class="order-history-header">
                                <div>Order ID: <strong>#${order.id}</strong></div>
                                <div>Date: <strong>${orderDate}</strong></div>
                                <div>Total: <strong>₹${parseFloat(order.total_amount).toLocaleString('en-IN')}</strong></div>
                            </div>
                            
                            <!-- Nested items in order -->
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                ${order.items.map(item => `
                                    <div style="display:flex; justify-content:space-between; font-size:13px;">
                                        <span>${item.product.title} x ${item.quantity}</span>
                                        <strong>₹${parseFloat(item.price * item.quantity).toLocaleString('en-IN')}</strong>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Timeline -->
                            <div class="order-tracking-timeline">
                                ${timelineHtml}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                ordersList.innerHTML = '<p class="text-muted">You have not placed any orders yet.</p>';
            }

            // Load Price Watchlists
            const watches = await API.getPriceWatches();
            const watchesList = document.getElementById('price-watches-list');
            if (watches && watches.length) {
                watchesList.innerHTML = watches.map(w => `
                    <div class="cart-card" style="padding: 12px; gap: 12px;">
                        <img src="${w.product_image}" style="width: 50px; height:50px; border-radius:4px; object-fit:cover;">
                        <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center;">
                            <h5 style="font-size:13px; font-weight:700; margin-bottom:2px;">${w.product_title}</h5>
                            <span style="font-size:11px; color:var(--text-secondary)">Target Watch: <strong>₹${w.target_price}</strong> (Current: ₹${w.product_price})</span>
                        </div>
                        <button class="remove-watch-btn" data-id="${w.id}" style="color:var(--danger-color); font-size:14px;" title="Stop Watching"><i class="fa-solid fa-bell-slash"></i></button>
                    </div>
                `).join('');

                watchesList.querySelectorAll('.remove-watch-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        await API.removePriceWatch(btn.dataset.id);
                        Components.showToast("Removed from watchlist.");
                        Views.Profile(container);
                    });
                });
            } else {
                watchesList.innerHTML = '<p class="text-muted" style="font-size:13px;">No watched items. Select "Watch Price" on product page to track price drops.</p>';
            }

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-center text-muted">Please log in to access your profile.</p>';
        }
    },

    // --------------------------------------------------------------------------
    // COMPARE PRODUCTS VIEW
    // --------------------------------------------------------------------------
    async Compare(container) {
        const compareIds = JSON.parse(localStorage.getItem('compare_products') || '[]');
        container.innerHTML = `
            ${this.renderTitle('Product Comparison')}
            <div class="section-wrapper" id="compare-workspace">
                <p class="text-muted">Loading compare sheet...</p>
            </div>
        `;

        const workspace = document.getElementById('compare-workspace');

        if (compareIds.length === 0) {
            workspace.innerHTML = `
                <div class="text-center text-muted" style="padding: 40px; background-color: var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px;">
                    <i class="fa-solid fa-code-compare" style="font-size:40px; margin-bottom: 12px;"></i>
                    <p>No products selected for comparison. Add items via catalog or product pages.</p>
                </div>
            `;
            return;
        }

        try {
            // Fetch product details for all IDs in comparison list
            const products = await Promise.all(compareIds.map(id => API.getProduct(id)));

            let tableRows = `
                <tr>
                    <th>Attributes</th>
                    ${products.map(p => `
                        <th>
                            <img src="${p.image_url}" class="compare-table-image">
                            <h4 style="font-size:14px; font-weight:700;"><a href="#/product/${p.id}">${p.title}</a></h4>
                            <button class="remove-compare-th-btn" data-id="${p.id}" style="color:var(--danger-color); font-size:11px; font-weight:700; margin-top:8px;">[ Remove ]</button>
                        </th>
                    `).join('')}
                </tr>
                <tr>
                    <td><strong>Price</strong></td>
                    ${products.map(p => `<td><strong>₹${p.price}</strong></td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Eco Score Rating</strong></td>
                    ${products.map(p => `<td><span class="eco-details-badge" style="display:inline-flex;"><i class="fa-solid fa-leaf"></i> ${p.eco_score}/100</span></td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Reviews</strong></td>
                    ${products.map(p => `<td>${Components.renderStars(p.average_rating || 0)} (${p.reviews_count} reviews)</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Stock Availability</strong></td>
                    ${products.map(p => `<td>${p.stock > 0 ? `<span style="color:var(--primary-color); font-weight:700;">In Stock (${p.stock})</span>` : '<span style="color:var(--danger-color); font-weight:700;">Out of Stock</span>'}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Description</strong></td>
                    ${products.map(p => `<td style="font-size:12px; color:var(--text-secondary); text-align:left; max-width:250px;">${p.description.slice(0, 150)}...</td>`).join('')}
                </tr>
            `;

            workspace.innerHTML = `
                <table class="compare-table">
                    ${tableRows}
                </table>
            `;

            // Delete comparison action
            workspace.querySelectorAll('.remove-compare-th-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pid = parseInt(btn.dataset.id);
                    const updated = compareIds.filter(id => id !== pid);
                    localStorage.setItem('compare_products', JSON.stringify(updated));
                    Components.showToast("Removed product from comparison.");
                    window.dispatchEvent(new Event('compare_change'));
                    this.Compare(container); // reload view
                });
            });

        } catch (e) {
            console.error(e);
            workspace.innerHTML = '<p>Error loading product details for comparison.</p>';
        }
    },

    // --------------------------------------------------------------------------
    // WISHLIST VIEW
    // --------------------------------------------------------------------------
    async Wishlist(container) {
        container.innerHTML = `
            ${this.renderTitle('My Wishlist')}
            <div class="section-wrapper" id="wishlist-workspace">
                ${Components.renderProductGridSkeleton(3)}
            </div>
        `;

        try {
            const list = await API.getWishlist();
            const ws = document.getElementById('wishlist-workspace');
            
            if (list && list.length) {
                ws.innerHTML = `<div class="products-grid">${list.map(item => Components.renderProductCard(item.product)).join('')}</div>`;
            } else {
                ws.innerHTML = `
                    <div class="text-center text-muted" style="padding: 40px; background-color: var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px;">
                        <i class="fa-solid fa-heart" style="font-size:40px; margin-bottom: 12px; color:var(--text-muted)"></i>
                        <p>Your wishlist is empty.</p>
                    </div>
                `;
            }
        } catch (e) {
            console.error(e);
            document.getElementById('wishlist-workspace').innerHTML = '<p class="text-center text-muted">Please log in to view your wishlist.</p>';
        }
    },

    // --------------------------------------------------------------------------
    // ADMIN DASHBOARD & ANALYTICS VIEW
    // --------------------------------------------------------------------------
    async AdminDashboard(container) {
        container.innerHTML = `
            ${this.renderTitle('Admin Operations Dashboard')}
            
            <div class="section-wrapper">
                <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
                    <button id="admin-run-demo-btn" class="btn-secondary" style="padding:8px 12px;">Run Demo</button>
                </div>
                <!-- Stat totals grids -->
                <div class="admin-grid" id="admin-stats-grid">
                    <div class="skeleton" style="height:100px; border-radius:8px;"></div>
                    <div class="skeleton" style="height:100px; border-radius:8px;"></div>
                    <div class="skeleton" style="height:100px; border-radius:8px;"></div>
                    <div class="skeleton" style="height:100px; border-radius:8px;"></div>
                </div>

                <!-- Graphs & analytics row -->
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px; margin-bottom: 30px;">
                    <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:24px;">
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom:20px;">Daily Sales Trends (Rupees)</h3>
                        <div id="revenue-graph" style="display:flex; align-items:flex-end; gap:20px; height: 180px; padding:20px 0; border-bottom: 2px solid var(--border-color)">
                            <!-- SVG or CSS Bars populated dynamically -->
                            <p class="text-muted">Aggregating trends...</p>
                        </div>
                    </div>

                    <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:24px;">
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom:20px;">Order Status Distribution</h3>
                        <div id="order-status-distribution" style="display:flex; flex-direction:column; gap:12px;">
                            <p class="text-muted">Computing distribution...</p>
                        </div>
                    </div>
                </div>

                <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:24px; margin-bottom:30px;">
                    <h3 style="font-family:'Outfit',sans-serif; margin-bottom:16px;">Add New Product</h3>
                    <form id="admin-add-product-form" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Title</label>
                            <input id="admin-product-title" type="text" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Category</label>
                            <select id="admin-product-category" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                                <option value="">Loading categories...</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Price</label>
                            <input id="admin-product-price" type="number" min="0" step="0.01" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Original Price</label>
                            <input id="admin-product-original-price" type="number" min="0" step="0.01" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Stock</label>
                            <input id="admin-product-stock" type="number" min="0" step="1" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Eco Score</label>
                            <input id="admin-product-eco-score" type="number" min="0" max="100" step="1" value="75" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Image URL</label>
                            <input id="admin-product-image-url" type="url" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display:block; margin-bottom:6px; font-weight:700;">Description</label>
                            <textarea id="admin-product-description" rows="4" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background-color:var(--bg-primary); color:var(--text-primary);"></textarea>
                        </div>
                        <div style="grid-column: span 2; display:flex; justify-content:flex-end; gap:12px; align-items:center;">
                            <span id="admin-add-product-feedback" style="font-size:13px; color:var(--text-secondary);"></span>
                            <button type="submit" class="btn-primary" style="padding:12px 20px;">Add Product</button>
                        </div>
                    </form>
                </div>

                <!-- Action sections: Low stock warnings, list of orders to change status, list of users -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
                    <div>
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom:16px;">Low Stock Alerts ⚠️</h3>
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead>
                                    <tr><th>Product</th><th>Stock</th><th>Action</th></tr>
                                </thead>
                                <tbody id="admin-low-stock-body">
                                    <tr><td colspan="3" class="text-center text-muted">Checking stock levels...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 style="font-family:'Outfit',sans-serif; margin-bottom:16px;">Order Fulfilment Dash</h3>
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead>
                                    <tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Adjust</th></tr>
                                </thead>
                                <tbody id="admin-orders-body">
                                    <tr><td colspan="4" class="text-center text-muted">Scanning order list...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            // Load Analytics Stats
            const stats = await API.getAdminStats();
            const totals = stats.totals;

            // Stats grid
            document.getElementById('admin-stats-grid').innerHTML = `
                <div class="stat-card">
                    <span class="stat-card-title">Total Revenue</span>
                    <span class="stat-card-num">₹${totals.revenue.toLocaleString('en-IN')}</span>
                    <i class="fa-solid fa-sack-dollar stat-card-icon"></i>
                </div>
                <div class="stat-card">
                    <span class="stat-card-title">Total Orders</span>
                    <span class="stat-card-num">${totals.orders}</span>
                    <i class="fa-solid fa-truck-ramp-box stat-card-icon"></i>
                </div>
                <div class="stat-card">
                    <span class="stat-card-title">Total Products</span>
                    <span class="stat-card-num">${totals.products}</span>
                    <i class="fa-solid fa-boxes-stacked stat-card-icon"></i>
                </div>
                <div class="stat-card">
                    <span class="stat-card-title">Total Users</span>
                    <span class="stat-card-num">${totals.users}</span>
                    <i class="fa-solid fa-users stat-card-icon"></i>
                </div>
            `;

            // Draw Daily Sales Trends Graph (custom CSS bars)
            const trend = stats.revenue_trend || [];
            const graphDiv = document.getElementById('revenue-graph');
            if (trend.length) {
                const maxRev = Math.max(...trend.map(t => t.revenue), 1000);
                graphDiv.innerHTML = trend.map(t => {
                    const heightPct = Math.max((t.revenue / maxRev) * 100, 10);
                    return `
                        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; height:100%;">
                            <div style="width:100%; height:${heightPct}%; background-color:var(--primary-color); border-radius: 4px; display:flex; align-items:flex-end; justify-content:center; position:relative; min-height: 15px;" title="₹${t.revenue}">
                                <span style="font-size:10px; color:white; font-weight:700; margin-bottom:4px;">₹${Math.round(t.revenue)}</span>
                            </div>
                            <span style="font-size:10px; color:var(--text-secondary); white-space:nowrap;">${t.date.split('-').slice(1).join('/')}</span>
                        </div>
                    `;
                }).join('');
            } else {
                graphDiv.innerHTML = '<p class="text-center text-muted" style="width:100%;">No sales logs generated yet.</p>';
            }

            // Draw Order status indicators
            const statusDist = stats.status_distribution || {};
            const statusDiv = document.getElementById('order-status-distribution');
            statusDiv.innerHTML = Object.entries(statusDist).map(([st, cnt]) => `
                <div style="display:flex; justify-content:space-between; font-size:13.5px;">
                    <span>${st}</span>
                    <strong>${cnt}</strong>
                </div>
                <div style="height:6px; background-color:var(--bg-tertiary); border-radius:3px; overflow:hidden; margin-bottom:8px;">
                    <div style="height:100%; background-color:var(--primary-color); width:${totals.orders ? (cnt / totals.orders) * 100 : 0}%"></div>
                </div>
            `).join('');

            // Low Stock list
            // Confirmation modal helper (lazy-inserted)
            function confirmRestock(message) {
                return new Promise(resolve => {
                    let modal = document.getElementById('confirm-restock-modal');
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'confirm-restock-modal';
                        modal.style = 'position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); z-index:9999;';
                        modal.innerHTML = `
                            <div style="background:white; padding:20px; border-radius:8px; width:420px; max-width:90%; box-shadow:var(--shadow-md);">
                                <div id="confirm-restock-message" style="margin-bottom:16px; color:var(--text-primary);"></div>
                                <div style="display:flex; justify-content:flex-end; gap:8px;">
                                    <button id="confirm-restock-cancel" class="btn-secondary" style="padding:8px 12px;">Cancel</button>
                                    <button id="confirm-restock-ok" class="btn-primary" style="padding:8px 12px;">Confirm</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        document.getElementById('confirm-restock-cancel').addEventListener('click', () => {
                            modal.style.display = 'none';
                            resolve(false);
                        });
                        document.getElementById('confirm-restock-ok').addEventListener('click', () => {
                            modal.style.display = 'none';
                            resolve(true);
                        });
                    }
                    document.getElementById('confirm-restock-message').textContent = message;
                    modal.style.display = 'flex';
                });
            }
            // Demo modal helper and runner
            function showDemoModal() {
                return new Promise(resolve => {
                    let modal = document.getElementById('admin-demo-modal');
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'admin-demo-modal';
                        modal.style = 'position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); z-index:9999;';
                        modal.innerHTML = `
                            <div style="background:white; padding:20px; border-radius:8px; width:520px; max-width:96%; box-shadow:var(--shadow-md);">
                                <h3 style="margin-top:0;">Admin Restock Demo</h3>
                                <div id="admin-demo-body" style="margin-bottom:12px; color:var(--text-secondary);">This demo will restock up to 2 low-stock products by 5 units each and create restock logs.</div>
                                <div style="display:flex; justify-content:flex-end; gap:8px;">
                                    <button id="admin-demo-cancel" class="btn-secondary" style="padding:8px 12px;">Close</button>
                                    <button id="admin-demo-run" class="btn-primary" style="padding:8px 12px;">Run Demo</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        document.getElementById('admin-demo-cancel').addEventListener('click', () => {
                            modal.style.display = 'none';
                            resolve(null);
                        });
                        document.getElementById('admin-demo-run').addEventListener('click', () => {
                            modal.style.display = 'none';
                            resolve(true);
                        });
                    }
                    modal.style.display = 'flex';
                });
            }

            async function runAdminDemo(container) {
                const confirmed = await showDemoModal();
                if (!confirmed) return;
                try {
                    const stats = await API.getAdminStats();
                    const lowStockItems = stats.low_stock || [];
                    if (!lowStockItems.length) {
                        Components.showToast('No low-stock items available for demo.', 'error');
                        return;
                    }
                    const toProcess = lowStockItems.slice(0,2);
                    for (const item of toProcess) {
                        const pid = item.id;
                        const p = await API.getProduct(pid);
                        const add = 5;
                        const newStock = p.stock + add;
                        await API.adminUpdateProduct(pid, { stock: newStock });
                        try {
                            await API.adminCreateRestockLog({ product: pid, quantity_added: add, previous_stock: p.stock, new_stock: newStock, note: 'Demo run' });
                        } catch (logErr) {
                            console.warn('Demo: log failed', logErr);
                        }
                    }
                    Components.showToast('Demo completed: restocked sample products.');
                    // Refresh dashboard to show updates
                    await Views.AdminDashboard(container);
                } catch (e) {
                    console.error('Demo failed', e);
                    Components.showToast('Demo failed. Check console for details.', 'error');
                }
            }
            const lowStock = stats.low_stock || [];
            const lowStockBody = document.getElementById('admin-low-stock-body');
            if (lowStock.length) {
                // Bulk controls row + individual rows with qty inputs and selection
                let rows = `
                    <tr>
                        <td colspan="3" style="padding:8px;">
                            <input type="number" id="bulk-restock-qty" min="1" value="10" style="width:100px; margin-right:8px; padding:6px; border:1px solid var(--border-color); border-radius:6px;">
                            <button id="bulk-restock-btn" class="btn-primary-sm" style="padding:6px 10px;">Restock Selected</button>
                            <span id="bulk-restock-feedback" style="margin-left:12px; color:var(--text-secondary); font-size:13px;"></span>
                        </td>
                    </tr>
                `;

                rows += lowStock.map(p => `
                    <tr>
                        <td style="display:flex; align-items:center; gap:8px;"><input type="checkbox" class="restock-select" data-id="${p.id}"> <strong>${p.title}</strong> <a href="#/product/${p.id}" class="admin-view-link" style="margin-left:8px; font-size:12px; color:var(--primary-color);">View</a></td>
                        <td style="color:var(--danger-color); font-weight:700;">${p.stock} units</td>
                        <td style="display:flex; gap:8px; align-items:center;"><input type="number" class="restock-qty" data-id="${p.id}" min="1" value="10" style="width:80px; padding:6px; border:1px solid var(--border-color); border-radius:6px;"> <button class="restock-btn btn-primary-sm" data-id="${p.id}" style="padding:6px 10px; font-size:11px; border-radius:4px;">Restock</button></td>
                    </tr>
                `).join('');

                lowStockBody.innerHTML = rows;

                // Individual restock handlers
                lowStockBody.querySelectorAll('.restock-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const pid = btn.dataset.id;
                        const qtyInput = lowStockBody.querySelector(`.restock-qty[data-id="${pid}"]`);
                        const qty = qtyInput ? parseInt(qtyInput.value, 10) : 10;
                        if (isNaN(qty) || qty <= 0) {
                            Components.showToast('Enter a valid quantity to restock.', 'error');
                            return;
                        }
                        // Confirm with admin before proceeding
                        const ok = await confirmRestock(`Add ${qty} units to product ID ${pid}?`);
                        if (!ok) return;
                        try {
                            const p = await API.getProduct(pid);
                            const newStock = p.stock + qty;
                            await API.adminUpdateProduct(pid, { stock: newStock });
                            // Create audit log
                            try {
                                await API.adminCreateRestockLog({ product: pid, quantity_added: qty, previous_stock: p.stock, new_stock: newStock, note: '' });
                            } catch (logErr) {
                                console.warn('Restock log creation failed:', logErr);
                            }
                            Components.showToast("Stock updated successfully!");
                            await Views.AdminDashboard(container);
                        } catch (e) {
                            Components.showToast("Stock update failed.", "error");
                        }
                    });
                });

                // Bulk restock handler
                const bulkBtn = document.getElementById('bulk-restock-btn');
                if (bulkBtn) {
                    bulkBtn.addEventListener('click', async () => {
                        const qtyVal = parseInt(document.getElementById('bulk-restock-qty').value, 10);
                        const feedbackEl = document.getElementById('bulk-restock-feedback');
                        feedbackEl.textContent = '';
                        if (isNaN(qtyVal) || qtyVal <= 0) {
                            feedbackEl.textContent = 'Enter a valid bulk quantity.';
                            return;
                        }
                        const selected = Array.from(lowStockBody.querySelectorAll('.restock-select:checked')).map(cb => cb.dataset.id);
                        if (!selected.length) {
                            feedbackEl.textContent = 'No products selected.';
                            return;
                        }
                        // Confirm bulk restock
                        const ok = await confirmRestock(`Add ${qtyVal} units to ${selected.length} selected products?`);
                        if (!ok) return;
                        try {
                            // Update each selected product
                            // Update each selected product and create logs
                            await Promise.all(selected.map(async pid => {
                                const p = await API.getProduct(pid);
                                const newStock = p.stock + qtyVal;
                                await API.adminUpdateProduct(pid, { stock: newStock });
                                try {
                                    await API.adminCreateRestockLog({ product: pid, quantity_added: qtyVal, previous_stock: p.stock, new_stock: newStock, note: '' });
                                } catch (logErr) {
                                    console.warn('Bulk restock log failed for', pid, logErr);
                                }
                            }));
                            Components.showToast(`Restocked ${selected.length} products by ${qtyVal} units.`);
                            await Views.AdminDashboard(container);
                        } catch (e) {
                            console.error(e);
                            Components.showToast('Bulk restock failed.', 'error');
                        }
                    });
                }
            } else {
                lowStockBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">All products are well stocked!</td></tr>';
            }

            // Admin product creation form
            const categories = await API.getCategories();
            const categorySelect = document.getElementById('admin-product-category');
            if (categorySelect) {
                if (categories && categories.length) {
                    categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
                } else {
                    categorySelect.innerHTML = '<option value="">No categories available</option>';
                }
            }

            const addProductForm = document.getElementById('admin-add-product-form');
            if (addProductForm) {
                addProductForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const feedback = document.getElementById('admin-add-product-feedback');
                    feedback.textContent = '';

                    const title = document.getElementById('admin-product-title').value.trim();
                    const description = document.getElementById('admin-product-description').value.trim();
                    const price = parseFloat(document.getElementById('admin-product-price').value);
                    const originalPrice = parseFloat(document.getElementById('admin-product-original-price').value);
                    const stock = parseInt(document.getElementById('admin-product-stock').value, 10);
                    const ecoScore = parseInt(document.getElementById('admin-product-eco-score').value, 10);
                    const category = parseInt(document.getElementById('admin-product-category').value, 10);
                    const imageUrl = document.getElementById('admin-product-image-url').value.trim();

                    if (!title || !description || isNaN(price) || isNaN(originalPrice) || isNaN(stock) || isNaN(ecoScore) || isNaN(category)) {
                        feedback.textContent = 'Please complete all required fields.';
                        return;
                    }

                    const productData = {
                        title,
                        description,
                        price,
                        original_price: originalPrice,
                        stock,
                        category,
                        image_url: imageUrl || null,
                        eco_score: ecoScore
                    };

                    try {
                        await API.adminAddProduct(productData);
                        Components.showToast('Product added successfully!');
                        await Views.AdminDashboard(container);
                    } catch (err) {
                        console.error(err);
                        feedback.textContent = 'Failed to create product. Ensure you are logged in as admin.';
                    }
                });
            }

            // Order management list
            const orders = await API.getOrders(); // Fetches all orders for Admin
            const ordersBody = document.getElementById('admin-orders-body');
            if (orders && orders.length) {
                ordersBody.innerHTML = orders.map(order => `
                    <tr>
                        <td>#${order.id}</td>
                        <td><strong>${order.address_details ? order.address_details.street_address : 'Demo customer'}</strong></td>
                        <td><span class="eco-details-badge" style="font-size:10px; padding:2px 8px;">${order.status}</span></td>
                        <td>
                            <select class="admin-status-select" data-id="${order.id}" style="padding:4px; font-size:11px; border-radius:4px; outline:none; border:1px solid var(--border-color);">
                                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Packed" ${order.status === 'Packed' ? 'selected' : ''}>Packed</option>
                                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        </td>
                    </tr>
                `).join('');

                ordersBody.querySelectorAll('.admin-status-select').forEach(sel => {
                    sel.addEventListener('change', async (e) => {
                        const oid = sel.dataset.id;
                        const nStatus = e.target.value;
                        try {
                            await API.updateOrderStatus(oid, nStatus);
                            Components.showToast(`Order #${oid} status changed to ${nStatus}!`);
                            await Views.AdminDashboard(container);
                        } catch (err) {
                            Components.showToast("Fulfillment status change failed.", "error");
                        }
                    });
                });
            } else {
                ordersBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;">No orders found in database.</td></tr>';
            }

            // Load recent restock logs for admin audit
            try {
                const logs = await API.getRestockLogs({});
                const logsBody = document.getElementById('admin-restock-logs-body');
                if (logs && logs.length) {
                    logsBody.innerHTML = logs.slice(0,10).map(l => `
                        <tr>
                            <td style="white-space:nowrap;">${new Date(l.created_at).toLocaleString()}</td>
                            <td><a href="#/product/${l.product}">${l.product_title || 'Product #' + l.product}</a></td>
                            <td>${l.username || 'system'}</td>
                            <td style="font-weight:700;">+${l.quantity_added}</td>
                            <td>${l.previous_stock} → ${l.new_stock}</td>
                            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;">${l.note || ''}</td>
                        </tr>
                    `).join('');
                } else {
                    logsBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No restock logs yet.</td></tr>';
                }
            } catch (e) {
                console.error('Failed to load restock logs', e);
                const logsBody = document.getElementById('admin-restock-logs-body');
                if (logsBody) logsBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Unable to load restock logs.</td></tr>';
            }

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-center text-muted">Admin dashboard requires administrator staff level permissions.</p>';
        }
    },

    // --------------------------------------------------------------------------
    // LOGIN & REGISTER VIEWS
    // --------------------------------------------------------------------------
    async Login(container) {
        container.innerHTML = `
            <div style="max-width: 400px; margin: 60px auto; padding: 30px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: var(--shadow-md);">
                <h2 style="font-family:'Outfit',sans-serif; text-align:center; margin-bottom: 24px;">Login to CodeAlpha Shop</h2>
                <form id="login-form" style="display:flex; flex-direction:column; gap:16px;">
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:6px;">Username or Email</label>
                        <input type="text" id="login-username" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:6px;">Password</label>
                        <input type="password" id="login-password" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <button type="submit" class="btn-primary" style="background-color:var(--primary-color); color:white; margin-top:10px; padding:12px;">Sign In</button>
                </form>
                <p style="font-size:13px; text-align:center; margin-top:20px; color:var(--text-secondary)">Don't have an account? <a href="#/register" style="color:var(--primary-color); font-weight:700;">Register Now</a></p>
                
                <div style="margin-top: 24px; padding-top: 20px; border-top:1px dashed var(--border-color); font-size:12px; color:var(--text-secondary)">
                    <strong>Testing accounts:</strong><br>
                    • Customer: <code>demo</code> / <code>demopassword</code><br>
                    • Administrator: <code>admin</code> / <code>adminpassword</code>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value;
            const p = document.getElementById('login-password').value;
            try {
                await API.login(u, p);
                Components.showToast("Welcome back to CodeAlpha Shop!");
                window.location.hash = '#/';
            } catch (err) {
                console.error('Login failed:', err);
                const message = err.message || "Invalid credentials. Try demo/demopassword.";
                Components.showToast(message, "error");
            }
        });
    },

    async Register(container) {
        container.innerHTML = `
            <div style="max-width: 400px; margin: 40px auto; padding: 30px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: var(--shadow-md);">
                <h2 style="font-family:'Outfit',sans-serif; text-align:center; margin-bottom: 24px;">Register</h2>
                <form id="register-form" style="display:flex; flex-direction:column; gap:14px;">
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:4px;">Username</label>
                        <input type="text" id="reg-username" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:4px;">Email Address</label>
                        <input type="email" id="reg-email" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:4px;">Phone Number (Optional)</label>
                        <input type="text" id="reg-phone" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:4px;">Password</label>
                        <input type="password" id="reg-password" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12.5px; font-weight:700; display:block; margin-bottom:4px;">Confirm Password</label>
                        <input type="password" id="reg-confirm" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background-color:var(--bg-primary); color:var(--text-primary); outline:none;">
                    </div>
                    <button type="submit" class="btn-primary" style="background-color:var(--primary-color); color:white; margin-top:10px; padding:12px;">Create Account</button>
                </form>
                <p style="font-size:13px; text-align:center; margin-top:20px; color:var(--text-secondary)">Already have an account? <a href="#/login" style="color:var(--primary-color); font-weight:700;">Login Here</a></p>
            </div>
        `;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('reg-username').value;
            const em = document.getElementById('reg-email').value;
            const ph = document.getElementById('reg-phone').value;
            const p = document.getElementById('reg-password').value;
            const c = document.getElementById('reg-confirm').value;

            if (p !== c) {
                Components.showToast("Passwords do not match.", "error");
                return;
            }

            try {
                await API.register(u, em, p, c, ph);
                Components.showToast("Registration successful! Welcome bonus +10 points!");
                // Login immediately
                await API.login(u, p);
                window.location.hash = '#/';
            } catch (err) {
                const errorData = JSON.parse(err.message || '{}');
                const fields = Object.keys(errorData);
                const firstErr = fields.length ? errorData[fields[0]] : "Registration failed.";
                Components.showToast(firstErr, "error");
            }
        });
    }
};
