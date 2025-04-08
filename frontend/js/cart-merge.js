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
            
            for (const item of localCart.items) {
                try {
                    console.log(`Merging item ${item.id || item.id_produit}`);
                    const addResult = await this.addItemToServerCart(item, token);
                    mergeSuccess = mergeSuccess || addResult;
                } catch (itemError) {
                    console.error(`Failed to merge cart item ${item.id || item.id_produit}:`, itemError);
                }
            }
            
            // 3. Clear the local cart after successful merge
            if (mergeSuccess) {
                console.log('Cart merge successful, clearing local cart');
                this.clearLocalCart();
                
                // Trigger cart update event
                document.dispatchEvent(new CustomEvent('cart:updated'));
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
            if (cart) return cart;
            
            // Try legacy format
            const legacyCart = JSON.parse(localStorage.getItem('cartItems'));
            if (legacyCart && Array.isArray(legacyCart)) {
                return {
                    items: legacyCart,
                    total: legacyCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
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
            
            console.log('Adding to server cart:', { productId, quantity, variantId });
            
            const response = await fetch(`${CONFIG.API_URL}/cart/add.php`, {
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
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const result = await response.json();
            return result.success;
            
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
    },

    /**
     * Merge the anonymous cart with the user's server cart
     * @returns {Promise<boolean>} Success flag
     */
    mergeCartsOnLogin: async function() {
        console.log('Starting cart merge process');
        try {
            // 1. Get the local cart
            const localCart = this.getLocalCart();
            
            if (!localCart || !localCart.items || localCart.items.length === 0) {
                console.log('No local cart items to merge');
                return false;
            }
            
            console.log('Found local cart with', localCart.items.length, 'items to merge');
            
            // 2. Check if user is logged in
            const token = localStorage.getItem('fitzone_token');
            if (!token) {
                console.log('No auth token found, skipping merge');
                return false;
            }
            
            // 3. For each item in the local cart, send to server
            let mergeSuccesses = 0;
            for (const item of localCart.items) {
                try {
                    const productId = item.id_produit || item.id;
                    const quantity = item.quantity || 1;
                    const variantId = item.variant_id || null;
                    
                    console.log(`Adding item to server cart: ${productId} x${quantity}`);
                    
                    await this.addItemToServer(productId, quantity, variantId, token);
                    mergeSuccesses++;
                } catch (itemError) {
                    console.error('Failed to add item to server cart:', itemError);
                }
            }
            
            // 4. Clear local cart after successful merge
            if (mergeSuccesses > 0) {
                localStorage.setItem('fitzone_cart', JSON.stringify({items: [], total: 0}));
                
                // Dispatch cart update event
                document.dispatchEvent(new CustomEvent('cart:updated'));
                
                console.log('Cart merge completed successfully');
                return true;
            } else {
                console.log('No items were successfully merged');
                return false;
            }
        } catch (error) {
            console.error('Error merging carts:', error);
            return false;
        }
    },
    
    /**
     * Add a single cart item to the server
     * @param {number|string} productId Product ID
     * @param {number} quantity Quantity
     * @param {number|string|null} variantId Variant ID (optional)
     * @param {string} token Auth token
     * @returns {Promise<boolean>} Success flag
     */
    addItemToServer: async function(productId, quantity, variantId, token) {
        try {
            // Get API URL from config or use fallback
            const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                ? window.CONFIG.API_URL 
                : 'http://localhost/site_fitness/backend/api';
                
            const payload = {
                product_id: productId,
                quantity: quantity
            };
            
            if (variantId) {
                payload.variant_id = variantId;
            }
            
            const response = await fetch(`${apiUrl}/cart/add.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error(`Error adding product ${productId} to server cart:`, error);
            throw error;
        }
    }
};
