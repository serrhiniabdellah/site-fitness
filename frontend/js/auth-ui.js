/**
 * auth-ui.js - Manages authentication UI elements across the site
 * This file provides consistent auth UI handling for all pages.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check and update UI elements based on authentication state
    updateAuthUI();
    
    // Listen for auth state changes
    document.addEventListener('auth:stateChanged', function() {
        updateAuthUI();
    });
    
    // Set up logout handlers
    setupLogoutHandlers();
});

/**
 * Updates UI elements based on authentication state
 */
function updateAuthUI() {
    // Check if auth library is loaded
    const isLoggedIn = typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn && FitZoneAuth.isLoggedIn();
    
    // Get UI elements
    const loginMenu = document.getElementById('account-menu-login');
    const dropdownMenu = document.getElementById('account-menu-dropdown');
    
    if (isLoggedIn) {
        // User is logged in
        if (loginMenu) loginMenu.style.display = 'none';
        if (dropdownMenu) dropdownMenu.style.display = 'block';
        
        // Update user name in dropdown
        const user = FitZoneAuth.getCurrentUser();
        const userNameNav = document.getElementById('user-name-nav');
        if (userNameNav && user && user.prenom) {
            userNameNav.textContent = user.prenom;
        }
    } else {
        // User is not logged in
        if (loginMenu) loginMenu.style.display = 'block';
        if (dropdownMenu) dropdownMenu.style.display = 'none';
    }
}

/**
 * Sets up logout handlers for all logout links
 */
function setupLogoutHandlers() {
    // Find all logout links
    const logoutLinks = document.querySelectorAll('#logout-link, #logout-btn');
    
    logoutLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout clicked');
            
            // Set flag for user-initiated logout
            window.userInitiatedLogout = true;
            
            if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.logout) {
                // Call logout function
                const result = FitZoneAuth.logout();
                
                // Clear any auth data from localStorage as a fallback
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                
                // Redirect to index page
                window.location.href = 'index.html';
            } else {
                console.error('FitZoneAuth.logout is not defined');
                // Fallback logout mechanism
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                window.location.href = 'index.html';
            }
        });
    });
}
