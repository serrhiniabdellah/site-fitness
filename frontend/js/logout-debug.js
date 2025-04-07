/**
 * Debug utilities for logout functionality
 */
(function() {
    console.log('Logout debug utilities installed');
    
    // Store original logout function
    if (typeof window.FitZoneAuth !== 'undefined') {
        const originalLogout = window.FitZoneAuth.logout;
        
        // Override with debug version
        window.FitZoneAuth.logout = function() {
            console.group('Logout Debug Info');
            console.log('Logout called at:', new Date().toISOString());
            
            try {
                // Auth state before logout
                const beforeToken = localStorage.getItem('fitzone_token');
                const beforeUser = localStorage.getItem('fitzone_user');
                
                console.log('Auth before logout:', {
                    hasToken: !!beforeToken, 
                    hasUser: !!beforeUser
                });
                
                // Call original logout with prevention flag off
                window.preventAutoLogout = false;
                const result = originalLogout.apply(this, arguments);
                window.preventAutoLogout = undefined;
                
                // Auth state after logout
                const afterToken = localStorage.getItem('fitzone_token');
                const afterUser = localStorage.getItem('fitzone_user');
                
                console.log('Auth after logout:', {
                    hasToken: !!afterToken, 
                    hasUser: !!afterUser,
                    tokenCleared: beforeToken && !afterToken,
                    userCleared: beforeUser && !afterUser
                });
                
                console.log('Logout success:', result);
                console.groupEnd();
                return result;
            } catch (error) {
                console.error('Logout error:', error);
                console.groupEnd();
                
                // Force logout on error
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                
                return false;
            }
        };
    } else {
        console.warn('FitZoneAuth not available, logout debug utilities not installed');
    }
})();
