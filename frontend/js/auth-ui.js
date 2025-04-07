/**
 * FitZone Auth UI Module v1.1
 * Handles authentication UI updates across all pages
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication UI
    initAuthUI();
    
    /**
     * Initialize authentication UI
     */
    function initAuthUI() {
        // Check if user is logged in
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        // Update UI based on login state
        updateAuthDisplay(isLoggedIn);
        
        // Setup logout functionality
        setupLogout();
    }
    
    /**
     * Update authentication display elements
     */
    function updateAuthDisplay(isLoggedIn) {
        // Get menu elements
        const loginMenu = document.getElementById('account-menu-login');
        const userMenu = document.getElementById('account-menu-dropdown');
        
        if (isLoggedIn) {
            // User is logged in - show dropdown, hide login
            if (loginMenu) loginMenu.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            
            // Get user data
            const user = FitZoneAuth.getCurrentUser();
            
            // Update username display
            const usernameElement = document.getElementById('user-name-nav');
            if (usernameElement && user && user.prenom) {
                usernameElement.textContent = user.prenom;
            }
        } else {
            // User is not logged in - show login, hide dropdown
            if (loginMenu) loginMenu.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
    
    /**
     * Setup logout functionality
     */
    function setupLogout() {
        // Find all logout buttons/links
        const logoutElements = document.querySelectorAll('#logout-link, .logout-link, #logout-btn');
        
        // Add click handler to each
        logoutElements.forEach(element => {
            if (element) {
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Logout clicked');
                    performLogout();
                });
            }
        });
    }
    
    /**
     * Perform logout and redirect
     */
    function performLogout() {
        // Check if FitZoneAuth exists
        if (typeof FitZoneAuth !== 'undefined') {
            // Perform logout
            const success = FitZoneAuth.logout();
            
            if (success) {
                console.log('Logout successful, redirecting to home page');
                
                // Force page reload to home page
                window.location.href = 'index.html';
                
                // In case the above doesn't work immediately
                setTimeout(function() {
                    window.location.replace('index.html');
                }, 100);
            } else {
                console.error('Logout failed');
                alert('Logout failed. Please try again.');
            }
        } else {
            console.error('FitZoneAuth not available');
            
            // Fallback logout - clear storage and redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
    
    // Listen for logout events to update UI immediately
    window.addEventListener('fitzone_logout', function() {
        updateAuthDisplay(false);
    });
});
