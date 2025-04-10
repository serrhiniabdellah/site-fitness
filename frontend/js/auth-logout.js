/**
 * Auth Logout - Reliable logout functionality for FitZone
 * This script fixes logout issues by providing a consistent logout method
 * that works across all pages and bypasses prevention mechanisms.
 */

(function() {
    console.log('Auth logout handler initializing');

    // Wait for FitZoneAuth to be available
    function initAuthLogoutFix() {
        if (typeof window.FitZoneAuth === 'undefined') {
            setTimeout(initAuthLogoutFix, 100);
            return;
        }

        // Store original logout function before any overrides
        const originalLogout = window.FitZoneAuth.logout;

        // Create a direct logout function that bypasses any prevention mechanisms
        window.performDirectLogout = function() {
            console.log('Performing direct logout - bypassing any prevention mechanisms');
            
            try {
                // Check if we can access the original function
                if (typeof originalLogout === 'function') {
                    // Call the original directly
                    originalLogout.call(window.FitZoneAuth);
                }
                
                // Always clear auth data regardless of what the original function does
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                
                console.log('Auth data cleared successfully');
                
                // Dispatch an event for any listeners
                document.dispatchEvent(new CustomEvent('auth:stateChanged', { 
                    detail: { isLoggedIn: false }
                }));
                
                return true;
            } catch (error) {
                console.error('Error during direct logout:', error);
                // Fallback approach
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                return false;
            }
        };

        // Set up user-initiated interaction tracking
        function trackUserInteraction() {
            window.lastUserInteraction = Date.now();
        }
        
        // Track all user interactions
        document.addEventListener('click', trackUserInteraction);
        document.addEventListener('touchstart', trackUserInteraction);
        document.addEventListener('keydown', trackUserInteraction);
        
        // Initialize last interaction time
        window.lastUserInteraction = Date.now();
        
        // Track document ready state to ensure logout links work
        document.addEventListener('DOMContentLoaded', function() {
            // Fix logout buttons across all pages
            setupAllLogoutButtons();
        });

        // Setup all logout buttons
        function setupAllLogoutButtons() {
            // Get all possible logout buttons/links
            const logoutElements = [
                ...document.querySelectorAll('#logout-link'),
                ...document.querySelectorAll('#logout-btn'),
                ...document.querySelectorAll('[data-action="logout"]'),
                ...document.querySelectorAll('a[href="#logout"]')
            ];

            logoutElements.forEach(element => {
                // Remove any existing handlers by cloning the element
                const newElement = element.cloneNode(true);
                if (element.parentNode) {
                    element.parentNode.replaceChild(newElement, element);
                }
                
                // Add our reliable handler
                newElement.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Set a flag to indicate this was user-initiated
                    window.lastUserInteraction = Date.now();
                    window.userInitiatedLogout = true;
                    
                    console.log('Logout clicked - performing reliable logout');
                    
                    // Use our direct logout method
                    const success = window.performDirectLogout();
                    
                    if (success) {
                        // Redirect to home page after successful logout
                        window.location.href = 'index.html';
                    } else {
                        console.error('Logout failed');
                        alert('Logout failed. Please try again.');
                    }
                });
                
                console.log('Attached reliable logout handler to', newElement);
            });
        }

        // If the page is already loaded, set up the buttons immediately
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setupAllLogoutButtons();
        }

        console.log('Auth logout handler initialized and ready');
    }

    // Start the initialization process
    initAuthLogoutFix();
})();