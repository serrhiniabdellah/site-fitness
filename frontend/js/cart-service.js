/**
 * FitZone Cart Service
 * Unified cart handling for both authenticated and guest users
 */
const CartService = (function() {
    // Wait for CONFIG to be available
    function getConfig() {
        return new Promise((resolve) => {
            if (window.CONFIG) {
                resolve(window.CONFIG);
                return;
            }
            
            const checkConfig = setInterval(() => {
                if (window.CONFIG) {
                    clearInterval(checkConfig);
                    resolve(window.CONFIG);
                }
            }, 100);
        });
    }
    
    // Constants and state
    let isInitialized = false;
    let sessionId = null;
    let CART_STORAGE_KEY = 'fitzone_cart';
    let CART_SESSION_KEY = 'fitzone_cart_session';
    let API_URL = 'http://localhost/site_fitness/backend/api'; // Default fallback
    
    /**
     * Initialize cart service
     */
    async function init() {
        if (isInitialized) return;
        
        console.log('Initializing CartService');
        
        try {
            // Get configuration
            const config = await getConfig();
            if (config) {
                API_URL = config.API_URL || API_URL;
                CART_STORAGE_KEY = config.CART?.STORAGE_KEY || CART_STORAGE_KEY;
                CART_SESSION_KEY = config.CART?.SESSION_ID_KEY || CART_SESSION_KEY;
            }
            
            // Generate or retrieve session ID for guest users
            sessionId = localStorage.getItem(CART_SESSION_KEY);
            if (!sessionId) {
                sessionId = generateSessionId();
                localStorage.setItem(CART_SESSION_KEY, sessionId);
            }
            
            // Listen for auth state changes
            document.addEventListener('auth:stateChanged', function(e) {
                const isLoggedIn = e.detail && e.detail.isLoggedIn;
                
                if (isLoggedIn) {
                    // Sync local cart with server on login
                    syncLocalCartToServer();
                }
            });
            
            isInitialized = true;
            console.log('CartService initialized with sessionId:', sessionId);
        } catch (err) {
            console.error('Failed to initialize CartService:', err);
        }
    }
    
    /**
     * Generate a unique session ID for guest cart
     */
    function generateSessionId() {
        return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get current cart from appropriate source
     */
    async function getCart() {
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        try {
            if (isLoggedIn) {
                return await getServerCart();
            } else {
                return getLocalCart();
            }
        } catch (error) {
            console.error('Error getting cart:', error);
            return getLocalCart(); // Fallback to local cart
        }
    }
    
    /**
     * Get cart from server for authenticated users
     */
    async function getServerCart() {
        try {
            const user = FitZoneAuth.getCurrentUser();
            const token = FitZoneAuth.getToken();
            
            if (!user || !token) {
                throw new Error('User or token missing');
            }
            
            console.log('Fetching cart from server for user:', user.id_utilisateur);
            
            const response = await fetch(`${API_URL}/cart/get.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id_utilisateur
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Server cart data:', data.cart);
                return data.cart || { items: [], total: 0 };
            } else {
                throw new Error(data.message || 'Failed to retrieve cart');
            }
        } catch (error) {
            console.error('Error fetching server cart:', error);
            // Fall back to local cart on error
            return getLocalCart();
        }
    }
    
    /**
     * Get cart from localStorage for guests
     */
    function getLocalCart() {
        try {
            const cartJson = localStorage.getItem(CART_STORAGE_KEY);
            if (cartJson) {
                const cart = JSON.parse(cartJson);
                if (!cart.items) cart.items = [];
                if (typeof cart.total !== 'number') {
                    cart.total = calculateTotal(cart.items);
                }
                console.log('Retrieved local cart:', cart);
                return cart;
            }
        } catch (error) {
            console.error('Error parsing local cart:', error);
        }
        
        // Return empty cart as default
        return { items: [], total: 0 };
    }
    
    /**
     * Save cart to appropriate storage
     */
    async function saveCart(cart) {
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        if (isLoggedIn) {
            return await saveServerCart(cart);
        } else {
            return saveLocalCart(cart);
        }
    }
    
    /**
     * Save cart to localStorage for guests
     */
    function saveLocalCart(cart) {
        try {
            // Ensure cart has the required structure
            if (!cart.items) cart.items = [];
            
            // Recalculate total
            cart.total = calculateTotal(cart.items);
            
            // Save to localStorage
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            
            console.log('Saved cart to localStorage:', cart);
            
            // Dispatch cart update event
            dispatchCartUpdateEvent(cart);
            
            return true;
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Save cart to server for authenticated users
     */
    async function saveServerCart(cart) {
        try {
            const user = FitZoneAuth.getCurrentUser();
            const token = FitZoneAuth.getToken();
            
            if (!user || !token) {
                throw new Error('User or token missing');
            }
            
            console.log('Saving cart to server for user:', user.id_utilisateur);
            
            // We'll update each item individually as that's how our backend API works
            for (const item of cart.items) {
                await fetch(`${API_URL}/cart/update.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: item.id || item.id_produit,
                        variant_id: item.variant_id || null,
                        quantity: item.quantity || 1
                    })
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error saving cart to server:', error);
            // Fall back to local storage
            return saveLocalCart(cart);
        }
    }
    
    /**
     * Add item to cart
     */
    async function addItem(product, quantity = 1, variantId = null) {
        if (!product) return false;
        
        const productId = product.id || product.id_produit;
        if (!productId) {
            console.error('Invalid product data - missing ID:', product);
            return false;
        }
        
        console.log('Adding item to cart:', productId, 'quantity:', quantity, 'variant:', variantId);
        
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        if (isLoggedIn) {
            try {
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                if (!user || !token) throw new Error('User data missing');
                
                const response = await fetch(`${API_URL}/cart/add.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        variant_id: variantId,
                        quantity: quantity
                    })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Failed to add item to cart');
                }
                
                // Update UI
                updateCartCountUI();
                dispatchCartUpdateEvent(await getServerCart());
                
                return true;
            } catch (error) {
                console.error('Error adding item to server cart:', error);
                // Fall back to local cart if server fails
                return addToLocalCart(product, quantity, variantId);
            }
        } else {
            // Not logged in, use local cart
            return addToLocalCart(product, quantity, variantId);
        }
    }
    
    /**
     * Add item to local cart
     */
    function addToLocalCart(product, quantity = 1, variantId = null) {
        const cart = getLocalCart();
        const productId = product.id || product.id_produit;
        
        // Find if product already exists in cart
        const existingItemIndex = cart.items.findIndex(item => {
            const itemId = item.id || item.id_produit;
            const itemVariantId = item.variant_id || null;
            return itemId == productId && 
                  ((variantId && itemVariantId == variantId) || (!variantId && !itemVariantId));
        });
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            const newItem = {
                id: productId,
                id_produit: productId, // Support both formats
                name: product.name || product.nom_produit,
                nom_produit: product.name || product.nom_produit, // Support both formats
                price: product.price || product.prix,
                prix: product.price || product.prix, // Support both formats
                image: product.image || product.image_url,
                image_url: product.image || product.image_url, // Support both formats
                quantity: quantity
            };
            
            if (variantId) {
                newItem.variant_id = variantId;
            }
            
            cart.items.push(newItem);
        }
        
        // Save updated cart
        saveLocalCart(cart);
        
        // Update UI
        updateCartCountUI();
        
        return true;
    }
    
    /**
     * Remove item from cart
     */
    async function removeItem(productId, variantId = null) {
        console.log('Removing item from cart:', productId, 'variant:', variantId);
        
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        if (isLoggedIn) {
            try {
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                if (!user || !token) throw new Error('User data missing');
                
                const response = await fetch(`${API_URL}/cart/remove.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        variant_id: variantId
                    })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Failed to remove item');
                }
                
                // Update UI
                updateCartCountUI();
                dispatchCartUpdateEvent(await getServerCart());
                
                return true;
            } catch (error) {
                console.error('Error removing item from server cart:', error);
                // Fall back to local cart
                return removeFromLocalCart(productId, variantId);
            }
        } else {
            // Not logged in, use local cart
            return removeFromLocalCart(productId, variantId);
        }
    }
    
    /**
     * Remove item from local cart
     */
    function removeFromLocalCart(productId, variantId = null) {
        const cart = getLocalCart();
        
        // Filter out the item to remove
        cart.items = cart.items.filter(item => {
            const itemId = item.id || item.id_produit;
            const itemVariantId = item.variant_id || null;
            return !(itemId == productId && 
                   ((variantId && itemVariantId == variantId) || (!variantId && !itemVariantId)));
        });
        
        // Save updated cart
        saveLocalCart(cart);
        
        // Update UI
        updateCartCountUI();
        
        return true;
    }
    
    /**
     * Update item quantity
     */
    async function updateQuantity(productId, quantity, variantId = null) {
        if (quantity < 1) quantity = 1;
        
        console.log('Updating cart item quantity:', productId, 'quantity:', quantity, 'variant:', variantId);
        
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        if (isLoggedIn) {
            try {
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                if (!user || !token) throw new Error('User data missing');
                
                const response = await fetch(`${API_URL}/cart/update.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        variant_id: variantId,
                        quantity: quantity
                    })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Failed to update quantity');
                }
                
                // Update UI
                updateCartCountUI();
                dispatchCartUpdateEvent(await getServerCart());
                
                return true;
            } catch (error) {
                console.error('Error updating cart on server:', error);
                // Fall back to local cart
                return updateLocalItemQuantity(productId, quantity, variantId);
            }
        } else {
            // Not logged in, use local cart
            return updateLocalItemQuantity(productId, quantity, variantId);
        }
    }
    
    /**
     * Update item quantity in local cart
     */
    function updateLocalItemQuantity(productId, quantity, variantId = null) {
        const cart = getLocalCart();
        
        // Find the item
        const itemIndex = cart.items.findIndex(item => {
            const itemId = item.id || item.id_produit;
            const itemVariantId = item.variant_id || null;
            return itemId == productId && 
                  ((variantId && itemVariantId == variantId) || (!variantId && !itemVariantId));
        });
        
        if (itemIndex !== -1) {
            cart.items[itemIndex].quantity = quantity;
            
            // Save cart and update UI
            saveLocalCart(cart);
            updateCartCountUI();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Clear cart
     */
    async function clearCart() {
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        if (isLoggedIn) {
            try {
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                if (!user || !token) throw new Error('User data missing');
                
                const response = await fetch(`${API_URL}/cart/clear.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur
                    })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Failed to clear cart');
                }
            } catch (error) {
                console.error('Error clearing server cart:', error);
            }
        }
        
        // Always clear local cart too
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [], total: 0 }));
        updateCartCountUI();
        dispatchCartUpdateEvent({ items: [], total: 0 });
        
        return true;
    }
    
    /**
     * Sync local cart to server after login
     */
    async function syncLocalCartToServer() {
        console.log('Syncing local cart to server');
        
        const localCart = getLocalCart();
        
        if (!localCart.items || localCart.items.length === 0) {
            console.log('No local items to sync');
            return; // Nothing to sync
        }
        
        try {
            const user = FitZoneAuth.getCurrentUser();
            const token = FitZoneAuth.getToken();
            
            if (!user || !token) {
                throw new Error('User authentication missing');
            }
            
            console.log('Syncing', localCart.items.length, 'local cart items to server');
            
            // Add each item to server cart
            for (const item of localCart.items) {
                const productId = item.id || item.id_produit;
                const variantId = item.variant_id || null;
                
                await fetch(`${API_URL}/cart/add.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        variant_id: variantId,
                        quantity: item.quantity || 1
                    })
                });
            }
            
            // Clear local cart after successful sync
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [], total: 0 }));
            
            // Update UI with server cart
            updateCartCountUI();
            dispatchCartUpdateEvent(await getServerCart());
            
            console.log('Local cart synced to server successfully');
            
            return true;
        } catch (error) {
            console.error('Error syncing cart to server:', error);
            return false;
        }
    }
    
    /**
     * Calculate cart total
     */
    function calculateTotal(items) {
        return items.reduce((sum, item) => {
            const price = item.price || item.prix || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
        }, 0);
    }
    
    /**
     * Get cart item count
     */
    async function getItemCount() {
        try {
            const cart = await getCart();
            return cart.items.reduce((count, item) => count + (item.quantity || 1), 0);
        } catch (error) {
            console.error('Error getting item count:', error);
            return 0;
        }
    }
    
    /**
     * Update cart count display in UI
     */
    async function updateCartCountUI() {
        try {
            const count = await getItemCount();
            const countElements = document.querySelectorAll('.cart-count');
            
            countElements.forEach(element => {
                if (element) {
                    element.textContent = count.toString();
                }
            });
        } catch (error) {
            console.error('Error updating cart count UI:', error);
        }
    }
    
    /**
     * Dispatch cart update event
     */
    function dispatchCartUpdateEvent(cart) {
        const event = new CustomEvent('cart:updated', {
            detail: { cart }
        });
        document.dispatchEvent(event);
    }
    
    // Initialize the cart service
    init();
    
    // Expose the public API
    return {
        getCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        updateCartCountUI,
        syncLocalCartToServer
    };
})();

// Make CartService globally available
window.CartService = CartService;
