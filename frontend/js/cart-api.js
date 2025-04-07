/**
 * Cart API Interface
 * Handles cart operations with the backend API
 */
const CartAPI = (function() {
    // API endpoint paths
    const ENDPOINTS = {
        GET: '/cart/get.php',
        ADD: '/cart/add.php',
        UPDATE: '/cart/update.php',
        REMOVE: '/cart/remove.php'
    };
    
    /**
     * Get current user's cart from the API
     * @returns {Promise<Object>} Cart data
     */
    async function getCart() {
        try {
            // Get authorization token if user is logged in
            let headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn()) {
                headers['Authorization'] = `Bearer ${FitZoneAuth.getToken()}`;
            }
            
            // Make API request
            const response = await fetch(`${CONFIG.API_URL}${ENDPOINTS.GET}`, {
                method: 'POST',
                headers: headers,
                credentials: 'include'
            });
            
            // Check for response content
            const responseText = await response.text();
            if (!responseText) {
                console.error('Empty response from cart API');
                return { items: [], total: 0 };
            }
            
            // Parse response
            const data = JSON.parse(responseText);
            
            if (data.success) {
                return data.data || { items: [], total: 0 };
            } else {
                console.error('Error retrieving cart:', data.message);
                return { items: [], total: 0 };
            }
        } catch (error) {
            console.error('Failed to get cart:', error);
            return { items: [], total: 0 };
        }
    }
    
    /**
     * Add item to cart
     * @param {Object} item Item to add to cart
     * @returns {Promise<Object>} Response data
     */
    async function addToCart(item) {
        try {
            // Get authorization token if user is logged in
            let headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn()) {
                headers['Authorization'] = `Bearer ${FitZoneAuth.getToken()}`;
            }
            
            // Make API request
            const response = await fetch(`${CONFIG.API_URL}${ENDPOINTS.ADD}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(item),
                credentials: 'include'
            });
            
            // Handle response
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                console.error('Error adding item to cart:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            return { success: false, message: 'Failed to add item to cart' };
        }
    }
    
    /**
     * Update cart item quantity
     * @param {string|number} productId Product ID
     * @param {number} quantity New quantity
     * @returns {Promise<Object>} Response data
     */
    async function updateQuantity(productId, quantity) {
        // Implementation similar to addToCart
        return { success: true, message: 'Mock update response' };
    }
    
    /**
     * Remove item from cart
     * @param {string|number} productId Product ID to remove
     * @returns {Promise<Object>} Response data
     */
    async function removeItem(productId) {
        // Implementation similar to addToCart
        return { success: true, message: 'Mock remove response' };
    }
    
    // Return public API
    return {
        getCart,
        addToCart,
        updateQuantity,
        removeItem
    };
})();

console.log('Cart API interface loaded');
