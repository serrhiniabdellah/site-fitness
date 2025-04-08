/**
 * FitZone Authentication Module
 * Handles user authentication and session management
 */

// Use IIFE to avoid global scope pollution
const FitZoneAuth = (function() {
    // Private variables and methods
    const TOKEN_KEY = 'fitzone_token';
    const USER_KEY = 'fitzone_user';
    const AUTH_STATE_KEY = 'fitzone_auth_state';
    const LAST_ACTIVITY_KEY = 'fitzone_last_activity';
    
    /**
     * Update last activity timestamp
     */
    function updateLastActivity() {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        localStorage.setItem(AUTH_STATE_KEY, 'active');
    }
    
    /**
     * Set up activity tracking
     */
    function setupActivityTracking() {
        // Update activity on user interaction
        ['click', 'touchstart', 'mousemove', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                updateLastActivity();
            });
        });
        
        // Check session every minute
        setInterval(() => {
            const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
            const currentTime = Date.now();
            const inactiveTime = currentTime - lastActivity;
            
            // If inactive for more than 30 minutes, consider logging out
            if (inactiveTime > 30 * 60 * 1000) {
                console.log('Session expired due to inactivity');
                
                // Don't actually log out, just update UI
                document.dispatchEvent(new CustomEvent('auth:sessionExpiring'));
            }
        }, 60000); // Check every minute
    }
    
    // Initialize 
    updateLastActivity();
    setTimeout(setupActivityTracking, 1000);
    
    // Public API
    return {
        /**
         * Login user
         * @param {string} email User email
         * @param {string} password User password
         * @returns {Promise<object>} Login result
         */
        login: async function(email, password) {
            try {
                // Get API URL from config or use default
                const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                    ? window.CONFIG.API_URL 
                    : 'http://localhost/site_fitness/backend/api';
                
                const response = await fetch(`${apiUrl}/auth/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Extract token and user data
                    let token = null;
                    let userData = null;
                    
                    // Check all possible response formats
                    if (data.data?.token) token = data.data.token;
                    else if (data.token) token = data.token;
                    
                    if (data.data?.user) userData = data.data.user;
                    else if (data.user) userData = data.user;
                    
                    if (token && userData) {
                        // Store auth data
                        localStorage.setItem(TOKEN_KEY, token);
                        localStorage.setItem(USER_KEY, JSON.stringify(userData));
                        updateLastActivity();
                        
                        // Dispatch auth event
                        document.dispatchEvent(new CustomEvent('auth:stateChanged', {
                            detail: { isLoggedIn: true, user: userData }
                        }));
                        
                        return {
                            success: true,
                            message: 'Login successful',
                            user: userData
                        };
                    } else {
                        throw new Error('Missing token or user data in response');
                    }
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                return {
                    success: false,
                    message: error.message || 'An error occurred during login'
                };
            }
        },
        
        /**
         * Register new user
         * @param {object} userData User registration data
         * @returns {Promise<object>} Registration result
         */
        register: async function(userData) {
            try {
                // Get API URL from config or use default
                const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                    ? window.CONFIG.API_URL 
                    : 'http://localhost/site_fitness/backend/api';
                
                const response = await fetch(`${apiUrl}/auth/register.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    return {
                        success: true,
                        message: data.message || 'Registration successful',
                        email: userData.email
                    };
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                return {
                    success: false,
                    message: error.message || 'An error occurred during registration'
                };
            }
        },
        
        /**
         * Log out user
         * @returns {boolean} True if logout successful
         */
        logout: function() {
            try {
                // Clear auth data
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(AUTH_STATE_KEY);
                
                // Dispatch auth event
                document.dispatchEvent(new CustomEvent('auth:stateChanged', {
                    detail: { isLoggedIn: false }
                }));
                
                return true;
            } catch (error) {
                console.error('Logout error:', error);
                return false;
            }
        },
        
        /**
         * Check if user is logged in
         * @returns {boolean} True if user is logged in
         */
        isLoggedIn: function() {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                const userStr = localStorage.getItem(USER_KEY);
                
                if (!token || !userStr) {
                    return false;
                }
                
                try {
                    // Verify user data is valid JSON
                    const userData = JSON.parse(userStr);
                    if (!userData || !userData.id_utilisateur) {
                        return false;
                    }
                    
                    // Update last activity when checking login status
                    updateLastActivity();
                    
                    return true;
                } catch (e) {
                    // Invalid user data
                    localStorage.removeItem(USER_KEY);
                    return false;
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                return false;
            }
        },
        
        /**
         * Get current user data
         * @returns {object|null} User data or null if not logged in
         */
        getCurrentUser: function() {
            if (!this.isLoggedIn()) {
                return null;
            }
            
            const userStr = localStorage.getItem(USER_KEY);
            
            try {
                return JSON.parse(userStr);
            } catch (e) {
                localStorage.removeItem(USER_KEY);
                return null;
            }
        },
        
        /**
         * Get authentication token
         * @returns {string|null} Auth token or null if not logged in
         */
        getToken: function() {
            return localStorage.getItem(TOKEN_KEY);
        },
        
        /**
         * Update user profile
         * @param {object} profileData Profile data to update
         * @returns {Promise<object>} Update result
         */
        updateProfile: async function(profileData) {
            try {
                if (!this.isLoggedIn()) {
                    throw new Error('User not logged in');
                }
                
                // Get API URL from config or use default
                const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                    ? window.CONFIG.API_URL 
                    : 'http://localhost/site_fitness/backend/api';
                
                const response = await fetch(`${apiUrl}/profile/update.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(profileData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Update local user data if provided in response
                    if (data.data?.user) {
                        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
                        
                        // Update token if provided
                        if (data.data.token) {
                            localStorage.setItem(TOKEN_KEY, data.data.token);
                        }
                        
                        // Dispatch auth event
                        document.dispatchEvent(new CustomEvent('auth:stateChanged', {
                            detail: { 
                                isLoggedIn: true,
                                user: data.data.user
                            }
                        }));
                    }
                    
                    return {
                        success: true,
                        message: data.message || 'Profile updated successfully'
                    };
                } else {
                    throw new Error(data.message || 'Profile update failed');
                }
            } catch (error) {
                console.error('Profile update error:', error);
                return {
                    success: false,
                    message: error.message || 'An error occurred while updating profile'
                };
            }
        },
        
        /**
         * Change user password
         * @param {object} passwordData Password change data
         * @returns {Promise<object>} Change result
         */
        changePassword: async function(passwordData) {
            try {
                if (!this.isLoggedIn()) {
                    throw new Error('User not logged in');
                }
                
                // Get API URL from config or use default
                const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
                    ? window.CONFIG.API_URL 
                    : 'http://localhost/site_fitness/backend/api';
                
                const response = await fetch(`${apiUrl}/auth/change-password.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(passwordData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    return {
                        success: true,
                        message: data.message || 'Password changed successfully'
                    };
                } else {
                    throw new Error(data.message || 'Password change failed');
                }
            } catch (error) {
                console.error('Password change error:', error);
                return {
                    success: false,
                    message: error.message || 'An error occurred while changing password'
                };
            }
        }
    };
})();

// Initialize auth state check
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = FitZoneAuth.isLoggedIn();
    
    // Dispatch auth state event
    document.dispatchEvent(new CustomEvent('auth:stateChanged', {
        detail: { isLoggedIn }
    }));
});
