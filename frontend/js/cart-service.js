/**
 * Cart Service
 * Handles shopping cart functionality for the FitZone e-commerce site
 */
const CartService = (function() {
    // Constants
    const CART_STORAGE_KEY = 'fitzone_cart';
    
    // Private variables and methods
    let cart = { items: [], total: 0 };
    
    /**
     * Initialize cart from localStorage
     */
    function initCart() {
        const storedCart = getLocalCart();
        cart = storedCart || { items: [], total: 0 };
        console.log('Cart initialized:', cart);
    }
    
    /**
     * Get cart from local storage
     * @returns {object} Cart object
     */
    function getLocalCart() {
        try {
            // Try to get stored cart data
            const cartData = localStorage.getItem(CART_STORAGE_KEY);
            
            if (cartData) {
                return JSON.parse(cartData);
            }
            
            // Check for legacy cart format (cartItems key)
            const legacyCartData = localStorage.getItem('cartItems');
            if (legacyCartData) {
                // Convert legacy format to new format
                const legacyItems = JSON.parse(legacyCartData);
                if (Array.isArray(legacyItems)) {
                    // Calculate total from items
                    const total = legacyItems.reduce((sum, item) => {
                        return sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1));
                    }, 0);
                    
                    // Return converted cart
                    return { items: legacyItems, total: total };
                }
            }
        } catch (error) {
            console.error('Error getting cart from localStorage:', error);
        }
        
        // Default empty cart
        return { items: [], total: 0 };
    }
    
    /**
     * Save cart to local storage
     * @param {object} cartData Cart object
     */
    function saveLocalCart(cartData) {
        try {
            // Ensure we have valid cart data
            if (!cartData || typeof cartData !== 'object') {
                cartData = { items: [], total: 0 };
            }
            
            // Ensure items array exists
            if (!Array.isArray(cartData.items)) {
                cartData.items = [];
            }
            
            // Calculate total based on items
            cartData.total = cartData.items.reduce((sum, item) => {
                const price = parseFloat(item.price || item.prix || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0);
            
            // Save to localStorage with both formats for compatibility
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
            localStorage.setItem('cartItems', JSON.stringify(cartData.items));
            
            // Update in-memory cart
            cart = cartData;
            
            // Dispatch event for UI updates
            dispatchCartUpdateEvent();
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }
    
    /**
     * Dispatch cart update event
     */
    function dispatchCartUpdateEvent() {
        document.dispatchEvent(new CustomEvent('cart:updated'));
    }
    
    /**
     * Add item to cart
     * @param {number|string} productId Product ID
     * @param {number} quantity Quantity to add
     * @param {object} productData Additional product data
     * @returns {object} Updated cart
     */
    function addToCart(productId, quantity = 1, productData = {}) {
        try {
            // Get current cart
            const currentCart = getLocalCart();
            
            // Find existing item
            const existingItemIndex = currentCart.items.findIndex(item => {
                return (item.id_produit || item.id) == productId;
            });
            
            // Build item object with all possible property names
            const itemData = {
                id: productId,
                id_produit: productId,
                name: productData.name || productData.nom_produit || `Product ${productId}`,
                nom_produit: productData.name || productData.nom_produit || `Product ${productId}`,
                price: productData.price || productData.prix || 0,
                prix: productData.price || productData.prix || 0,
                image: productData.image || productData.image_url || 'img/products/default.jpg',
                image_url: productData.image || productData.image_url || 'img/products/default.jpg',
                quantity: quantity
            };
            
            if (existingItemIndex !== -1) {
                // Update quantity for existing item
                currentCart.items[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                currentCart.items.push(itemData);
            }
            
            // Save updated cart
            saveLocalCart(currentCart);
            console.log('Item added to cart:', itemData, 'Cart now has', currentCart.items.length, 'items');
            
            return currentCart;
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return getLocalCart();
        }
    }
    
    /**
     * Remove item from cart
     * @param {number|string} productId Product ID
     * @returns {object} Updated cart
     */
    function removeFromCart(productId) {
        try {
            // Get current cart
            const currentCart = getLocalCart();
            
            // Filter out the item to remove
            currentCart.items = currentCart.items.filter(item => {
                return (item.id_produit || item.id) != productId;
            });
            
            // Save updated cart
            saveLocalCart(currentCart);
            
            return currentCart;
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return getLocalCart();
        }
    }
    
    /**
     * Update item quantity
     * @param {number|string} productId Product ID
     * @param {number} quantity New quantity
     * @returns {object} Updated cart
     */
    function updateQuantity(productId, quantity) {
        try {
            if (quantity <= 0) {
                return removeFromCart(productId);
            }
            
            // Get current cart
            const currentCart = getLocalCart();
            
            // Find the item
            const itemIndex = currentCart.items.findIndex(item => {
                return (item.id_produit || item.id) == productId;
            });
            
            if (itemIndex !== -1) {
                // Update quantity
                currentCart.items[itemIndex].quantity = quantity;
                
                // Save updated cart
                saveLocalCart(currentCart);
            }
            
            return currentCart;
        } catch (error) {
            console.error('Error updating quantity:', error);
            return getLocalCart();
        }
    }
    
    // Initialize cart
    initCart();
    
    // Public API
    return {
        /**
         * Get current cart
         * @returns {Promise<object>} Cart object
         */
        getCart: async function() {
            return getLocalCart();
        },
        
        /**
         * Add item to cart
         * @param {number|string} productId Product ID
         * @param {number} quantity Quantity to add
         * @param {object} productData Additional product data
         * @returns {Promise<object>} Updated cart
         */
        addItem: async function(productId, quantity = 1, productData = {}) {
            return addToCart(productId, quantity, productData);
        },
        
        /**
         * Remove item from cart
         * @param {number|string} productId Product ID
         * @returns {Promise<object>} Updated cart
         */
        removeItem: async function(productId) {
            return removeFromCart(productId);
        },
        
        /**
         * Update item quantity
         * @param {number|string} productId Product ID
         * @param {number} quantity New quantity
         * @returns {Promise<object>} Updated cart
         */
        updateQuantity: async function(productId, quantity) {
            return updateQuantity(productId, quantity);
        },
        
        /**
         * Clear cart
         * @returns {Promise<object>} Empty cart
         */
        clearCart: async function() {
            const emptyCart = { items: [], total: 0 };
            saveLocalCart(emptyCart);
            return emptyCart;
        },
        
        /**
         * Get cart item count
         * @returns {Promise<number>} Total number of items
         */
        getItemCount: async function() {
            const currentCart = getLocalCart();
            return currentCart.items.reduce((total, item) => {
                return total + parseInt(item.quantity || 1);
            }, 0);
        },
        
        /**
         * Update cart count UI
         */
        updateCartCountUI: async function() {
            try {
                const itemCount = await this.getItemCount();
                
                // Update all cart count elements
                const cartCountElements = document.querySelectorAll('.cart-count');
                cartCountElements.forEach(element => {
                    element.textContent = itemCount.toString();
                    
                    if (itemCount > 0) {
                        element.style.display = 'inline-block';
                    } else {
                        element.style.display = 'none';
                    }
                });
            } catch (error) {
                console.error('Error updating cart count UI:', error);
            }
        }
    };
})();

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', function() {
    if (CartService && CartService.updateCartCountUI) {
        CartService.updateCartCountUI();
    }
    
    // Listen for cart update events
    document.addEventListener('cart:updated', function() {
        if (CartService && CartService.updateCartCountUI) {
            CartService.updateCartCountUI();
        }
    });
});
