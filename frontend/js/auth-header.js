/**
 * Auth Header
 * Consistent auth behavior across all pages
 * Include this file on all pages after auth-persistence.js
 */
(function() {
    console.log('Auth header initialized');
    
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
    });
    
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
        
        // If logged in, prevent accidental logout
        if (isLoggedIn && typeof FitZoneAuth !== 'undefined' && !FitZoneAuth._patched) {
            const originalLogout = FitZoneAuth.logout;
            FitZoneAuth.logout = function() {
                console.log('Logout triggered');
                
                // Only proceed if it's a user-initiated action
                const stack = new Error().stack || '';
                const isUserAction = stack.includes('onclick') || stack.includes('addEventListener');
                if (!isUserAction) {
                    console.warn('Prevented automatic logout - not user initiated');
                    return;
                }
                
                // Proceed with actual logout
                originalLogout.apply(this, arguments);
            };
            
            // Mark as patched to avoid double-patching
            FitZoneAuth._patched = true;
        }
    };
})();
