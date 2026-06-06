const API = {
    // Tokens state
    getAccessToken() {
        return localStorage.getItem('access_token');
    },
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },
    setTokens(access, refresh) {
        localStorage.setItem('access_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
    },
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
    },
    setUserInfo(user) {
        localStorage.setItem('user_info', JSON.stringify(user));
    },
    getUserInfo() {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },

    // Global fetch utility with automatic token refresh
    async call(endpoint, method = 'GET', body = null, requireAuth = false) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (requireAuth) {
            const token = this.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            let response = await fetch(endpoint, config);

            // Handle token expiration
            if (response.status === 401 && requireAuth) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry original call with new token
                    headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    response = await fetch(endpoint, config);
                } else {
                    // Refresh failed, logout
                    this.clearTokens();
                    window.dispatchEvent(new Event('auth_change'));
                    throw new Error("Session expired. Please log in again.");
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData) || `API Error: ${response.status}`;
                throw new Error(message);
            }

            // Return json if exists, otherwise status
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return { status: response.status };

        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    },

    // Refresh JWT Access Token
    async refreshToken() {
        const refresh = this.getRefreshToken();
        if (!refresh) return false;

        try {
            const response = await fetch('/api/auth/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.access, data.refresh);
                return true;
            }
        } catch (e) {
            console.error("Token refresh failed:", e);
        }
        return false;
    },

    // Authentication Services
    async login(username, password) {
        const data = await this.call('/api/auth/login/', 'POST', { username, password });
        this.setTokens(data.access, data.refresh);
        // Load user info
        const user = await this.getProfile();
        this.setUserInfo(user);
        window.dispatchEvent(new Event('auth_change'));
        return user;
    },

    async register(username, email, password, confirm_password, phone) {
        return await this.call('/api/auth/register/', 'POST', {
            username, email, password, confirm_password, phone
        });
    },

    logout() {
        this.clearTokens();
        window.dispatchEvent(new Event('auth_change'));
    },

    async getProfile() {
        return await this.call('/api/auth/profile/', 'GET', null, true);
    },

    async getLeaderboard() {
        return await this.call('/api/leaderboard/', 'GET');
    },

    // Addresses Services
    async getAddresses() {
        const res = await this.call('/api/addresses/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async addAddress(address) {
        return await this.call('/api/addresses/', 'POST', address, true);
    },

    async deleteAddress(id) {
        return await this.call(`/api/addresses/${id}/`, 'DELETE', null, true);
    },

    // Catalog & Products Services
    async getProducts(params = {}) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
                urlParams.append(key, val);
            }
        });
        const query = urlParams.toString();
        const endpoint = `/api/products/${query ? '?' + query : ''}`;
        const res = await this.call(endpoint, 'GET', null, this.getAccessToken() ? true : false);
        return this.normalizeListResponse(res);
    },

    async getProduct(id) {
        return await this.call(`/api/products/${id}/`, 'GET', null, this.getAccessToken() ? true : false);
    },

    async getSuggestions(q) {
        const res = await this.call(`/api/products/suggestions/?q=${encodeURIComponent(q)}`, 'GET');
        return this.normalizeListResponse(res);
    },

    async getFrequentlyBought(id) {
        const res = await this.call(`/api/products/${id}/frequently_bought/`, 'GET');
        return this.normalizeListResponse(res);
    },

    async getCustomersAlsoViewed(id) {
        const res = await this.call(`/api/products/${id}/customers_viewed/`, 'GET');
        return this.normalizeListResponse(res);
    },

    async addReview(productId, rating, comment) {
        return await this.call(`/api/products/${productId}/add_review/`, 'POST', { rating, comment }, true);
    },

    // Price Watch Services
    async getPriceWatches() {
        const res = await this.call('/api/price-watches/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async watchPrice(productId, targetPrice) {
        return await this.call('/api/price-watches/', 'POST', { product: productId, target_price: targetPrice }, true);
    },

    async removePriceWatch(watchId) {
        return await this.call(`/api/price-watches/${watchId}/`, 'DELETE', null, true);
    },

    normalizeListResponse(res) {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.results)) return res.results;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.items)) return res.items;
        console.warn('Unexpected list response shape from API:', res);
        return [];
    },

    // Cart Services
    async getCart(saveForLater = false) {
        const res = await this.call(`/api/cart/?save_for_later=${saveForLater}`, 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async addToCart(productId, quantity = 1) {
        return await this.call('/api/cart/', 'POST', { product_id: productId, quantity }, true);
    },

    async updateCartQuantity(cartItemId, quantity) {
        return await this.call(`/api/cart/${cartItemId}/`, 'PATCH', { quantity }, true);
    },

    async toggleSaveLater(cartItemId) {
        return await this.call(`/api/cart/${cartItemId}/toggle_save_later/`, 'POST', null, true);
    },

    async removeFromCart(cartItemId) {
        return await this.call(`/api/cart/${cartItemId}/`, 'DELETE', null, true);
    },

    // Wishlist Services
    async getWishlist() {
        const res = await this.call('/api/wishlist/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async toggleWishlist(productId) {
        return await this.call('/api/wishlist/toggle/', 'POST', { product_id: productId }, true);
    },

    // Notifications Services
    async getNotifications() {
        const res = await this.call('/api/notifications/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async markNotificationsRead() {
        return await this.call('/api/notifications/mark_all_read/', 'POST', null, true);
    },

    // Order Services
    async placeOrder(addressId) {
        return await this.call('/api/orders/', 'POST', { address: addressId }, true);
    },

    async getOrders() {
        const res = await this.call('/api/orders/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async getOrderDetails(orderId) {
        return await this.call(`/api/orders/${orderId}/`, 'GET', null, true);
    },

    // Category lists
    async getCategories() {
        const res = await this.call('/api/categories/', 'GET');
        return this.normalizeListResponse(res);
    },

    // Recommendation Services
    async getRecommendations() {
        const res = await this.call('/api/recommendations/', 'GET', null, this.getAccessToken() ? true : false);
        return this.normalizeListResponse(res);
    },

    async getTrending() {
        const res = await this.call('/api/trending/', 'GET', null, this.getAccessToken() ? true : false);
        return this.normalizeListResponse(res);
    },

    async getFlashSales() {
        const res = await this.call('/api/flash-sales/', 'GET', null, this.getAccessToken() ? true : false);
        return this.normalizeListResponse(res);
    },

    // Admin Dashboard Services
    async getAdminStats() {
        return await this.call('/api/admin/stats/', 'GET', null, true);
    },

    async getAdminUsers() {
        const res = await this.call('/api/admin/users/', 'GET', null, true);
        return this.normalizeListResponse(res);
    },

    async updateOrderStatus(orderId, status) {
        return await this.call(`/api/orders/${orderId}/`, 'PATCH', { status }, true);
    },
    
    async adminAddProduct(productData) {
        return await this.call('/api/products/', 'POST', productData, true);
    },

    async adminUpdateProduct(id, productData) {
        return await this.call(`/api/products/${id}/`, 'PATCH', productData, true);
    },

    async adminDeleteProduct(id) {
        return await this.call(`/api/products/${id}/`, 'DELETE', null, true);
    },

    // Restock Logs (Admin)
    async adminCreateRestockLog(logData) {
        return await this.call('/api/restock-logs/', 'POST', logData, true);
    },

    async getRestockLogs(params = {}) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) urlParams.append(k, v); });
        const endpoint = `/api/restock-logs/${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        const res = await this.call(endpoint, 'GET', null, true);
        return this.normalizeListResponse(res);
    }
};
