/**
 * Authentication Check Utility
 * Include this script on pages that require authentication
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Check if auth is loaded
        if (typeof FitZoneAuth === 'undefined') {
            console.error('Auth module not loaded. Please include auth.js before this script.');
            return;
        }
        
        // Check if user is logged in
        if (!FitZoneAuth.isLoggedIn()) {
            // Get current page URL for redirect
            const currentPage = window.location.pathname.split('/').pop();
            // Redirect to login with return URL
            window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
        }
    });
})();
