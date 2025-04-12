/**
 * FitZone Header Module v2.3
 * Handles navigation bar and account dropdown functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Update auth UI based on login state
    updateAuthUI();
    
    // Handle logout for ALL logout buttons
    setupLogoutHandlers();
    
    // Setup account dropdown toggle functionality
    setupAccountDropdown();
    
    /**
     * Sets up event listeners for all logout buttons
     */
    function setupLogoutHandlers() {
        const logoutElements = document.querySelectorAll('#logout-link, .logout-link, #logout-btn');
        
        logoutElements.forEach(element => {
            if (element) {
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Logout clicked from header');
                    
                    if (typeof FitZoneAuth !== 'undefined') {
                        // Call the logout function
                        const success = FitZoneAuth.logout();
                        
                        if (success) {
                            console.log('Logout successful');
                            
                            // Force page reload to clear state
                            window.location.href = 'index.html';
                            
                            // Backup reload in case the above doesn't work immediately
                            setTimeout(() => {
                                window.location.replace('index.html');
                            }, 100);
                        }
                    } else {
                        console.error('FitZoneAuth not available');
                        
                        // Fallback logout - clear storage
                        localStorage.removeItem('fitzone_token');
                        localStorage.removeItem('fitzone_user');
                        
                        // Redirect
                        window.location.href = 'index.html';
                    }
                });
            }
        });
    }
    
    /**
     * Updates UI based on authentication state
     */
    function updateAuthUI() {
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        // Update navbar login/logout visibility
        updateNavbar(isLoggedIn);
        
        // Update cart count
        updateCartCount();
    }
    
    /**
     * Updates navbar based on login state
     */
    function updateNavbar(isLoggedIn) {
        // Get login/account menu elements
        const loginMenu = document.getElementById('account-menu-login');
        const accountMenu = document.getElementById('account-menu-dropdown');
        
        if (loginMenu && accountMenu) {
            if (isLoggedIn) {
                loginMenu.style.display = 'none';
                accountMenu.style.display = 'block';
                
                // Get user data if logged in
                const user = FitZoneAuth.getCurrentUser();
                
                // Update user name in dropdown
                const userNameNav = document.getElementById('user-name-nav');
                if (userNameNav && user && user.prenom) {
                    userNameNav.textContent = user.prenom;
                }
            } else {
                loginMenu.style.display = 'block';
                accountMenu.style.display = 'none';
            }
        }
    }
    
    /**
     * Set up dropdown menu toggle functionality
     */
    function setupAccountDropdown() {
        const accountLink = document.querySelector('.account-link');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        if (accountLink && dropdownContent) {
            // Toggle dropdown when account link is clicked
            accountLink.addEventListener('click', function(e) {
                e.preventDefault();
                dropdownContent.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!accountLink.contains(e.target) && !dropdownContent.contains(e.target)) {
                    dropdownContent.classList.remove('show');
                }
            });
        }
    }
    
    /**
     * Update cart count display
     */
    function updateCartCount() {
        try {
            const cartData = JSON.parse(localStorage.getItem('fitzone_cart') || '{"items":[]}');
            const count = cartData.items.reduce((total, item) => total + (item.quantity || 0), 0);
            
            document.querySelectorAll('.cart-count').forEach(el => {
                el.textContent = count;
            });
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }
});
