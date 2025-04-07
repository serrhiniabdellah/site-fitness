/**
 * Auth Persistence Handler
 * Ensures consistent auth state across pages and prevents token-related issues
 */
console.log('Auth persistence handler initialized');

// Fix inconsistent state handling logic
function fixAuthState() {
    const token = localStorage.getItem('fitzone_token');
    const userData = localStorage.getItem('fitzone_user');
    
    console.log('Auth State Check');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userData);
    
    try {
        // Only log user details if userData exists
        if (userData) {
            const parsedUser = JSON.parse(userData);
            console.log('User ID:', parsedUser.id_utilisateur);
            console.log('User email:', parsedUser.email);
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
    }

    // Handle inconsistent state more gracefully
    if ((!token && userData) || (token && !userData)) {
        console.log(' Inconsistent auth state detected');
        
        // Instead of immediately clearing, try to recover if possible
        if (!token && userData) {
            // No token but user data exists - user needs to log in again
            console.log('Redirecting to login page');
            // Only redirect if on a protected page
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('index.html') &&
                !window.location.pathname.includes('shop.html')) {
                // Create a soft redirect - preserve the referrer
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
                return;
            }
        }
        
        // If we can't recover or on a public page, clear both to be safe
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function(key) {
            console.log('[Auth Event] Removing ' + key);
            return originalRemoveItem.call(localStorage, key);
        };
        
        localStorage.removeItem('fitzone_token');
        localStorage.removeItem('fitzone_user');
        
        // Restore original method
        localStorage.removeItem = originalRemoveItem;
    }
}

// Create a safe wrapper for localStorage to prevent accidental logout
const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
    // Don't interfere with normal localStorage operations for non-auth keys
    if (key !== 'fitzone_token' && key !== 'fitzone_user') {
        return originalRemoveItem.call(localStorage, key);
    }
    
    // Check if this is part of our own logout flow
    const isLogoutFlow = window.isLoggingOut === true;
    const stack = new Error().stack || '';
    const isFromLogoutFunction = stack.includes('logout');
    
    if (!isLogoutFlow && !isFromLogoutFunction && key === 'fitzone_token') {
        console.log(' Prevented duplicate logout attempt');
        return;
    }
    
    // Allow the operation
    console.log('[Auth Event] Removing ' + key);
    return originalRemoveItem.call(localStorage, key);
};

// Check auth state on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Auth Event] Page loaded, checking auth state');
    
    // Delay to ensure other scripts have loaded
    setTimeout(fixAuthState, 10);
    
    // Listen for auth changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'fitzone_token' || event.key === 'fitzone_user') {
            console.log('[Auth Event] Storage changed for ' + event.key);
            fixAuthState();
        }
    });
});

console.log('Auth persistence protection active');
