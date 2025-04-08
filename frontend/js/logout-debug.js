/**
 * Logout debugging utilities
 * Helps diagnose and fix issues with logout functionality
 */
(function() {
    console.log('Logout debug utilities installed');
    
    // Wait for FitZoneAuth to be available
    let initCheckAttempts = 0;
    const maxInitCheckAttempts = 5;
    
    function initLogoutDebug() {
        if (typeof FitZoneAuth !== 'undefined') {
            setupLogoutDebug();
        } else if (initCheckAttempts < maxInitCheckAttempts) {
            initCheckAttempts++;
            setTimeout(initLogoutDebug, 300);
        } else {
            console.log('FitZoneAuth not available, logout debug utilities not installed');
        }
    }
    
    function setupLogoutDebug() {
        // Store reference to original logout function
        const originalLogout = FitZoneAuth.logout;
        
        // Create global debug object
        window.LogoutDebug = {
            // Force logout ignoring any prevention mechanisms
            forceLogout: function() {
                console.log('Forcing logout');
                
                // Clear all auth data
                localStorage.removeItem('fitzone_token');
                localStorage.removeItem('fitzone_user');
                localStorage.removeItem('fitzone_auth_state');
                localStorage.removeItem('fitzone_login_timestamp');
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('auth:stateChanged', {
                    detail: { isLoggedIn: false }
                }));
                
                // Redirect to home
                window.location.href = 'index.html';
            },
            
            // Check auth state
            checkAuthState: function() {
                const token = localStorage.getItem('fitzone_token');
                const userData = localStorage.getItem('fitzone_user');
                
                console.group('Auth State Debug');
                console.log('Token exists:', !!token);
                console.log('User data exists:', !!userData);
                
                try {
                    if (userData) {
                        const user = JSON.parse(userData);
                        console.log('Valid user data:', !!user);
                        console.log('User ID:', user.id_utilisateur);
                    }
                } catch (e) {
                    console.error('Invalid user data JSON');
                }
                
                console.log('FitZoneAuth.isLoggedIn():', 
                    typeof FitZoneAuth !== 'undefined' ? 
                    FitZoneAuth.isLoggedIn() : 'FitZoneAuth not available');
                
                console.groupEnd();
                
                return {
                    hasToken: !!token,
                    hasUserData: !!userData
                };
            },
            
            // Reset logout prevention
            resetLogoutPrevention: function() {
                // Reset any anti-logout mechanisms
                localStorage.setItem('fitzone_auth_state', 'active');
                localStorage.setItem('fitzone_login_timestamp', Date.now().toString());
                window.lastUserInteraction = Date.now();
            }
        };
        
        // Register logout event listener
        document.addEventListener('auth:stateChanged', function(event) {
            if (event.detail && event.detail.isLoggedIn === false) {
                console.log('Logout event detected');
            }
        });
    }
    
    // Start initialization
    setTimeout(initLogoutDebug, 500);
    
    // Set up safe logout for specific pages
    function setupSafeLogout() {
        // Only run this on profile page for now
        if (window.location.pathname.includes('profile.html')) {
            // Profile logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                console.log('Setting up safe logout on profile logout button');
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    safeLogout();
                });
            }
            
            // Navigation logout link
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                console.log('Setting up safe logout on profile navbar link');
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    safeLogout();
                });
            }
        }
    }
    
    function safeLogout() {
        console.log('Performing safe logout');
        
        // Clear auth data
        localStorage.removeItem('fitzone_token');
        localStorage.removeItem('fitzone_user');
        localStorage.removeItem('fitzone_auth_state');
        localStorage.removeItem('fitzone_login_timestamp');
        
        // Redirect to home
        window.location.href = 'index.html';
    }
    
    // Set up safe logout when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSafeLogout);
    } else {
        setupSafeLogout();
    }
})();
