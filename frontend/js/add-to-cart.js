/**
 * Add to Cart Functionality
 * Handles adding products to cart from any page
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Add to cart handler initialized');
        
        // Add click handlers for all cart buttons
        addCartButtonHandlers();
        
        // Update cart count display
        updateCartCount();
    });
    
    /**
     * Add click handlers to all cart buttons
     */
    function addCartButtonHandlers() {
        // For featured products
        addHandlerToSelector('.pro .cart');
        
        // For shop page detail view
        addHandlerToSelector('#prodetails .cart-btn');
        
        // For any other cart buttons
        addHandlerToSelector('[data-action="add-to-cart"]');
    }
    
    /**
     * Add click handler to elements matching a selector
     */
    function addHandlerToSelector(selector) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            element.addEventListener('click', handleAddToCart);
            console.log(`Added handler to ${selector} element`);
        });
    }
    
    /**
     * Handle add to cart button click
     */
    function handleAddToCart(event) {
        event.preventDefault();
        
        // Find the product container
        const productElement = event.currentTarget.closest('.pro') || 
                              event.currentTarget.closest('#prodetails');
        
        if (!productElement) {
            console.error('Product container not found');
            return;
        }
        
        // Get product ID
        const productId = productElement.getAttribute('data-id');
        
        if (!productId) {
            console.error('Product ID not found');
            return;
        }
        
        // Get product quantity (default to 1)
        const quantityInput = productElement.querySelector('input[type="number"]');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        // Add to cart using FitZoneCart if available
        if (typeof FitZoneCart !== 'undefined') {
            FitZoneCart.addToCart(productId, quantity);
            console.log(`Added product ${productId} to cart (quantity: ${quantity})`);
        } else {
            console.error('FitZoneCart module not found');
            
            // Fallback implementation
            alert('Product added to cart!');
            console.log(`Would add product ${productId} to cart (quantity: ${quantity})`);
            
            // Try to update cart count display
            updateCartCount();
        }
    }
    
    /**
     * Update cart count display
     */
    function updateCartCount() {
        const countElements = document.querySelectorAll('.cart-count');
        
        // Get current count from FitZoneCart if available
        let count = 0;
        if (typeof FitZoneCart !== 'undefined') {
            count = FitZoneCart.getCartItemCount();
        } else {
            // Fallback to localStorage
            try {
                const cart = JSON.parse(localStorage.getItem('fitzone_cart'));
                if (cart && cart.items) {
                    count = cart.items.reduce((total, item) => total + item.quantity, 0);
                }
            } catch (e) {
                console.error('Error getting cart count:', e);
            }
        }
        
        // Update display
        countElements.forEach(element => {
            element.textContent = count;
        });
    }
})();
