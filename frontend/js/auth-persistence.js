/**
 * Auth Persistence Handler v1.1
 * Prevents accidental logout and ensures tokens persist across sessions
 */
(function() {
    console.log('Auth persistence handler initialized');
    
    // Create global auth debug namespace
    window.AuthDebug = {
        // Log authentication events
        logEvent: function(event, data) {
            console.log(`[Auth Event] ${event}`, data || '');
        },
        
        // Check auth state
        checkState: function() {
            const token = localStorage.getItem('fitzone_token');
            const userData = localStorage.getItem('fitzone_user');
            
            console.group('Auth State Check');
            console.log('Token exists:', !!token);
            console.log('User data exists:', !!userData);
            
            try {
                if (userData) {
                    const user = JSON.parse(userData);
                    console.log('User ID:', user.id_utilisateur);
                    console.log('User email:', user.email);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
            
            console.groupEnd();
            
            return {
                hasToken: !!token,
                hasUserData: !!userData
            };
        },
        
        // Fix common issues
        fixAuthState: function() {
            const state = this.checkState();
            if (state.hasToken !== state.hasUserData) {
                console.warn('Inconsistent auth state detected, clearing for safety');
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                return false;
            }
            return state.hasToken && state.hasUserData;
        }
    };

    // Store original localStorage methods
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    // Track the last login/logout action to prevent race conditions
    let lastAuthAction = {
        type: null,
        time: 0
    };
    
    // Intercept localStorage setItem to debug auth token storage
    localStorage.setItem = function(key, value) {
        // Call original (must come first to prevent recursion)
        originalSetItem.call(localStorage, key, value);
        
        // Track auth events
        if (key === 'fitzone_token' && value) {
            lastAuthAction = { type: 'login', time: Date.now() };
            AuthDebug.logEvent('Token stored', value ? (value.substring(0, 10) + '...') : 'empty value');
            
            // Store login timestamp safely
            originalSetItem.call(localStorage, 'fitzone_login_timestamp', Date.now().toString());
        } 
        else if (key === 'fitzone_user') {
            AuthDebug.logEvent('User data stored');
        }
    };
    
    // Intercept localStorage removeItem to debug auth token removal
    localStorage.removeItem = function(key) {
        // Prevent accidental double logout
        if ((key === 'fitzone_token' || key === 'fitzone_user') && 
            lastAuthAction.type === 'logout' &&
            Date.now() - lastAuthAction.time < 5000) {
            
            console.warn('Prevented duplicate logout attempt');
            return;
        }
        
        // Prevent accidental logout immediately after login
        if ((key === 'fitzone_token' || key === 'fitzone_user') && 
            lastAuthAction.type === 'login' &&
            Date.now() - lastAuthAction.time < 5000) {
            
            console.warn('Prevented logout immediately after login');
            return;
        }
        
        // Record logout event
        if (key === 'fitzone_token' || key === 'fitzone_user') {
            lastAuthAction = { type: 'logout', time: Date.now() };
            AuthDebug.logEvent(`Removing ${key}`);
        }
        
        // Allow removal to proceed
        originalRemoveItem.call(localStorage, key);
    };
    
    // Check auth state on page load
    document.addEventListener('DOMContentLoaded', function() {
        AuthDebug.logEvent('Page loaded, checking auth state');
        AuthDebug.fixAuthState();
    });
    
    // Handle storage events from other tabs/windows
    window.addEventListener('storage', function(event) {
        if (event.key === 'fitzone_token' || event.key === 'fitzone_user') {
            AuthDebug.logEvent(`Storage event for ${event.key}`, event.newValue ? 'New value set' : 'Value removed');
        }
    });
    
    console.log('Auth persistence protection active');
})();
