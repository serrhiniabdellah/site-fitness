/**
 * Cart Authentication Integration
 * This file integrates the cart system with authentication to handle
 * cart merging when users log in and clear local cart when they log out
 */

(function() {
    // Wait for DOM content to be loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Cart auth integration loaded');
        
        // Set up auth state change listener
        document.addEventListener('auth:stateChanged', handleAuthStateChange);
        
        /**
         * Handle auth state changes
         * @param {CustomEvent} event Auth state change event
         */
        async function handleAuthStateChange(event) {
            console.log('Auth state changed:', event.detail);
            
            // Check if user logged in
            if (event.detail && event.detail.isLoggedIn === true) {
                console.log('User logged in, will merge cart if needed');
                
                // Get auth token
                const token = localStorage.getItem('fitzone_token');
                if (!token) {
                    console.error('No token found despite login event');
                    return;
                }
                
                // Check if we have local cart items to merge
                const localCart = getLocalCart();
                if (localCart && localCart.items && localCart.items.length > 0) {
                    console.log(`Found ${localCart.items.length} items in local cart to merge`);
                    
                    try {
                        // Try to merge carts if CartMerge utility is available
                        if (window.CartMerge && typeof window.CartMerge.mergeAnonymousCart === 'function') {
                            console.log('Using CartMerge utility');
                            await window.CartMerge.mergeAnonymousCart(token);
                        } else {
                            console.warn('CartMerge utility not available, attempting fallback merge');
                            await fallbackMergeCart(token, localCart);
                        }
                    } catch (error) {
                        console.error('Error merging carts:', error);
                    }
                } else {
                    console.log('No local cart items to merge');
                }
            } 
            // User logged out
            else if (event.detail && event.detail.isLoggedIn === false) {
                console.log('User logged out, preserving local cart');
                // We don't clear local cart on logout as user might want to continue shopping
            }
            
            // Update cart UI
            updateCartUI();
        }
        
        /**
         * Fallback function to merge cart if main utility isn't available
         * @param {string} token Auth token
         * @param {object} localCart Local cart object
         */
        async function fallbackMergeCart(token, localCart) {
            if (!token || !localCart || !localCart.items) return false;
            
            const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                ? window.CONFIG.API_URL 
                : 'http://localhost/site-fitness/backend/api';
            
            let successCount = 0;
            
            for (const item of localCart.items) {
                try {
                    const productId = item.id_produit || item.id;
                    const quantity = item.quantity || 1;
                    
                    console.log(`Adding item ${productId} to server cart`);
                    
                    const response = await fetch(`${apiUrl}/cart/add.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            product_id: productId,
                            quantity: quantity
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) successCount++;
                    }
                } catch (error) {
                    console.error(`Error adding item ${item.id} to server:`, error);
                }
            }
            
            // If at least one item was successfully added, clear local cart
            if (successCount > 0) {
                localStorage.setItem('fitzone_cart', JSON.stringify({ items: [], total: 0 }));
                localStorage.removeItem('cartItems');
                
                // Trigger cart update event
                document.dispatchEvent(new CustomEvent('cart:updated'));
                return true;
            }
            
            return false;
        }
        
        /**
         * Get local cart data
         * @returns {object} Cart object
         */
        function getLocalCart() {
            try {
                // First try new format
                const cart = JSON.parse(localStorage.getItem('fitzone_cart'));
                if (cart && cart.items) return cart;
                
                // Try legacy format
                const legacyCart = JSON.parse(localStorage.getItem('cartItems'));
                if (legacyCart && Array.isArray(legacyCart)) {
                    return {
                        items: legacyCart,
                        total: legacyCart.reduce((sum, item) => {
                            return sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1));
                        }, 0)
                    };
                }
            } catch (e) {
                console.error('Error getting local cart:', e);
            }
            
            return { items: [], total: 0 };
        }
        
        /**
         * Update cart UI with current items
         */
        function updateCartUI() {
            if (window.CartService && typeof window.CartService.updateCartCountUI === 'function') {
                window.CartService.updateCartCountUI()
                    .catch(err => console.error('Error updating cart UI:', err));
            } else {
                // Fallback update
                try {
                    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                    const totalItems = cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
                    
                    document.querySelectorAll('.cart-count').forEach(element => {
                        element.textContent = totalItems.toString();
                        element.style.display = totalItems > 0 ? 'inline-block' : 'none';
                    });
                } catch (err) {
                    console.error('Error in fallback cart UI update:', err);
                }
            }
        }
    });
})();