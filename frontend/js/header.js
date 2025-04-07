/**
 * Header component functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Update the header based on authentication status
    function updateHeader() {
        // Check if auth module is loaded
        if (typeof FitZoneAuth === 'undefined') {
            console.warn('Auth module not loaded');
            return;
        }
        
        const loginMenuItem = document.querySelector('ul#navbar li a[href="login.html"]');
        const loginLink = loginMenuItem ? loginMenuItem.parentElement : null;
        
        if (FitZoneAuth.isLoggedIn()) {
            // User is logged in - show account dropdown
            if (loginLink) {
                const user = FitZoneAuth.getCurrentUser();
                loginLink.innerHTML = `
                    <a href="profile.html" class="account-link">
                        ${user ? user.prenom : 'Account'} <i class="fas fa-user"></i>
                    </a>
                    <div class="dropdown-content">
                        <a href="profile.html">My Profile</a>
                        <a href="orders.html">My Orders</a>
                        <a href="#" id="logout-link">Logout</a>
                    </div>
                `;
                
                // Add logout handler
                document.getElementById('logout-link').addEventListener('click', function(e) {
                    e.preventDefault();
                    FitZoneAuth.logout();
                    
                    // Redirect to home page after logout
                    window.location.href = 'index.html';
                });
                
                // Add dropdown functionality
                const accountLink = document.querySelector('.account-link');
                const dropdown = document.querySelector('.dropdown-content');
                
                if (accountLink && dropdown) {
                    accountLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        dropdown.classList.toggle('show');
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', function(e) {
                        if (!e.target.matches('.account-link') && !e.target.closest('.dropdown-content')) {
                            dropdown.classList.remove('show');
                        }
                    });
                }
            }
        } else {
            // User is logged out - show login link
            if (loginLink) {
                loginLink.innerHTML = '<a href="login.html">Login</a>';
            }
        }
    }
    
    // Handle search input in header
    function initSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const searchButton = document.getElementById('search-button');
        
        if (!searchInput || !searchResults || !searchButton) return;
        
        // Search products using the function from products.js
        searchInput.addEventListener('input', function() {
            if (typeof searchProducts !== 'function') {
                console.warn('searchProducts function not available');
                return;
            }
            
            const query = this.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
                return;
            }
            
            const matchingProducts = searchProducts(query);
            
            if (matchingProducts.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-item no-results">
                        No products found matching "${query}"
                    </div>
                `;
            } else {
                searchResults.innerHTML = matchingProducts.slice(0, 5).map(product => `
                    <div class="search-item" data-id="${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="search-item-details">
                            <div class="search-item-name">${product.name}</div>
                            <div class="search-item-category">${product.category}</div>
                            <div class="search-item-price">$${product.price.toFixed(2)}</div>
                        </div>
                    </div>
                `).join('');
                
                // Add click event to search items
                document.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', function() {
                        window.location.href = `sproduct.html?id=${this.dataset.id}`;
                    });
                });
            }
            
            searchResults.classList.add('show');
        });
        
        // Handle search button click
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
            }
        });
        
        // Handle Enter key in search input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length >= 2) {
                    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // Call once on page load
    updateHeader();
    initSearchFunctionality();
    
    // Update when auth state changes
    window.addEventListener('user:login', updateHeader);
    window.addEventListener('user:logout', updateHeader);
    window.addEventListener('user:update', updateHeader);
});
