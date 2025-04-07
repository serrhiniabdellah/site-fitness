// Check if FitZoneAuth is already defined before declaring it
if (typeof FitZoneAuth === 'undefined') {
    // FitZone Authentication Module
    const FitZoneAuth = (function() {
        const API_URL = 'http://127.0.0.1:5500/backend/api';
        
        // Get user data from localStorage
        function getCurrentUser() {
            const userData = localStorage.getItem('fitzone_user');
            return userData ? JSON.parse(userData) : null;
        }
        
        // Check if user is logged in
        function isLoggedIn() {
            return !!getCurrentUser();
        }
        
        // Register new user
        async function register(userData) {
            try {
                const response = await fetch(`${API_URL}/register.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Save user data to localStorage
                localStorage.setItem('fitzone_user', JSON.stringify(data.user));
                
                // Redirect to home page
                window.location.href = 'index.html';
                
                return data;
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'An error occurred. Please try again.');
                throw error;
            }
        }
        
        // Login user
        async function login(email, password) {
            try {
                const response = await fetch(`${API_URL}/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Save user data to localStorage
                localStorage.setItem('fitzone_user', JSON.stringify(data.user));
                
                // Redirect to home page
                window.location.href = 'index.html';
                
                return data;
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message || 'An error occurred. Please try again.');
                throw error;
            }
        }
        
        // Logout user
        async function logout() {
            try {
                const user = getCurrentUser();
                
                if (!user || !user.token) {
                    throw new Error('User not logged in');
                }
                
                // For simplicity, we're not actually calling a backend logout endpoint
                // In a production app, you would call a backend logout endpoint
                
                // Remove user data from localStorage
                localStorage.removeItem('fitzone_user');
                
                // Redirect to login page
                window.location.href = 'login.html';
                
                return { success: true };
            } catch (error) {
                console.error('Logout error:', error);
                // Still remove user data from localStorage on error
                localStorage.removeItem('fitzone_user');
                
                // Redirect to login page
                window.location.href = 'login.html';
                
                throw error;
            }
        }
        
        // Update navigation based on authentication status
        function updateNavigation() {
            const isUserLoggedIn = isLoggedIn();
            const loginLink = document.querySelector('#navbar li a[href="login.html"]');
            
            if (loginLink) {
                if (isUserLoggedIn) {
                    const user = getCurrentUser();
                    const userProfileLink = document.createElement('li');
                    userProfileLink.innerHTML = `<a href="profile.html">${user.prenom} ${user.nom}</a>`;
                    
                    const logoutLink = document.createElement('li');
                    logoutLink.innerHTML = '<a href="javascript:void(0)">Déconnexion</a>';
                    logoutLink.addEventListener('click', logout);
                    
                    loginLink.parentNode.replaceWith(userProfileLink);
                    userProfileLink.parentNode.insertBefore(logoutLink, userProfileLink.nextSibling);
                }
            }
        }
        
        // Initialize module
        function init() {
            // Update navigation when DOM is loaded
            document.addEventListener('DOMContentLoaded', updateNavigation);
        }
        
        // Call init function
        init();
        
        // Public API
        return {
            getCurrentUser,
            isLoggedIn,
            register,
            login,
            logout
        };
    })();
}

// If FitZoneCart is already defined, don't redefine it
if (typeof FitZoneCart === 'undefined') {
    // Create the FitZoneCart global object
    const FitZoneCart = (function() {
        const API_URL = 'http://127.0.0.1:5500/backend/api';
        
        // Initialize cart from localStorage
        function getLocalCart() {
            const cart = localStorage.getItem('fitzone_cart');
            return cart ? JSON.parse(cart) : [];
        }
        
        // Save cart to localStorage
        function saveLocalCart(cart) {
            localStorage.setItem('fitzone_cart', JSON.stringify(cart));
        }
        
        // Add item to cart
        function addToCart(product, quantity = 1, variantId = null) {
            const cart = getLocalCart();
            
            // Check if product is already in cart
            const existingItem = cart.find(item => 
                item.id === product.id && 
                ((!variantId && !item.variant_id) || (item.variant_id === variantId))
            );
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity,
                    variant_id: variantId
                });
            }
            
            // Save updated cart
            saveLocalCart(cart);
            
            // Update cart count in UI
            updateCartCount();
            
            return { success: true };
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
        
        // Get user's cart from server
        async function getUserCart() {
            const user = FitZoneAuth.getCurrentUser();
            
            try {
                const response = await fetch(`${API_URL}/cart/get.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id_utilisateur,
                        token: user.token
                    })
                });
                
                return await response.json();
            } catch (error) {
                console.error('Error fetching cart:', error);
                return { success: false, message: error.message };
            }
        }
        
        // Add item to cart
        async function addItem(productId, quantity = 1) {
            // If user is logged in, add to server cart
            const user = FitZoneAuth.getCurrentUser();
            
            if (user) {
                try {
                    const response = await fetch(`${API_URL}/cart/add.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: user.id_utilisateur,
                            token: user.token,
                            product_id: productId,
                            quantity: quantity
                        })
                    });
                    
                    const result = await response.json();
                    
                    // Update cart count in UI
                    if (result.success) {
                        updateCartCount(result.cart.item_count);
                    }
                    
                    return result;
                } catch (error) {
                    console.error('Error adding to cart:', error);
                    return { success: false, message: error.message };
                }
            } else {
                // For non-authenticated users, use localStorage
                const cart = getLocalCart();
                
                // Check if item already exists
                const existingItem = cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    // Fetch product details
                    try {
                        const productResponse = await fetch(`${API_URL}/product.php?id=${productId}`);
                        const productData = await productResponse.json();
                        
                        if (productData.success) {
                            cart.push({
                                id: productId,
                                name: productData.product.nom_produit,
                                price: productData.product.prix,
                                image: productData.product.image,
                                quantity: quantity
                            });
                        } else {
                            return { success: false, message: 'Product not found' };
                        }
                    } catch (error) {
                        console.error('Error fetching product details:', error);
                        return { success: false, message: error.message };
                    }
                }
                
                // Save updated cart
                saveLocalCart(cart);
                
                // Update cart count in UI
                updateCartCount(cart.reduce((total, item) => total + item.quantity, 0));
                
                return { success: true, message: 'Product added to cart' };
            }
        }
        
        // Initialize cart
        async function initCart() {
            // If user is logged in, get cart from server
            const user = FitZoneAuth.getCurrentUser();
            
            if (user) {
                (async function() {
                    try {
                        const result = await getUserCart();
                        
                        if (result.success) {
                            updateCartCount(result.cart.item_count);
                        }
                    } catch (error) {
                        console.error('Error loading cart:', error);
                    }
                })();
            } else {
                // For non-authenticated users, use localStorage
                const cart = getLocalCart();
                updateCartCount(cart.reduce((total, item) => total + item.quantity, 0));
            }
        }
        
        // Initialize module
        function init() {
            document.addEventListener('DOMContentLoaded', initCart);
        }
        
        // Call init function
        init();
        
        // Public API
        return {
            addItem,
            getUserCart,
            getLocalCart,
            saveLocalCart,
            addToCart,
            updateCartCount
        };
    })();
}

// FitZone Search Module
const FitZoneSearch = (function() {
    const API_URL = 'http://localhost/site%20fitness/backend/api';
    let searchTimeout = null;
    
    // Toggle search bar
    function toggleSearchBar() {
        const searchContainer = document.getElementById('search-container');
        searchContainer.classList.toggle('active');
        
        if (searchContainer.classList.contains('active')) {
            document.getElementById('search-input').focus();
        } else {
            document.getElementById('search-input').value = '';
            document.getElementById('search-results').classList.remove('show');
        }
    }
    
    // Search products
    async function searchProducts(query) {
        try {
            const response = await fetch(`${API_URL}/search.php?q=${encodeURIComponent(query)}&limit=5`);
            return await response.json();
        } catch (error) {
            console.error('Search error:', error);
            return { success: false, message: error.message, results: [] };
        }
    }
    
    // Handle search input
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        const searchResults = document.getElementById('search-results');
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Hide results if query too short
        if (query.length < 2) {
            searchResults.classList.remove('show');
            return;
        }
        
        // Set timeout to avoid making requests on each keystroke
        searchTimeout = setTimeout(async () => {
            const results = await searchProducts(query);
            
            if (results.success && results.results.length > 0) {
                // Render search results
                searchResults.innerHTML = results.results.map(product => `
                    <div class="search-item" data-id="${product.id_produit}">
                        <img src="${product.image || 'img/products/default.jpg'}" alt="${product.nom_produit}">
                        <div class="search-item-details">
                            <div class="search-item-name">${product.nom_produit}</div>
                            <div class="search-item-category">${product.nom_categorie}</div>
                            <div class="search-item-price">$${parseFloat(product.prix).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('');
                
                // Add click event to search items
                document.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        window.location.href = `sproduct.html?id=${item.getAttribute('data-id')}`;
                    });
                });
                
                searchResults.classList.add('show');
            } else {
                searchResults.innerHTML = '<div class="search-item no-results">No products found</div>';
                searchResults.classList.add('show');
            }
        }, 300);
    }
    
    // Search button click handler
    function handleSearchButtonClick() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();
        
        if (query.length >= 2) {
            window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
    }
    
    // Close search when clicking outside
    function handleDocumentClick(event) {
        const searchContainer = document.getElementById('search-container');
        const searchToggle = document.querySelector('.fa-search');
        
        if (searchContainer && searchContainer.classList.contains('active')) {
            // If click is outside search container and not on search toggle
            if (!searchContainer.contains(event.target) && 
                event.target !== searchToggle && 
                !searchToggle.contains(event.target)) {
                toggleSearchBar();
            }
        }
    }
    
    // Initialize module
    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Set up search functionality
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            
            if (searchInput) {
                searchInput.addEventListener('input', handleSearchInput);
                
                // Handle Enter key press
                searchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        handleSearchButtonClick();
                    }
                });
            }
            
            if (searchButton) {
                searchButton.addEventListener('click', handleSearchButtonClick);
            }
            
            // Close search when clicking outside
            document.addEventListener('click', handleDocumentClick);
            
            // Set up search toggle
            const searchToggles = document.querySelectorAll('.fa-search');
            searchToggles.forEach(toggle => {
                toggle.addEventListener('click', function(event) {
                    event.preventDefault();
                    toggleSearchBar();
                });
            });
        });
    }
    
    // Call init function
    init();
    
    // Public API
    return {
        toggleSearchBar,
        searchProducts
    };
})();

// Mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const bar = document.getElementById('bar');
    const nav = document.getElementById('navbar');
    const close = document.getElementById('close');

    if (bar) {
        bar.addEventListener('click', () => {
            nav.classList.add('active');
        });
    }

    if (close) {
        close.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    }
    
    // Add to cart functionality
    document.querySelectorAll('.cart').forEach(cartButton => {
        cartButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productElement = this.closest('.pro');
            if (productElement) {
                const productId = productElement.getAttribute('data-id');
                
                FitZoneCart.addItem(productId, 1).then(result => {
                    if (result.success) {
                        alert('Product added to cart!');
                    } else {
                        alert(result.message || 'Failed to add product to cart');
                    }
                });
            }
        });
    });
    
    // Product detail page
    const addToCartButton = document.getElementById('add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const quantity = parseInt(document.getElementById('qty').value, 10) || 1;
            
            FitZoneCart.addItem(productId, quantity).then(result => {
                if (result.success) {
                    alert('Product added to cart!');
                } else {
                    alert(result.message || 'Failed to add product to cart');
                }
            });
        });
    }

    // Initialize product filtering if on shop page
    if (document.querySelector('.filter-container')) {
        initializeFilters();
    }
});

// Global search toggle function
function toggleSearchBar() {
    FitZoneSearch.toggleSearchBar();
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof FitZoneCart !== 'undefined') {
        FitZoneCart.updateCartCount();
    }
    
    // Search functionality
    function toggleSearchBar() {
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.classList.toggle('active');
        }
    }
    
    // Make toggleSearchBar available globally
    window.toggleSearchBar = toggleSearchBar;
});