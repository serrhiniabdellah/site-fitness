/**
 * Cart Debugging Utility
 * This file provides tools to diagnose and fix cart-related issues
 */

window.CartDebug = {
    // Show current cart state
    showState: function() {
        console.group('Cart Debug Information');
        
        // Check localStorage
        const localCart = JSON.parse(localStorage.getItem('fitzone_cart') || '{"items":[],"total":0}');
        console.log('Local cart:', localCart);
        
        // Check auth state
        const token = localStorage.getItem('fitzone_token');
        const hasToken = !!token;
        console.log('Has auth token:', hasToken);
        
        if (hasToken) {
            console.log('Token preview:', token.substring(0, 20) + '...');
        }
        
        // Check if CartService is available
        console.log('CartService available:', typeof CartService !== 'undefined');
        
        console.groupEnd();
        
        return {
            localCart,
            hasToken
        };
    },
    
    // Reset cart state
    resetCart: function() {
        localStorage.setItem('fitzone_cart', JSON.stringify({items: [], total: 0}));
        console.log('Local cart reset');
        
        // Try to dispatch event
        try {
            document.dispatchEvent(new CustomEvent('cart:updated'));
            console.log('Cart update event dispatched');
        } catch (e) {
            console.error('Failed to dispatch cart event:', e);
        }
        
        return 'Cart reset complete';
    },
    
    // Fix cart UI issues
    fixCartUI: function() {
        // Update all cart count badges
        const cartItems = JSON.parse(localStorage.getItem('fitzone_cart') || '{"items":[],"total":0}').items;
        const totalItems = cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
        
        // Update all cart count elements
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'inline-block' : 'none';
        });
        
        console.log('Cart UI updated with count:', totalItems);
        return `Updated ${cartCountElements.length} cart count badges`;
    },
    
    // Test adding item to cart
    testAddItem: function(productId = 1, quantity = 1) {
        // Create test item
        const testItem = {
            id: productId,
            name: 'Test Product ' + productId,
            price: 19.99,
            quantity: quantity,
            image_url: 'img/products/f1.jpg'
        };
        
        // Add to local cart
        let cart = JSON.parse(localStorage.getItem('fitzone_cart') || '{"items":[],"total":0}');
        
        // Find if product exists
        const existingIndex = cart.items.findIndex(item => item.id == productId);
        
        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += quantity;
        } else {
            cart.items.push(testItem);
        }
        
        // Update total
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Save cart
        localStorage.setItem('fitzone_cart', JSON.stringify(cart));
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
        console.log('Test item added to cart:', testItem);
        return 'Added test item to cart';
    }
};

// Auto-log availability on console
console.log('Cart debug tools available. Use CartDebug.showState() to inspect cart state.');
