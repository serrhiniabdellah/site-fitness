/**
 * DIRECT LOGOUT - Emergency fix for FitZone logout issues
 * This script provides a direct logout mechanism that cannot be blocked
 */

(function() {
    // Don't run twice
    if (window._directLogoutInstalled) return;
    window._directLogoutInstalled = true;
    
    console.log('[DIRECT LOGOUT] Installing emergency logout system');
    
    // Core logout function that can't be overridden
    function forceLogout() {
        console.log('[DIRECT LOGOUT] Emergency logout executing');
        
        try {
            // Clear all possible auth data keys
            localStorage.removeItem('fitzone_token');
            localStorage.removeItem('fitzone_user');
            localStorage.removeItem('fitzone_auth_state');
            localStorage.removeItem('fitzone_last_activity');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            console.log('[DIRECT LOGOUT] Auth data cleared, redirecting to homepage');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('[DIRECT LOGOUT] Error during logout:', error);
            alert('Logout error occurred. Please close this window and open a new browser window.');
        }
    }
    
    // Function to capture all logout button clicks
    function captureLogoutClicks() {
        // Get all possible logout elements
        document.addEventListener('click', function(e) {
            // Check if the clicked element is a logout button/link
            if (e.target && (
                e.target.id === 'logout-link' || 
                e.target.id === 'logout-btn' ||
                (e.target.getAttribute && e.target.getAttribute('data-action') === 'logout') ||
                (e.target.parentElement && e.target.parentElement.id === 'logout-link') ||
                (e.target.parentElement && e.target.parentElement.id === 'logout-btn') ||
                (e.target.href && e.target.href.endsWith('#logout'))
            )) {
                console.log('[DIRECT LOGOUT] Logout click detected');
                e.preventDefault();
                e.stopPropagation();
                forceLogout();
                return false;
            }
        }, true); // Use capturing to ensure we get the event first
        
        console.log('[DIRECT LOGOUT] Click capturing installed');
    }
    
    // Run setup when DOM is available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', captureLogoutClicks);
    } else {
        captureLogoutClicks();
    }
    
    // Expose the force logout function globally so it can be called from console in emergencies
    window.emergencyLogout = forceLogout;
    
    console.log('[DIRECT LOGOUT] Emergency logout system ready');
})();