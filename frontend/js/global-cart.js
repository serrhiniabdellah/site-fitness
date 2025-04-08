/**
 * FitZone Global Cart Handler
 * Ensures cart functionality is available on all pages
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Global cart handler initialized');
    
    // Initialize cart functionality without waiting for dependencies
    setupCart();
    
    // Main cart setup function
    function setupCart() {
        try {
            // Update cart count display
            updateCartCount();
            
            // Listen for cart update events
            document.addEventListener('cart:updated', function(e) {
                console.log('Cart updated event received');
                updateCartCount();
            });
            
            // Set up cart item click handlers
            setupCartClickHandlers();
        } catch (err) {
            console.error('Error setting up cart:', err);
        }
    }
    
    // Update cart count display
    function updateCartCount() {
        try {
            // Try to use CartService
            if (window.CartService && typeof window.CartService.getItemCount === 'function') {
                window.CartService.getItemCount().then(count => {
                    updateCartCountUI(count);
                }).catch(err => {
                    console.error('CartService error:', err);
                    fallbackUpdateCartCount();
                });
            } else {
                // Fallback to localStorage
                fallbackUpdateCartCount();
            }
        } catch (err) {
            console.error('Error updating cart count:', err);
            fallbackUpdateCartCount();
        }
    }
    
    // Fallback cart count update using localStorage
    function fallbackUpdateCartCount() {
        try {
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const count = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
            updateCartCountUI(count);
        } catch (err) {
            console.error('Error in fallback cart count:', err);
            updateCartCountUI(0);
        }
    }
    
    // Update cart count in UI
    function updateCartCountUI(count) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = count;
            
            if (count > 0) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }
    
    // Setup global cart click handlers
    function setupCartClickHandlers() {
        document.addEventListener('click', function(event) {
            // Handle add-to-cart clicks
            const addToCartBtn = event.target.classList.contains('cart') || 
                  event.target.closest('.fa-shopping-cart') || 
                  event.target.closest('.cart');
            
            if (addToCartBtn && !event.target.closest('#lg-bag')) {
                event.preventDefault();
                
                // Find the closest product container
                const productElement = event.target.closest('.pro');
                if (!productElement) return;
                
                try {
                    const productId = productElement.getAttribute('data-id');
                    if (!productId) return;
                    
                    // Get product details
                    const nameElement = productElement.querySelector('h5');
                    const priceElement = productElement.querySelector('h4');
                    const imageElement = productElement.querySelector('img');
                    
                    // Parse price from text (remove $ and convert to number)
                    let price = 0;
                    if (priceElement) {
                        const priceText = priceElement.textContent;
                        price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                    }
                    
                    const product = {
                        id: productId,
                        name: nameElement ? nameElement.textContent : 'Product',
                        price: isNaN(price) ? 0 : price,
                        image: imageElement ? imageElement.getAttribute('src') : ''
                    };
                    
                    console.log('Adding product to cart:', product);
                    
                    // Try to add using CartService
                    if (window.CartService && typeof window.CartService.addItem === 'function') {
                        window.CartService.addItem(product, 1)
                            .then(() => {
                                showAddedToCartMessage(product.name);
                            })
                            .catch(err => {
                                console.error('Error adding item:', err);
                                addToLocalCart(product, 1);
                            });
                    } else {
                        // Fallback to local storage
                        addToLocalCart(product, 1);
                    }
                } catch (err) {
                    console.error('Error handling cart click:', err);
                }
            }
        });
    }
    
    // Add to cart using localStorage fallback
    function addToLocalCart(product, quantity) {
        try {
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            // Check if item already exists
            const existingItemIndex = cartItems.findIndex(item => item.id == product.id);
            
            if (existingItemIndex !== -1) {
                cartItems[existingItemIndex].quantity += quantity;
            } else {
                cartItems.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity
                });
            }
            
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount();
            showAddedToCartMessage(product.name);
        } catch (err) {
            console.error('Error adding to local cart:', err);
        }
    }
    
    // Show "Added to Cart" message
    function showAddedToCartMessage(productName) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.backgroundColor = '#088178';
        toast.style.color = 'white';
        toast.style.padding = '15px 25px';
        toast.style.borderRadius = '5px';
        toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        toast.style.zIndex = '999';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease-in-out';
        
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>
                <div style="font-weight:600">${productName || 'Product'} added to cart!</div>
                <a href="cart.html" style="color:white;text-decoration:underline;display:inline-block;margin-top:5px;">View Cart</a>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
});

/**
 * Global Cart Helper Functions
 * These functions help with cart operations across the site
 */

// Check if user is logged in (simple version)
function isUserLoggedIn() {
    const hasToken = localStorage.getItem('fitzone_token');
    const hasUser = localStorage.getItem('fitzone_user');
    return hasToken && hasUser;
}

// Handle checkout redirect
function proceedToCheckout() {
    if (isUserLoggedIn()) {
        window.location.href = 'checkout.html';
    } else {
        window.location.href = 'login.html?redirect=checkout.html';
    }
}

// Update cart count across site
function updateCartCount() {
    // Get cart items from local storage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Calculate total quantity
    const totalItems = cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
    
    // Update all cart count elements
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'block' : 'none';
    });
    
    return totalItems;
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});

/**
 * Global cart initialization and event handlers
 */
(function() {
    console.log('Global cart handler initialized');
    
    // Initialize cart UI
    function updateCartCount() {
        if (typeof CartService !== 'undefined') {
            CartService.updateCartCountUI()
                .then(() => console.log('Cart count updated'))
                .catch(error => console.error('Error updating cart count:', error));
        } else {
            console.warn('CartService not available');
            
            // Fallback for legacy cart display
            try {
                const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                const totalItems = cartItems.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
                
                document.querySelectorAll('.cart-count').forEach(element => {
                    element.textContent = totalItems.toString();
                    element.style.display = totalItems > 0 ? 'inline-block' : 'none';
                });
            } catch (error) {
                console.error('Error in fallback cart count update:', error);
            }
        }
    }

    // Run immediately and set up listeners
    document.addEventListener('DOMContentLoaded', function() {
        updateCartCount();
        
        // Listen for cart update events
        document.addEventListener('cart:updated', updateCartCount);
        
        // Attach global add-to-cart handlers for any buttons with data-product-id
        document.querySelectorAll('[data-product-id]').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const productId = this.dataset.productId;
                const quantity = parseInt(this.dataset.quantity || 1);
                
                console.log(`Adding product ${productId} to cart`);
                
                try {
                    if (typeof CartService !== 'undefined') {
                        // Get product data if available
                        const productName = this.dataset.productName;
                        const productPrice = this.dataset.productPrice;
                        const productImage = this.dataset.productImage;
                        
                        // Construct product data object
                        const productData = {
                            name: productName,
                            nom_produit: productName,
                            price: productPrice,
                            prix: productPrice,
                            image: productImage,
                            image_url: productImage
                        };
                        
                        // Add to cart
                        await CartService.addItem(productId, quantity, productData);
                        
                        // Show success message if element exists
                        const msgElement = document.getElementById('cart-message');
                        if (msgElement) {
                            msgElement.textContent = 'Product added to cart!';
                            msgElement.style.display = 'block';
                            setTimeout(() => {
                                msgElement.style.display = 'none';
                            }, 3000);
                        }
                    } else {
                        console.warn('CartService not available for adding product');
                    }
                } catch (error) {
                    console.error('Error adding product to cart:', error);
                }
            });
        });
    });
})();
