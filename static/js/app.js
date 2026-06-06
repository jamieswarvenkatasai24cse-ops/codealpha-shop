document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // STATE & INITIALIZATION
    // --------------------------------------------------------------------------
    const appRoot = document.getElementById('app-root');
    
    // Light / Dark Mode Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    };
    
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
    
    loadTheme();

    // --------------------------------------------------------------------------
    // NOTIFICATIONS SYSTEM (BELL ICON) - DEFINE EARLY
    // --------------------------------------------------------------------------
    const notifBell = document.getElementById('nav-notifications');
    const notifDrop = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const notifBadge = document.getElementById('notif-badge-count');

    async function updateNotifications() {
        if (!API.getAccessToken()) return;
        try {
            const alerts = await API.getNotifications();
            const unread = alerts.filter(a => !a.is_read);
            
            if (unread.length) {
                notifBadge.textContent = unread.length;
                notifBadge.classList.remove('hidden');
            } else {
                notifBadge.classList.add('hidden');
            }

            if (alerts && alerts.length) {
                notifList.innerHTML = alerts.map(a => `
                    <div class="notif-item" style="padding:12px; border-bottom: 1px solid var(--border-color);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <span>${a.title}</span>
                            <span class="notification-time">${new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">${a.message}</p>
                    </div>
                `).join('');
            } else {
                notifList.innerHTML = '<p class="empty-notif">No new alerts</p>';
            }
        } catch (e) {
            console.error("Notif update failed:", e);
        }
    };

    async function updateCartBadge() {
        if (!API.getAccessToken()) return;
        try {
            const activeItems = await API.getCart(false);
            const count = activeItems.reduce((acc, item) => acc + item.quantity, 0);
            const badge = document.getElementById('cart-badge-count');
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        } catch (e) {}
    };

    // --------------------------------------------------------------------------
    // AUTHENTICATION STATE & HEADER UPDATE
    // --------------------------------------------------------------------------
    async function updateHeaderAuth() {
        const authArea = document.getElementById('auth-area');
        const token = API.getAccessToken();
        
        if (token) {
            let user = API.getUserInfo();
            if (!user) {
                try {
                    user = await API.getProfile();
                    API.setUserInfo(user);
                } catch (e) {
                    API.logout();
                    return;
                }
            }
            
            authArea.innerHTML = `
                <div class="profile-avatar-trigger" id="profile-avatar-trigger">
                    <div class="profile-avatar">${user.username[0].toUpperCase()}</div>
                    <div class="dropdown-menu profile-dropdown hidden" id="profile-dropdown-menu" style="width: 200px; top:56px;">
                        <div style="padding:12px; border-bottom: 1px solid var(--border-color)">
                            <strong>${user.username}</strong>
                            <div style="font-size:11px; color:var(--text-secondary)">Lvl ${user.level} Green Shopper</div>
                        </div>
                        <a href="#/profile" class="suggestion-item"><i class="fa-solid fa-user"></i> My Profile</a>
                        ${user.is_staff ? `<a href="#/admin" class="suggestion-item" style="color:var(--secondary-color)"><i class="fa-solid fa-chart-line"></i> Admin Panel</a>` : ''}
                        <button class="suggestion-item logout-action-btn" style="width:100%; border:none; text-align:left; color:var(--danger-color)"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
                    </div>
                </div>
            `;

            // Profile Dropdown bindings
            const trigger = document.getElementById('profile-avatar-trigger');
            const drop = document.getElementById('profile-dropdown-menu');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                drop.classList.toggle('hidden');
            });

            trigger.querySelector('.logout-action-btn').addEventListener('click', () => {
                API.logout();
                Components.showToast("Logged out successfully.");
                window.location.hash = '#/login';
            });

            // Start polling notifications
            updateNotifications();
            updateCartBadge();
        } else {
            authArea.innerHTML = `<a href="#/login" class="login-btn">Login</a>`;
            document.getElementById('notif-badge-count').classList.add('hidden');
            document.getElementById('cart-badge-count').textContent = '0';
        }
    };

    window.addEventListener('auth_change', updateHeaderAuth);
    updateHeaderAuth();

    // Close dropdowns on outside clicks
    document.addEventListener('click', () => {
        const profileDrop = document.getElementById('profile-dropdown-menu');
        if (profileDrop) profileDrop.classList.add('hidden');
        
        const notifDrop = document.getElementById('notif-dropdown');
        if (notifDrop) notifDrop.classList.add('hidden');

        document.getElementById('search-suggestions').classList.add('hidden');
    });

    // --------------------------------------------------------------------------
    // SMART SEARCH & SUGGESTIONS AUTOCOMPLETE
    // --------------------------------------------------------------------------
    const searchInput = document.getElementById('smart-search');
    const suggestionsBox = document.getElementById('search-suggestions');
    const clearBtn = document.getElementById('search-clear-btn');
    
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (val.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }
            try {
                const suggs = await API.getSuggestions(val);
                if (suggs && suggs.length) {
                    suggestionsBox.innerHTML = suggs.map(s => `
                        <div class="suggestion-item" data-id="${s.id}">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <span>${s.title}</span>
                        </div>
                    `).join('');
                    suggestionsBox.classList.remove('hidden');

                    // Bind items
                    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                        item.addEventListener('click', () => {
                            window.location.hash = `#/product/${item.dataset.id}`;
                            searchInput.value = '';
                            suggestionsBox.classList.add('hidden');
                            clearBtn.classList.add('hidden');
                        });
                    });
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            } catch (e) {
                console.error(e);
            }
        }, 200);
    });

    // Run catalog search on hitting enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = searchInput.value.trim();
            if (val) {
                window.location.hash = `#/catalog?q=${encodeURIComponent(val)}`;
                suggestionsBox.classList.add('hidden');
            }
        }
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        suggestionsBox.classList.add('hidden');
    });

    // Notification Bell Click Handler
    notifBell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!API.getAccessToken()) {
            Components.showToast("Login to view alerts", "error");
            return;
        }
        notifDrop.classList.toggle('hidden');
    });

    document.getElementById('mark-all-read-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await API.markNotificationsRead();
            updateNotifications();
            Components.showToast("All read.");
        } catch (e) {}
    });

    // --------------------------------------------------------------------------
    // BADGES & EVENT LISTENERS
    // --------------------------------------------------------------------------
    // Cart badge change listener
    window.addEventListener('cart_change', updateCartBadge);

    // Compare badge
    const updateCompareBadge = () => {
        const compareIds = JSON.parse(localStorage.getItem('compare_products') || '[]');
        const count = compareIds.length;
        const badge = document.getElementById('compare-badge-count');
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
        
        const drawer = document.getElementById('compare-bar');
        const text = document.getElementById('compare-bar-text');
        
        if (count > 0) {
            text.textContent = `${count} product${count > 1 ? 's' : ''} selected for comparison`;
            drawer.classList.remove('hidden');
        } else {
            drawer.classList.add('hidden');
        }
    };

    window.addEventListener('compare_change', updateCompareBadge);
    updateCompareBadge();

    document.getElementById('compare-bar-clear').addEventListener('click', () => {
        localStorage.removeItem('compare_products');
        window.dispatchEvent(new Event('compare_change'));
        Components.showToast("Comparison shelf cleared.");
        if (window.location.hash === '#/compare') {
            window.location.reload();
        }
    });

    // Wishlist badge change listener
    const updateWishlistBadge = async () => {
        if (!API.getAccessToken()) return;
        try {
            const items = await API.getWishlist();
            const count = items.length;
            const badge = document.getElementById('wishlist-badge-count');
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        } catch (e) {}
    };

    window.addEventListener('wishlist_change', updateWishlistBadge);
    updateWishlistBadge();

    // --------------------------------------------------------------------------
    // GLOBAL DELEGATED CARD EVENTS
    // --------------------------------------------------------------------------
    document.addEventListener('click', async (e) => {
        // 1. Quick Add to Cart
        const addBtn = e.target.closest('.quick-add-cart');
        if (addBtn) {
            e.preventDefault();
            const pid = addBtn.dataset.id;
            try {
                await API.addToCart(pid, 1);
                Components.showToast("Product added to cart!");
                window.dispatchEvent(new Event('cart_change'));
            } catch (err) {
                Components.showToast("Please log in to add items to cart.", "error");
            }
            return;
        }

        // 2. Quick Wishlist Toggle
        const wishBtn = e.target.closest('.quick-wishlist-btn');
        if (wishBtn) {
            e.preventDefault();
            const pid = wishBtn.dataset.id;
            try {
                const res = await API.toggleWishlist(pid);
                wishBtn.classList.toggle('active', res.is_in_wishlist);
                Components.showToast(res.status === 'added' ? "Added to Wishlist! ❤️" : "Removed from Wishlist.");
                window.dispatchEvent(new Event('wishlist_change'));
            } catch (err) {
                Components.showToast("Please log in to manage your wishlist.", "error");
            }
            return;
        }

        // 3. Quick Compare Toggle
        const compBtn = e.target.closest('.quick-compare-btn');
        if (compBtn) {
            e.preventDefault();
            const pid = parseInt(compBtn.dataset.id);
            let compareList = JSON.parse(localStorage.getItem('compare_products') || '[]');
            
            if (compareList.includes(pid)) {
                compareList = compareList.filter(id => id !== pid);
                compBtn.classList.remove('active');
                Components.showToast("Removed from comparison.");
            } else {
                if (compareList.length >= 3) {
                    Components.showToast("You can compare up to 3 products maximum.", "error");
                    return;
                }
                compareList.push(pid);
                compBtn.classList.add('active');
                Components.showToast("Added to comparison.");
            }
            
            localStorage.setItem('compare_products', JSON.stringify(compareList));
            window.dispatchEvent(new Event('compare_change'));
            return;
        }
    });

    // --------------------------------------------------------------------------
    // DYNAMIC HASH-BASED ROUTER
    // --------------------------------------------------------------------------
    const routes = {
        '': (container, params, id) => Views.Home(container, params, id),
        '/': (container, params, id) => Views.Home(container, params, id),
        '/catalog': (container, params, id) => Views.Catalog(container, params),
        '/product/:id': (container, params, id) => Views.Product(container, params, id),
        '/cart': (container, params, id) => Views.Cart(container, params, id),
        '/checkout': (container, params, id) => Views.Checkout(container, params, id),
        '/profile': (container, params, id) => Views.Profile(container, params, id),
        '/compare': (container, params, id) => Views.Compare(container, params, id),
        '/wishlist': (container, params, id) => Views.Wishlist(container, params, id),
        '/admin': (container, params, id) => Views.AdminDashboard(container, params, id),
        '/login': (container, params, id) => Views.Login(container, params, id),
        '/register': (container, params, id) => Views.Register(container, params, id)
    };

    const router = async () => {
        const hash = window.location.hash.slice(1) || '/';
        
        // Parse Query Params if any (e.g. #/catalog?q=solarcharge)
        const [path, queryStr] = hash.split('?');
        const params = {};
        if (queryStr) {
            const search = new URLSearchParams(queryStr);
            for (const [key, val] of search.entries()) {
                params[key] = val;
            }
        }

        // Match routes
        let match = null;
        let idParam = null;

        // Try exact match
        if (routes[path]) {
            match = routes[path];
        } else {
            // Try parametric route matching (e.g., /product/:id)
            const pathParts = path.split('/');
            for (const routeStr of Object.keys(routes)) {
                const routeParts = routeStr.split('/');
                if (routeParts.length === pathParts.length) {
                    let isMatch = true;
                    for (let i = 0; i < routeParts.length; i++) {
                        if (routeParts[i].startsWith(':')) {
                            idParam = pathParts[i];
                        } else if (routeParts[i] !== pathParts[i]) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (isMatch) {
                        match = routes[routeStr];
                        break;
                    }
                }
            }
        }

        // Render matched view or 404
        if (match) {
            // Reset page scroll position on route change
            window.scrollTo(0, 0);
            
            // Clean suggestions dropdown on routing
            suggestionsBox.classList.add('hidden');
            
            // Execute view loader
            await match(appRoot, params, idParam);
        } else {
            appRoot.innerHTML = `
                <div class="text-center text-muted" style="padding: 100px 24px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 60px; color: var(--danger-color); margin-bottom: 20px;"></i>
                    <h2 style="font-family:'Outfit',sans-serif; font-size:32px; font-weight:800; color:var(--text-primary);">Page Not Found</h2>
                    <p style="margin-top: 10px; margin-bottom: 24px;">The route you are trying to reach does not exist.</p>
                    <a href="#/" class="btn-primary" style="background-color: var(--primary-color); color:white; display:inline-block;">Back Home</a>
                </div>
            `;
        }

        // Sync wishlist and notif counts after routing
        updateWishlistBadge();
        updateNotifications();
    };

    window.addEventListener('hashchange', router);
    // Initial routing
    router();
});
