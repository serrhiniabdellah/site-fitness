const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

// FitZone E-commerce functionality

/**
 * User Authentication and Profile Management
 */
const FitZoneAuth = {
    /**
     * Check if user is logged in
     * @returns {boolean} Login status
     */
    isLoggedIn: function() {
        const user = sessionStorage.getItem('fitzone_current_user');
        return user ? JSON.parse(user).isLoggedIn : false;
    },

    /**
     * Get current user
     * @returns {object|null} User object or null if not logged in
     */
    getCurrentUser: function() {
        const user = sessionStorage.getItem('fitzone_current_user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Log out current user
     */
    logout: function() {
        sessionStorage.removeItem('fitzone_current_user');
        window.location.href = 'index.html';
    },

    /**
     * Update user profile
     * @param {object} userData - Updated user data 
     */
    updateProfile: function(userData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // Get all users from storage
        const users = JSON.parse(localStorage.getItem('fitzone_users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            // Update user data (except password)
            users[userIndex] = {
                ...users[userIndex],
                name: userData.name || users[userIndex].name,
                email: userData.email || users[userIndex].email
            };
            
            // Save back to local storage
            localStorage.setItem('fitzone_users', JSON.stringify(users));
            
            // Update session storage
            const updatedUser = {
                id: currentUser.id,
                name: userData.name || currentUser.name,
                email: userData.email || currentUser.email,
                isLoggedIn: true
            };
            sessionStorage.setItem('fitzone_current_user', JSON.stringify(updatedUser));
            
            return true;
        }
        
        return false;
    },

    /**
     * Initialize auth UI elements
     */
    initUI: function() {
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            
            // Update login links to show user name and dropdown
            loginLinks.forEach(link => {
                const parentLi = link.parentElement;
                if (parentLi) {
                    parentLi.innerHTML = `
                        <a href="#" class="user-profile">${user.name} <i class="far fa-user"></i></a>
                        <ul class="profile-dropdown">
                            <li><a href="profile.html">My Profile</a></li>
                            <li><a href="orders.html">My Orders</a></li>
                            <li><a href="#" id="logout-btn">Logout</a></li>
                        </ul>
                    `;
                }
            });
            
            // Add logout functionality
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
    }
};

/**
 * Shopping Cart Functionality
 */
const FitZoneCart = {
    /**
     * Get cart from local storage
     * @returns {Array} Cart items
     */
    getCart: function() {
        return JSON.parse(localStorage.getItem('fitzone_cart') || '[]');
    },

    /**
     * Save cart to local storage
     * @param {Array} cartItems - Cart items to save
     */
    saveCart: function(cartItems) {
        localStorage.setItem('fitzone_cart', JSON.stringify(cartItems));
        this.updateCartCount();
    },

    /**
     * Add item to cart
     * @param {object} product - Product to add
     * @param {number} quantity - Quantity to add
     */
    addToCart: function(product, quantity = 1) {
        const cart = this.getCart();
        
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        this.saveCart(cart);
        
        // Show notification
        this.showNotification(`${product.name} added to cart!`);
    },

    /**
     * Remove item from cart
     * @param {string} productId - ID of product to remove
     */
    removeFromCart: function(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        this.saveCart(updatedCart);
    },

    /**
     * Update item quantity
     * @param {string} productId - ID of product to update
     * @param {number} quantity - New quantity
     */
    updateQuantity: function(productId, quantity) {
        const cart = this.getCart();
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or negative
                this.removeFromCart(productId);
            } else {
                // Update quantity
                cart[itemIndex].quantity = quantity;
                this.saveCart(cart);
            }
        }
    },

    /**
     * Calculate cart total
     * @returns {number} Cart total price
     */
    calculateTotal: function() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    /**
     * Clear cart
     */
    clearCart: function() {
        localStorage.removeItem('fitzone_cart');
        this.updateCartCount();
    },

    /**
     * Update cart item count in UI
     */
    updateCartCount: function() {
        const cart = this.getCart();
        const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
        
        // Update all cart indicators
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = cartCount;
            
            // Show/hide based on count
            if (cartCount > 0) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    },

    /**
     * Show notification message
     * @param {string} message - Message to display
     */
    showNotification: function(message) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #088178;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 5px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    z-index: 1000;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: opacity 0.3s, transform 0.3s;
                }
                .notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set message and show notification
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },

    /**
     * Initialize cart functionality and UI
     */
    init: function() {
        // Initialize cart count indicator
        const cartBags = document.querySelectorAll('.far.fa-shopping-bag');
        cartBags.forEach(bag => {
            const parent = bag.parentElement.parentElement;
            
            if (parent) {
                // Create cart count indicator
                const cartCount = document.createElement('span');
                cartCount.className = 'cart-count';
                parent.appendChild(cartCount);
            }
        });
        
        // Update cart count
        this.updateCartCount();
        
        // Add event listeners for "Add to Cart" buttons
        document.querySelectorAll('.cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const productElement = e.target.closest('.pro');
                if (productElement) {
                    const product = {
                        id: productElement.dataset.id || Date.now().toString(), // Use data-id if available
                        name: productElement.querySelector('h5').textContent,
                        price: parseFloat(productElement.querySelector('h4').textContent.replace('$', '')),
                        image: productElement.querySelector('img').src
                    };
                    
                    this.addToCart(product);
                }
            });
        });
        
        // Initialize cart page if on cart.html
        if (window.location.pathname.includes('cart.html')) {
            this.initCartPage();
        }
    },

    /**
     * Initialize the cart page
     */
    initCartPage: function() {
        this.renderCartItems();
        
        // Add event listener for quantity changes
        const cartTable = document.getElementById('cart-items');
        if (cartTable) {
            cartTable.addEventListener('change', (e) => {
                if (e.target.classList.contains('qty-input')) {
                    const productId = e.target.dataset.id;
                    const quantity = parseInt(e.target.value);
                    this.updateQuantity(productId, quantity);
                    this.renderCartItems();
                }
            });
            
            // Add event listener for item removal
            cartTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    e.preventDefault();
                    const productId = e.target.dataset.id;
                    this.removeFromCart(productId);
                    this.renderCartItems();
                }
            });
        }
        
        // Add event listener for checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Check if user is logged in
                if (!FitZoneAuth.isLoggedIn()) {
                    alert('Please log in to proceed with checkout.');
                    window.location.href = 'login.html';
                    return;
                }
                
                // Proceed to checkout
                window.location.href = 'checkout.html';
            });
        }
    },

    /**
     * Render cart items in the cart page
     */
    renderCartItems: function() {
        const cartItemsElement = document.getElementById('cart-items');
        const subtotalElement = document.getElementById('subtotal-amount');
        const totalElement = document.getElementById('total-amount');
        
        if (!cartItemsElement) return;
        
        const cart = this.getCart();
        
        if (cart.length === 0) {
            // Cart is empty
            cartItemsElement.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Your cart is empty</td>
                </tr>
            `;
            
            if (subtotalElement) subtotalElement.textContent = '$0.00';
            if (totalElement) totalElement.textContent = '$0.00';
        } else {
            // Generate cart items HTML
            let itemsHTML = '';
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                
                itemsHTML += `
                    <tr>
                        <td><a href="#" class="remove-btn" data-id="${item.id}"><i class="far fa-times-circle"></i></a></td>
                        <td><img src="${item.image}" alt="${item.name}"></td>
                        <td>${item.name}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td><input type="number" value="${item.quantity}" class="qty-input" data-id="${item.id}" min="1"></td>
                        <td>$${itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            });
            
            cartItemsElement.innerHTML = itemsHTML;
            
            // Update subtotal and total
            const subtotal = this.calculateTotal();
            const shipping = subtotal > 0 ? 10 : 0; // $10 shipping fee
            const total = subtotal + shipping;
            
            if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
            if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
};

/**
 * Product Filtering and Searching
 */
const FitZoneProducts = {
    /**
     * Filter products by category
     * @param {string} category - Category to filter by
     */
    filterByCategory: function(category) {
        const products = document.querySelectorAll('.pro');
        
        products.forEach(product => {
            if (category === 'all' || product.dataset.category === category) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    },

    /**
     * Search products by name
     * @param {string} query - Search query
     */
    searchProducts: function(query) {
        const products = document.querySelectorAll('.pro');
        const searchTerm = query.toLowerCase().trim();
        
        products.forEach(product => {
            const productName = product.querySelector('h5').textContent.toLowerCase();
            const productBrand = product.querySelector('span').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || productBrand.includes(searchTerm)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    },

    /**
     * Initialize product filtering
     */
    init: function() {
        // Add data-category attribute to products
        document.querySelectorAll('.pro').forEach(product => {
            // If data-category is not set, try to determine from product name
            if (!product.dataset.category) {
                const name = product.querySelector('h5').textContent.toLowerCase();
                
                if (name.includes('mass') || name.includes('gainer')) {
                    product.dataset.category = 'mass-gainers';
                } else if (name.includes('bcaa')) {
                    product.dataset.category = 'bcaa';
                } else if (name.includes('protein')) {
                    product.dataset.category = 'protein';
                } else {
                    product.dataset.category = 'other';
                }
            }
        });
        
        // Add event listeners for category filters
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Filter products
                const category = button.dataset.category;
                this.filterByCategory(category);
            });
        });
        
        // Add event listener for search box
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
    }
};

/**
 * Initialize all functionality when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication UI
    FitZoneAuth.initUI();
    
    // Initialize shopping cart
    FitZoneCart.init();
    
    // Initialize product filtering
    FitZoneProducts.init();
    
    // Add cart count indicator to cart icons
    const cartBags = document.querySelectorAll('.fa-shopping-bag');
    cartBags.forEach(bag => {
        const parent = bag.parentElement;
        if (parent) {
            const cartCount = document.createElement('span');
            cartCount.className = 'cart-count';
            cartCount.style.cssText = 'position:absolute; top:-10px; right:-10px; width:20px; height:20px; background-color:#088178; color:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:12px;';
            parent.style.position = 'relative';
            parent.appendChild(cartCount);
        }
    });
    
    // Update cart count
    FitZoneCart.updateCartCount();
});