/**
 * FitZone Cart Module
 * Handles shopping cart functionality for both guest and logged-in users
 */
const FitZoneCart = (function() {
    const API_URL = CONFIG?.API_URL || 'http://localhost/site_fitness/backend/api';
    const CART_KEY = 'fitzone_cart';
    
    // Get cart from localStorage
    function getLocalCart() {
        const cartJSON = localStorage.getItem(CART_KEY);
        return cartJSON ? JSON.parse(cartJSON) : [];
    }
    
    // Save cart to localStorage
    function saveLocalCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
    
    // Update cart count in UI
    function updateCartCount() {
        const cart = getLocalCart();
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        if (cartCountElements) {
            cartCountElements.forEach(element => {
                element.textContent = totalItems;
                element.style.display = totalItems > 0 ? 'block' : 'none';
            });
        }
    }
    
    // Add item to cart (works for both logged in and guest users)
    async function addToCart(productId, quantity = 1, options = {}) {
        try {
            // Check if user is logged in
            const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
            
            if (isLoggedIn) {
                // Add to server-side cart
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                const response = await fetch(`${API_URL}/cart/add.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        quantity: quantity,
                        ...options
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Product added to cart!');
                    
                    // Update local cart count based on server response
                    if (result.cart && result.cart.total_items) {
                        updateServerCartCount(result.cart.total_items);
                    } else {
                        // Fallback to local count update
                        updateCartCount();
                    }
                    
                    return { success: true };
                } else {
                    throw new Error(result.message || 'Failed to add item to cart');
                }
            } else {
                // Add to local cart
                const product = await getProductDetails(productId);
                
                if (!product) {
                    throw new Error('Product not found');
                }
                
                addToLocalCart(product, quantity, options);
                alert('Product added to cart!');
                updateCartCount();
                
                return { success: true };
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart: ' + error.message);
            return { success: false, message: error.message };
        }
    }
    
    // Get product details by ID
    async function getProductDetails(productId) {
        try {
            // First try to get product from local products.js
            if (typeof getProductById === 'function') {
                return getProductById(productId);
            }
            
            // If not found locally, try to get from API
            const response = await fetch(`${API_URL}/products/get.php?id=${productId}`);
            const result = await response.json();
            
            if (result.success) {
                return result.product;
            } else {
                throw new Error(result.message || 'Product not found');
            }
        } catch (error) {
            console.error('Error getting product details:', error);
            throw error;
        }
    }
    
    // Add item to local cart
    function addToLocalCart(product, quantity, options = {}) {
        const cart = getLocalCart();
        
        // Check if product is already in cart with same options
        const existingItemIndex = cart.findIndex(item => {
            if (item.id !== product.id) return false;
            
            // Check if options match (e.g., size, flavor, etc.)
            for (const key in options) {
                if (item.options?.[key] !== options[key]) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                options: Object.keys(options).length > 0 ? options : undefined
            });
        }
        
        saveLocalCart(cart);
    }
    
    // Update cart count based on server response
    function updateServerCartCount(count) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        if (cartCountElements) {
            cartCountElements.forEach(element => {
                element.textContent = count;
                element.style.display = count > 0 ? 'block' : 'none';
            });
        }
    }
    
    // Remove item from cart
    async function removeFromCart(productId, options = {}) {
        try {
            const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
            
            if (isLoggedIn) {
                // Remove from server cart
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                const response = await fetch(`${API_URL}/cart/remove.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        product_id: productId,
                        ...options
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update cart count from server
                    if (result.cart && result.cart.total_items) {
                        updateServerCartCount(result.cart.total_items);
                    }
                    
                    return { success: true };
                } else {
                    throw new Error(result.message || 'Failed to remove item from cart');
                }
            } else {
                // Remove from local cart
                removeFromLocalCart(productId, options);
                updateCartCount();
                return { success: true };
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, message: error.message };
        }
    }
    
    // Remove item from local cart
    function removeFromLocalCart(productId, options = {}) {
        let cart = getLocalCart();
        
        cart = cart.filter(item => {
            // Different product ID -> keep item
            if (item.id !== productId) return true;
            
            // Check if options match
            for (const key in options) {
                if (item.options?.[key] !== options[key]) {
                    return true; // Keep item if any option is different
                }
            }
            
            // If we get here, this is the item to remove
            return false;
        });
        
        saveLocalCart(cart);
    }
    
    // Merge local cart with server cart on login
    async function mergeCartsOnLogin() {
        try {
            const localCart = getLocalCart();
            
            // If local cart is empty, nothing to merge
            if (localCart.length === 0) return;
            
            const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
            
            if (!isLoggedIn) return;
            
            // Transfer local cart items to server
            const user = FitZoneAuth.getCurrentUser();
            const token = FitZoneAuth.getToken();
            
            const response = await fetch(`${API_URL}/cart/merge.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id_utilisateur,
                    cart_items: localCart
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear local cart after successful merge
                saveLocalCart([]);
                
                // Update cart count from server
                if (result.cart && result.cart.total_items) {
                    updateServerCartCount(result.cart.total_items);
                }
            } else {
                console.warn('Failed to merge carts:', result.message);
            }
        } catch (error) {
            console.error('Error merging carts:', error);
        }
    }
    
    // Get cart contents (from server if logged in, or local if not)
    async function getCart() {
        try {
            const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
            
            if (isLoggedIn) {
                // Get cart from server
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                
                const response = await fetch(`${API_URL}/cart/get.php`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    return result.cart;
                } else {
                    throw new Error(result.message || 'Failed to load cart');
                }
            } else {
                // Return local cart with product details
                const localCart = getLocalCart();
                const cartWithDetails = await Promise.all(
                    localCart.map(async (item) => {
                        try {
                            const product = await getProductDetails(item.id);
                            return {
                                ...item,
                                product_details: product
                            };
                        } catch (error) {
                            console.warn(`Error getting details for product ${item.id}:`, error);
                            return item;
                        }
                    })
                );
                
                return { items: cartWithDetails, total: calculateCartTotal(cartWithDetails) };
            }
        } catch (error) {
            console.error('Error getting cart:', error);
            throw error;
        }
    }
    
    // Calculate total price for a cart
    function calculateCartTotal(cart) {
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    // Listen for login event to merge carts
    window.addEventListener('user:login', mergeCartsOnLogin);
    
    // Initialize cart on page load
    document.addEventListener('DOMContentLoaded', function() {
        updateCartCount();
    });
    
    // Return public API
    return {
        getLocalCart,
        saveLocalCart,
        addToCart,
        removeFromCart,
        updateCartCount,
        getCart,
        mergeCartsOnLogin
    };
})();
