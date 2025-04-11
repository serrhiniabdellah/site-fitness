/**
 * Auth Header
 * Consistent auth behavior across all pages
 * Include this file on all pages after auth-persistence.js
 */
(function() {
    console.log('Auth header initialized');
    
    // Track user interactions to reliably determine user-initiated actions
    window.lastUserInteraction = Date.now();
    document.addEventListener('click', function() {
        window.lastUserInteraction = Date.now();
    });
    document.addEventListener('touchstart', function() {
        window.lastUserInteraction = Date.now();
    });
    document.addEventListener('keydown', function() {
        window.lastUserInteraction = Date.now();
    });
    // Always consider logout as user initiated (FIXED)
    window.userInitiatedLogout = true;
    
    // Run this once the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Check if auth debug is available and run it
        if (window.AuthDebug) {
            console.log('Auth debug tools available');
            AuthDebug.checkState();
        }
        
        // Update UI based on login state
        updateAuthUI();
        
        // Listen for auth changes (like from localStorage events)
        document.addEventListener('auth:storageChange', function() {
            console.log('Auth storage changed, updating UI');
            updateAuthUI();
        });
        
        // Add event listeners to logout links
        setupLogoutHandlers();
    });
    
    // Setup all logout handlers
    function setupLogoutHandlers() {
        // Handle all logout links
        const logoutLinks = document.querySelectorAll('#logout-link, #logout-btn, [data-action="logout"], a[href="#logout"]');
        logoutLinks.forEach(function(link) {
            // Clone the element to remove any previous event listeners
            const oldElement = link;
            const newElement = link.cloneNode(true);
            if (oldElement.parentNode) {
                oldElement.parentNode.replaceChild(newElement, oldElement);
            }
            
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Logout link clicked by user');
                
                // Always set to true to ensure logout is allowed
                window.userInitiatedLogout = true;
                window.lastUserInteraction = Date.now();
                
                // Force clear auth data immediately
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                
                // Execute logout directly using our reliable method
                if (window.performDirectLogout) {
                    console.log('Using direct logout method');
                    window.performDirectLogout();
                } else if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.logout) {
                    // Original method
                    console.log('Using FitZoneAuth logout method');
                    FitZoneAuth.logout();
                } else {
                    console.error('FitZoneAuth or logout method not available');
                }
                
                // Always redirect after logout attempt
                console.log('Redirecting to home page after logout');
                window.location.href = 'index.html';
            });
            console.log('Attached reliable logout handler to', newElement);
        });
    }
    
    // Function to update UI elements based on auth state
    window.updateAuthUI = function() {
        const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn();
        
        // Update navigation links
        const loginLinks = document.querySelectorAll('[href="login.html"]');
        if (loginLinks) {
            loginLinks.forEach(link => {
                if (isLoggedIn) {
                    link.textContent = 'My Account';
                    link.href = 'profile.html';
                } else {
                    link.textContent = 'Login';
                    link.href = 'login.html';
                }
            });
        }
        
        // Add/remove logged-in class to body
        if (document.body) {
            if (isLoggedIn) {
                document.body.classList.add('logged-in');
            } else {
                document.body.classList.remove('logged-in');
            }
        }
        
        // Update user name in dropdown if present
        if (isLoggedIn) {
            const userNameNav = document.getElementById('user-name-nav');
            const user = FitZoneAuth.getCurrentUser();
            if (userNameNav && user && user.prenom) {
                userNameNav.textContent = user.prenom;
            }
            
            // Update dropdown menu visibility
            const loginMenu = document.getElementById('account-menu-login');
            const dropdownMenu = document.getElementById('account-menu-dropdown');
            if (loginMenu) loginMenu.style.display = 'none';
            if (dropdownMenu) dropdownMenu.style.display = 'block';
        } else {
            // User is not logged in
            const loginMenu = document.getElementById('account-menu-login');
            const dropdownMenu = document.getElementById('account-menu-dropdown');
            if (loginMenu) loginMenu.style.display = 'block';
            if (dropdownMenu) dropdownMenu.style.display = 'none';
        }
        
        // COMPLETELY REPLACE the FitZoneAuth.logout method
        if (typeof FitZoneAuth !== 'undefined') {
            // Create a new forced logout method that always works
            FitZoneAuth.logout = function() {
                console.log('[FIX] Executing unconditional logout');
                
                try {
                    // Force clear auth data
                    localStorage.removeItem('fitzone_token');
                    localStorage.removeItem('fitzone_user');
                    localStorage.removeItem('fitzone_auth_state');
                    
                    // Dispatch event for UI updates
                    document.dispatchEvent(new CustomEvent('auth:stateChanged', { 
                        detail: { isLoggedIn: false }
                    }));
                    
                    console.log('[FIX] Auth data cleared successfully');
                    return true;
                } catch (error) {
                    console.error('[FIX] Error during logout:', error);
                    return false;
                }
            };
            
            console.log('[FIX] FitZoneAuth.logout replaced with guaranteed working version');
        }
    };
})();
