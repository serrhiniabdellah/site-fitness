/**
 * CRITICAL: Global Logout Fix - Ultimate solution for FitZone logout issues
 * This script must be loaded as early as possible in the page
 */

(function() {
    console.log('[GLOBAL LOGOUT FIX] Initializing with priority override');
    
    // Define a permanent, non-overridable force logout function
    Object.defineProperty(window, 'FORCE_LOGOUT', {
        value: function() {
            console.log('[GLOBAL LOGOUT FIX] Force logout executing');
            try {
                // Clear all auth data
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                localStorage.removeItem('fitzone_last_activity');
                
                console.log('[GLOBAL LOGOUT FIX] Auth data cleared');
                window.location.href = 'index.html';
                return true;
            } catch (error) {
                console.error('[GLOBAL LOGOUT FIX] Error during force logout:', error);
                return false;
            }
        },
        writable: false,
        configurable: false
    });
    
    // Set auth flags to ensure logout is always allowed
    window.userInitiatedLogout = true;
    window.preventAutoLogout = false;

    // Permanently make these values non-overridable
    Object.defineProperty(window, 'userInitiatedLogout', {
        value: true,
        writable: false,
        configurable: false
    });
    
    Object.defineProperty(window, 'preventAutoLogout', {
        value: false,
        writable: false,
        configurable: false
    });
    
    // Patch FitZoneAuth as soon as it's available
    function initGlobalLogoutFix() {
        if (typeof FitZoneAuth === 'undefined') {
            console.log('[GLOBAL LOGOUT FIX] Waiting for auth system...');
            setTimeout(initGlobalLogoutFix, 50); // Check more frequently
            return;
        }
        
        console.log('[GLOBAL LOGOUT FIX] Auth system detected, applying fix');
        
        // Replace logout method with one that always works
        FitZoneAuth.logout = function() {
            console.log('[GLOBAL LOGOUT FIX] Enhanced logout called');
            
            // Just clear everything immediately
            localStorage.removeItem('fitzone_token');
            localStorage.removeItem('fitzone_user');
            localStorage.removeItem('fitzone_auth_state');
            localStorage.removeItem('fitzone_last_activity');
            
            // Dispatch event for UI updates
            try {
                document.dispatchEvent(new CustomEvent('auth:stateChanged', { 
                    detail: { isLoggedIn: false }
                }));
            } catch (e) {
                console.error('[GLOBAL LOGOUT FIX] Event dispatch error:', e);
            }
            
            console.log('[GLOBAL LOGOUT FIX] Logout successful');
            return true;
        };
        
        // Make the logout method non-overridable
        try {
            Object.defineProperty(FitZoneAuth, 'logout', {
                writable: false,
                configurable: false
            });
            console.log('[GLOBAL LOGOUT FIX] Locked logout method against overrides');
        } catch (e) {
            console.warn('[GLOBAL LOGOUT FIX] Could not lock logout method:', e);
        }
    }
    
    // Fix all logout links when DOM is ready
    function fixLogoutLinks() {
        console.log('[GLOBAL LOGOUT FIX] Fixing logout links');
        
        const logoutElements = document.querySelectorAll(
            '#logout-link, #logout-btn, [data-action="logout"], a[href="#logout"]'
        );
        
        console.log(`[GLOBAL LOGOUT FIX] Found ${logoutElements.length} logout elements`);
        
        logoutElements.forEach(function(element) {
            // Remove existing listeners by cloning
            const newElement = element.cloneNode(true);
            if (element.parentNode) {
                element.parentNode.replaceChild(newElement, element);
            }
            
            // Add direct, guaranteed logout handler
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[GLOBAL LOGOUT FIX] Logout button clicked');
                
                // Call our non-overridable force logout function
                window.FORCE_LOGOUT();
                return false;
            }, true); // Use capture to ensure our handler runs first
        });
        
        console.log('[GLOBAL LOGOUT FIX] All logout links fixed');
    }
    
    // Start everything
    initGlobalLogoutFix();
    
    // Fix logout links when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixLogoutLinks);
    } else {
        fixLogoutLinks();
    }
    
    // Set up a continuous check to re-apply our fix if needed
    setInterval(function() {
        // Check if FitZoneAuth is defined but logout has been changed
        if (typeof FitZoneAuth !== 'undefined' && 
            (!FitZoneAuth.logout || FitZoneAuth.logout.toString().indexOf('[GLOBAL LOGOUT FIX]') === -1)) {
            console.warn('[GLOBAL LOGOUT FIX] Detected logout method was changed, reapplying fix');
            initGlobalLogoutFix();
        }
    }, 1000);
    
    console.log('[GLOBAL LOGOUT FIX] Setup complete');
})();