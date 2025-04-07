/**
 * FitZone Auth Module v1.3
 * Handles user authentication, registration, and session management
 */

// Prevent duplicate initialization
if (typeof window.FitZoneAuth === 'undefined') {
    window.FitZoneAuth = (function() {
        // Constants
        const AUTH_TOKEN_KEY = 'fitzone_token';
        const USER_DATA_KEY = 'fitzone_user';
        const AUTH_EVENT = 'auth:stateChanged';
        
        // Debug output function - can be enabled/disabled
        const debug = function(message, data) {
            if (CONFIG && CONFIG.DEBUG_MODE) {
                console.log('[AUTH]', message, data || '');
            }
        };
        
        // Get current user data from localStorage
        function getCurrentUser() {
            try {
                const userData = localStorage.getItem(USER_DATA_KEY);
                if (!userData) return null;
                
                return JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                // Clear corrupt data
                localStorage.removeItem(USER_DATA_KEY);
                return null;
            }
        }
        
        // Get auth token from localStorage
        function getToken() {
            return localStorage.getItem(AUTH_TOKEN_KEY);
        }
        
        // Check if user is logged in
        function isLoggedIn() {
            const token = getToken();
            const user = getCurrentUser();
            return !!(token && user);
        }
        
        // Set authentication data
        function setAuthData(token, userData) {
            if (!token) {
                debug('Invalid auth data - missing token');
                return false;
            }
            
            if (!userData) {
                debug('Invalid auth data - missing user data');
                return false;
            }
            
            try {
                // Store token
                localStorage.setItem(AUTH_TOKEN_KEY, token);
                
                // Store user data as JSON string
                if (typeof userData === 'object') {
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
                } else {
                    // Handle non-object user data
                    debug('User data is not an object', typeof userData);
                    return false;
                }
                
                // Trigger auth event
                triggerAuthEvent(true);
                return true;
            } catch (error) {
                console.error('Failed to set auth data:', error);
                return false;
            }
        }
        
        // Clear authentication data on logout
        function clearAuthData() {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(USER_DATA_KEY);
            triggerAuthEvent(false);
        }
        
        // Trigger authentication state change event
        function triggerAuthEvent(isLoggedIn) {
            debug('Auth state changed - User logged in: ' + isLoggedIn);
            
            const event = new CustomEvent(AUTH_EVENT, {
                detail: { isLoggedIn, user: isLoggedIn ? getCurrentUser() : null }
            });
            
            document.dispatchEvent(event);
        }
        
        // Login function
        async function login(credentials) {
            try {
                debug('Logging in user:', credentials.email);
                
                // Make API request to login
                const response = await fetch(`${CONFIG.API_URL}/auth/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                });
                
                // Fallback for non-JSON responses
                let responseText = await response.text();
                let data;
                
                try {
                    // Try to parse JSON
                    data = JSON.parse(responseText);
                } catch (error) {
                    console.error('Invalid JSON response:', responseText);
                    throw new Error('Invalid response from server');
                }
                
                debug('Login response:', data);
                
                // Check if login was successful
                if (data && data.success) {
                    // FLEXIBLE TOKEN HANDLING - Handle different response formats
                    const token = extractToken(data);
                    
                    // Get user data from the response
                    const user = extractUserData(data);
                    
                    // Check that we have both token and user data
                    if (!token) {
                        throw new Error('Missing token in response');
                    }
                    
                    if (!user) {
                        throw new Error('Missing user data in response');
                    }
                    
                    // Set authentication data
                    const success = setAuthData(token, user);
                    
                    if (!success) {
                        throw new Error('Failed to store authentication data');
                    }
                    
                    return data;
                }
                
                // Return error response
                return data || { success: false, message: 'Unknown error occurred' };
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }
        
        // Helper to extract token from different response formats
        function extractToken(data) {
            // Check various possible locations for the token
            if (data.data && data.data.token) {
                return data.data.token;
            } 
            else if (data.token) {
                return data.token;
            } 
            else if (data.data && data.data.user && data.data.user.token) {
                return data.data.user.token;  // This matches your API's structure
            } 
            else if (data.user && data.user.token) {
                return data.user.token;
            }
            else if (data.data && data.data.access_token) {
                return data.data.access_token;
            }
            else if (data.access_token) {
                return data.access_token;
            }
            // If token can't be found, log detailed response for debugging
            console.warn('Token not found in response. Response structure:', JSON.stringify(data));
            return null;
        }
        
        // Helper to extract user data from different response formats
        function extractUserData(data) {
            // Check various possible locations for user data
            if (data.data && data.data.user) {
                return data.data.user;
            } 
            else if (data.user) {
                return data.user;
            }
            else if (data.data && data.data.userData) {
                return data.data.userData;
            }
            else if (data.userData) {
                return data.userData;
            }
            // If user data can't be found, log detailed response for debugging
            console.warn('User data not found in response. Response structure:', JSON.stringify(data));
            return null;
        }
        
        // Register function
        async function register(userData) {
            try {
                // Make API request to register
                const response = await fetch(`${CONFIG.API_URL}/auth/register.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                // Fallback for non-JSON responses
                let responseText = await response.text();
                let data;
                
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    console.error('Invalid JSON response:', responseText);
                    throw new Error('Invalid response from server');
                }
                
                // Return response data
                return data || { success: false, message: 'Unknown error occurred' };
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        }
        
        // Update user profile
        async function updateProfile(userData) {
            try {
                const token = getToken();
                if (!token) {
                    return { success: false, message: 'Not authenticated' };
                }
                
                // Make API request to update profile
                const response = await fetch(`${CONFIG.API_URL}/profile/update.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });
                
                let data = await response.json();
                
                // If successful, update stored user data
                if (data.success && data.data && data.data.user) {
                    const currentUser = getCurrentUser();
                    const updatedUser = { ...currentUser, ...data.data.user };
                    
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
                    triggerAuthEvent(true);
                }
                
                return data;
            } catch (error) {
                console.error('Profile update error:', error);
                throw error;
            }
        }
        
        // Change password
        async function changePassword(passwordData) {
            try {
                const token = getToken();
                if (!token) {
                    return { success: false, message: 'Not authenticated' };
                }
                
                // Make API request to change password
                const response = await fetch(`${CONFIG.API_URL}/auth/change-password.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(passwordData)
                });
                
                return await response.json();
            } catch (error) {
                console.error('Password change error:', error);
                throw error;
            }
        }
        
        // Logout function
        function logout() {
            debug('Logging out user');
            clearAuthData();
            
            // If a logout endpoint exists, call it to invalidate token on server
            const token = getToken();
            if (token) {
                fetch(`${CONFIG.API_URL}/auth/logout.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }).catch(error => {
                    console.error('Logout API call failed:', error);
                });
            }
        }
        
        // Check if token is expired
        function isTokenExpired() {
            try {
                const token = getToken();
                if (!token) return true;
                
                // Check if token is JWT and decode expiration time
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.exp) {
                        return Date.now() >= payload.exp * 1000;
                    }
                }
                
                // For non-JWT tokens or no expiration in JWT
                // Check against login timestamp if available
                const loginTimestamp = localStorage.getItem('fitzone_login_timestamp');
                if (loginTimestamp) {
                    const expireTime = parseInt(loginTimestamp) + (CONFIG.LOGIN_EXPIRES || 24 * 60 * 60 * 1000);
                    return Date.now() >= expireTime;
                }
                
                return false; // Can't determine if expired
            } catch (error) {
                console.error('Error checking token expiration:', error);
                return true; // Assume expired on error
            }
        }
        
        // Initialize the module
        function init() {
            // Check for token expiration
            if (isLoggedIn() && isTokenExpired()) {
                debug('Token expired, logging out');
                logout();
            }
            
            // Update the UI
            triggerAuthEvent(isLoggedIn());
            
            // Listen for storage events (for multi-tab logout)
            window.addEventListener('storage', function(event) {
                if (event.key === AUTH_TOKEN_KEY || event.key === USER_DATA_KEY) {
                    triggerAuthEvent(isLoggedIn());
                    
                    // Update UI if available
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                }
            });
        }
        
        // Public API
        const api = {
            init,
            login,
            register,
            logout,
            isLoggedIn,
            getCurrentUser,
            getToken,
            updateProfile,
            changePassword
        };
        
        // Initialize on creation
        init();
        
        // Return the public API
        return api;
    })();

    console.log('FitZoneAuth initialized');
}
