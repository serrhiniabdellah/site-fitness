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
