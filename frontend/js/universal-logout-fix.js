/**
 * Universal Logout Fix for FitZone
 * This script ensures logout functionality works consistently across all pages
 */

(function() {
    console.log('[Universal Logout Fix] Initializing');
    
    // Run once DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Find and fix all logout links on the page
        fixAllLogoutLinks();
        
        // Patch original FitZoneAuth.logout if available
        patchLogoutFunction();
        
        console.log('[Universal Logout Fix] Setup complete');
    });
    
    // Find and fix all logout buttons/links
    function fixAllLogoutLinks() {
        // Target all possible logout elements
        const logoutElements = document.querySelectorAll(
            '#logout-link, #logout-btn, [data-action="logout"], a[href="#logout"]'
        );
        
        console.log(`[Universal Logout Fix] Found ${logoutElements.length} logout elements`);
        
        logoutElements.forEach(function(element) {
            // Remove existing click handlers by cloning
            const newElement = element.cloneNode(true);
            element.parentNode?.replaceChild(newElement, element);
            
            // Add our reliable handler
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[Universal Logout Fix] Logout requested by user');
                
                // Set global flags to ensure this is recognized as user-initiated
                window.userInitiatedLogout = true;
                window.lastUserInteraction = Date.now();
                
                // First try the direct method if available
                if (window.performDirectLogout) {
                    console.log('[Universal Logout Fix] Using direct logout method');
                    performDirectLogout();
                    redirectAfterLogout();
                    return;
                }
                
                // Fallback to standard auth method
                if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.logout) {
                    console.log('[Universal Logout Fix] Using standard FitZoneAuth logout');
                    FitZoneAuth.logout();
                }
                
                // Force clear auth data regardless of what happened
                console.log('[Universal Logout Fix] Force clearing auth data');
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                
                // Redirect to home page
                redirectAfterLogout();
            });
            
            console.log('[Universal Logout Fix] Attached reliable logout handler to', newElement);
        });
    }
    
    // Redirect after successful logout
    function redirectAfterLogout() {
        console.log('[Universal Logout Fix] Redirecting to home page');
        window.location.href = 'index.html';
    }
    
    // Patch the original logout function
    function patchLogoutFunction() {
        if (typeof FitZoneAuth === 'undefined' || !FitZoneAuth.logout) {
            console.log('[Universal Logout Fix] FitZoneAuth not available yet');
            return;
        }
        
        if (FitZoneAuth._universalFixed) {
            console.log('[Universal Logout Fix] FitZoneAuth already patched');
            return;
        }
        
        console.log('[Universal Logout Fix] Patching FitZoneAuth.logout');
        
        // Store original method
        const originalLogout = FitZoneAuth.logout;
        
        // Replace with fixed version
        FitZoneAuth.logout = function() {
            console.log('[Universal Logout Fix] Enhanced logout called');
            
            try {
                // Call original method
                originalLogout.apply(this, arguments);
                
                // Force clear auth data
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                
                // Dispatch event for UI updates
                document.dispatchEvent(new CustomEvent('auth:stateChanged', { 
                    detail: { isLoggedIn: false }
                }));
                
                console.log('[Universal Logout Fix] Logout completed successfully');
                return true;
            } catch (error) {
                console.error('[Universal Logout Fix] Error during logout:', error);
                
                // Force logout anyway
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                
                return true; // Return success anyway since we cleared localStorage
            }
        };
        
        // Mark as patched
        FitZoneAuth._universalFixed = true;
        console.log('[Universal Logout Fix] FitZoneAuth.logout successfully patched');
    }
})();