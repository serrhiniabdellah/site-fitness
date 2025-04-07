/**
 * FitZone Cart Module v1.3
 * Handles shopping cart operations
 */
const FitZoneCart = (function() {
    // Constants
    const CART_STORAGE_KEY = 'fitzone_cart';
    const CART_COUNT_SELECTOR = '.cart-count';
    
    // The cart data structure
    let cart = {
        items: [],
        total: 0
    };
    
    /**
     * Initialize cart from local storage
     */
    function init() {
        loadCart();
        updateCartCountDisplay();
        
        // Add event listeners to cart icons
        document.addEventListener('click', function(event) {
            // Check if the click was on an add to cart icon
            if (event.target.classList.contains('cart') || 
                event.target.closest('.fa-shopping-cart') || 
                event.target.closest('.cart')) {
                
                // Find the closest product container
                const productElement = event.target.closest('.pro');
                if (productElement) {
                    event.preventDefault();
                    // Extract product ID and add to cart
                    const productId = productElement.getAttribute('data-id');
                    if (productId) {
                        addToCart(productId);
                    }
                }
            }
        });
        
        // Log initial cart state
        console.log('Cart initialized:', cart);
    }
    
    /**
     * Load cart from local storage
     */
    function loadCart() {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                cart = JSON.parse(savedCart);
                if (!cart.items) cart.items = []; // Ensure items array exists
                if (typeof cart.total !== 'number') cart.total = calculateTotal(); // Recalculate if missing
            }
        } catch (error) {
            console.error('Failed to load cart from storage:', error);
            resetCart();
        }
    }
    
    /**
     * Save cart to local storage
     */
    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Failed to save cart to storage:', error);
        }
    }
    
    /**
     * Reset cart to empty state
     */
    function resetCart() {
        cart = {
            items: [],
            total: 0
        };
        saveCart();
    }
    
    /**
     * Add item to cart or increase quantity if exists
     */
    async function addToCart(productId, quantity = 1) {
        if (!productId) return false;
        
        try {
            // Fetch product details if not provided
            const product = await getProductDetails(productId);
            if (!product) return false;
            
            // Find if product already exists in cart
            const existingItem = cart.items.find(item => item.id === productId);
            
            if (existingItem) {
                // Update quantity
                existingItem.quantity += quantity;
            } else {
                // Add new item
                cart.items.push({
                    id: productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity
                });
            }
            
            // Recalculate total
            cart.total = calculateTotal();
            
            // Save updated cart
            saveCart();
            
            // Update UI
            updateCartCountDisplay();
            
            // Show success message
            showAddToCartMessage(product.name);
            
            console.log(`Added product ${productId} to cart`);
            return true;
        } catch (error) {
            console.error('Failed to add product to cart:', error);
            return false;
        }
    }
    
    /**
     * Alias for addToCart to maintain compatibility with script.js
     */
    function addItem(productId, quantity = 1) {
        return addToCart(productId, quantity);
    }
    
    /**
     * Display add to cart success message
     */
    function showAddToCartMessage(productName) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `
            <div class="cart-toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${productName} added to cart!</span>
                <a href="cart.html">View Cart</a>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
    
    /**
     * Get product details by ID
     */
    async function getProductDetails(productId) {
        // First check if we can find it on the page
        const productElement = document.querySelector(`.pro[data-id="${productId}"]`);
        
        if (productElement) {
            // Extract product details from DOM
            const nameElement = productElement.querySelector('h5');
            const priceElement = productElement.querySelector('h4');
            const imageElement = productElement.querySelector('img');
            
            // Parse price from text (remove $ and convert to number)
            const priceText = priceElement ? priceElement.textContent : '';
            const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
            
            return {
                id: productId,
                name: nameElement ? nameElement.textContent : 'Product',
                price: isNaN(price) ? 0 : price,
                image: imageElement ? imageElement.getAttribute('src') : ''
            };
        }
        
        // If we couldn't find it on the page, try API
        try {
            const response = await fetch(`${CONFIG.API_URL}/products/${productId}.php`);
            const data = await response.json();
            
            if (data.success && data.data) {
                return {
                    id: productId,
                    name: data.data.nom || 'Product',
                    price: data.data.prix || 0,
                    image: data.data.image || ''
                };
            }
        } catch (error) {
            console.error(`Failed to get product details for ${productId}:`, error);
        }
        
        // If all else fails, return basic data
        return {
            id: productId,
            name: 'Product',
            price: 0,
            image: ''
        };
    }
    
    /**
     * Update cart count display in UI
     */
    function updateCartCountDisplay() {
        const count = getCartItemCount();
        const countElements = document.querySelectorAll(CART_COUNT_SELECTOR);
        
        countElements.forEach(element => {
            element.textContent = count;
        });
    }
    
    // Alias for updateCartCountDisplay for script.js compatibility
    function updateCartCount() {
        updateCartCountDisplay();
    }
    
    /**
     * Get total number of items in cart
     */
    function getCartItemCount() {
        return cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    /**
     * Calculate total price of items in cart
     */
    function calculateTotal() {
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    /**
     * Get all cart items
     */
    function getCartItems() {
        return [...cart.items];
    }
    
    /**
     * Get cart total
     */
    function getCartTotal() {
        return cart.total;
    }
    
    // Public API
    return {
        init,
        addToCart,
        addItem, // Add this alias for script.js compatibility
        getCartItems,
        getCartTotal,
        getCartItemCount,
        updateCartCountDisplay,
        updateCartCount, // Add this alias function
        resetCart
    };
})();

// Initialize cart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    FitZoneCart.init();
});
