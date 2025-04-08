/**
 * Logout utility function to ensure proper logout handling
 */
function performLogout() {
    console.log('Performing logout');
    
    // Clear all auth-related data
    localStorage.removeItem('fitzone_token');
    localStorage.removeItem('fitzone_user');
    localStorage.removeItem('fitzone_login_timestamp');
    localStorage.removeItem('auth_redirect_count');
    
    // Notify any listeners
    try {
        document.dispatchEvent(new CustomEvent('auth:stateChanged', {
            detail: { isLoggedIn: false }
        }));
    } catch (error) {
        console.warn('Error dispatching logout event:', error);
    }
    
    // Redirect to home page
    console.log('Redirecting to home after logout');
    window.location.href = 'index.html';
}

// Register global logout handler
document.addEventListener('DOMContentLoaded', function() {
    const logoutLinks = document.querySelectorAll('#logout-link, #logout-btn');
    
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            performLogout();
        });
    });
});
