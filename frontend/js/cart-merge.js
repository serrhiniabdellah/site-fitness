/**
 * Cart merging utility
 * This file handles merging the anonymous (local) cart with the user's server cart
 * when they log in or register
 */
window.CartMerge = {
    /**
     * Merge anonymous cart with user cart
     * @param {string} token Authentication token
     * @returns {Promise<boolean>} Success status
     */
    mergeAnonymousCart: async function(token) {
        console.log('Starting cart merge process');
        
        if (!token) {
            console.error('No auth token provided for cart merge');
            return false;
        }
        
        try {
            // 1. Get the local cart
            const localCart = this.getLocalCart();
            console.log('Local cart items:', localCart.items.length);
            
            if (!localCart.items || localCart.items.length === 0) {
                console.log('No local cart items to merge');
                return false;
            }
            
            // 2. For each item in the local cart, add it to the server cart
            let mergeSuccess = false;
            let successCount = 0;
            
            for (const item of localCart.items) {
                try {
                    const productId = item.id_produit || item.id;
                    const quantity = item.quantity || 1;
                    
                    console.log(`Merging item ${productId} (${quantity}x) to server cart`);
                    const addResult = await this.addItemToServerCart(item, token);
                    
                    if (addResult) {
                        successCount++;
                    }
                    
                    // Consider merge successful if at least one item was added
                    mergeSuccess = mergeSuccess || addResult;
                } catch (itemError) {
                    console.error(`Failed to merge cart item:`, itemError);
                }
            }
            
            // 3. Clear the local cart after successful merge
            if (mergeSuccess) {
                console.log(`Cart merge successful, merged ${successCount} items, clearing local cart`);
                this.clearLocalCart();
                
                // Trigger cart update event
                document.dispatchEvent(new CustomEvent('cart:updated'));
            } else {
                console.log('No items were successfully merged');
            }
            
            return mergeSuccess;
        } catch (error) {
            console.error('Error merging carts:', error);
            return false;
        }
    },
    
    /**
     * Get cart from localStorage
     * @returns {Object} Cart object
     */
    getLocalCart: function() {
        try {
            // First try new format
            const cart = JSON.parse(localStorage.getItem('fitzone_cart'));
            if (cart && cart.items) return cart;
            
            // Try legacy format
            const legacyCart = JSON.parse(localStorage.getItem('cartItems'));
            if (legacyCart && Array.isArray(legacyCart)) {
                return {
                    items: legacyCart,
                    total: legacyCart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0)
                };
            }
        } catch (e) {
            console.error('Error getting local cart:', e);
        }
        
        return { items: [], total: 0 };
    },
    
    /**
     * Add a single item to the server cart
     * @param {Object} item Cart item to add
     * @param {string} token Auth token
     * @returns {Promise<boolean>} Success status
     */
    addItemToServerCart: async function(item, token) {
        try {
            const productId = item.id_produit || item.id;
            const quantity = item.quantity || 1;
            const variantId = item.variant_id || null;
            
            if (!productId) {
                console.error('Invalid item without product ID:', item);
                return false;
            }
            
            // Get API URL from config or use fallback
            const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                ? window.CONFIG.API_URL 
                : 'http://localhost/site-fitness/backend/api';
            
            console.log('Adding to server cart:', { productId, quantity, variantId, apiUrl });
            
            const response = await fetch(`${apiUrl}/cart/add.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity,
                    variant_id: variantId
                })
            });
            
            const responseText = await response.text();
            console.log('Server response:', responseText);
            
            try {
                const result = JSON.parse(responseText);
                return result.success === true;
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                return false;
            }
            
        } catch (error) {
            console.error('Error adding item to server cart:', error);
            return false;
        }
    },
    
    /**
     * Clear local cart
     */
    clearLocalCart: function() {
        localStorage.setItem('fitzone_cart', JSON.stringify({ items: [], total: 0 }));
        localStorage.removeItem('cartItems'); // Clear legacy format too
    }
};
