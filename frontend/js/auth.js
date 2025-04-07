/**
 * FitZone Authentication Module
 * Handles authentication across the site
 */
const FitZoneAuth = (function() {
    // API URL from config or fallback
    const API_URL = (window.CONFIG && window.CONFIG.API_URL) || 'http://localhost/site_fitness/backend/api';
    
    // Storage keys
    const USER_KEY = 'fitzone_user';
    const TOKEN_KEY = 'fitzone_token';
    
    // Authentication state
    let authenticated = false;
    let currentUser = null;
    let lastRefreshTime = 0;
    
    // Debug logger
    function logDebug(...args) {
        if (window.CONFIG && window.CONFIG.DEBUG_MODE) {
            console.log('[AUTH]', ...args);
        }
    }
    
    // Get current user from localStorage
    function getCurrentUser() {
        if (currentUser) return currentUser;
        
        try {
            const userJSON = localStorage.getItem(USER_KEY);
            currentUser = userJSON ? JSON.parse(userJSON) : null;
            return currentUser;
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear corrupted data
            localStorage.removeItem(USER_KEY);
            currentUser = null;
            return null;
        }
    }
    
    // Check if user is logged in
    function isLoggedIn() {
        // Check cache first to avoid excessive localStorage reads
        if (Date.now() - lastRefreshTime < 5000) {
            return authenticated;
        }
        
        // Otherwise check from localStorage
        const user = getCurrentUser();
        const token = getToken();
        
        authenticated = !!(user && token);
        lastRefreshTime = Date.now();
        
        // Update body attributes for CSS targeting
        if (authenticated) {
            document.body.classList.add('logged-in');
        } else {
            document.body.classList.remove('logged-in');
        }
        
        return authenticated;
    }
    
    // Get authentication token
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    
    // Register a new user
    async function register(userData) {
        try {
            logDebug('Registering user:', userData);
            
            const response = await fetch(`${API_URL}/auth/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('This email is already registered. Please use a different email.');
                }
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            logDebug('Registration response:', data);
            
            if (data.success) {
                // Store user data and token in localStorage
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                localStorage.setItem(TOKEN_KEY, data.token);
                
                // Update memory cache
                currentUser = data.user;
                authenticated = true;
                lastRefreshTime = Date.now();
                
                // Refresh session state
                refreshAuthState();
                
                // Redirect to profile page
                window.location.href = 'profile.html';
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Login user
    async function login(email, password) {
        try {
            logDebug('Logging in user:', email);
            
            const response = await fetch(`${API_URL}/auth/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            // Check for non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                logDebug('Server returned non-JSON response:', text);
                return { success: false, message: 'Invalid server response' };
            }
            
            const data = await response.json();
            logDebug('Login response:', data);
            
            if (data.success) {
                // Store user data and token in localStorage
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                localStorage.setItem(TOKEN_KEY, data.token);
                
                // Set a login timestamp to help with validation
                localStorage.setItem('fitzone_login_timestamp', Date.now().toString());
                
                // Update memory cache
                currentUser = data.user;
                authenticated = true;
                lastRefreshTime = Date.now();
                
                // Explicitly set body class for CSS targeting
                document.body.classList.add('logged-in');
                
                // Refresh session state
                refreshAuthState();
                
                // IMPORTANT: Return success instead of redirecting
                return {
                    success: true,
                    message: 'Login successful',
                    user: data.user
                };
            } else {
                throw new Error(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Logout user
    function logout() {
        logDebug('Logging out user');
        
        // Store previous state to see if we need to dispatch an event
        const wasLoggedIn = authenticated;
        
        // Clear user data and token
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        
        // Update memory cache
        currentUser = null;
        authenticated = false;
        lastRefreshTime = Date.now();
        
        // Update body class for CSS targeting
        document.body.classList.remove('logged-in');
        
        // Only dispatch logout event if user was logged in
        if (wasLoggedIn) {
            dispatchLogoutEvent();
        }
        
        window.location.href = 'index.html';
        
        return true;
    }
    
    // Force refresh of auth state
    function refreshAuthState() {
        const wasLoggedIn = authenticated;
        
        // Clear memory cache to force localStorage check
        currentUser = null;
        lastRefreshTime = 0;
        
        // Check if user is logged in
        const nowLoggedIn = isLoggedIn();
        
        // If state changed, dispatch event
        if (wasLoggedIn !== nowLoggedIn) {
            if (nowLoggedIn) {
                dispatchLoginEvent();
            } else {
                dispatchLogoutEvent();
            }
        }
        
        return nowLoggedIn;
    }
    
    // Helper to dispatch login event
    function dispatchLoginEvent() {
        const event = new CustomEvent('user:login', {
            detail: { user: currentUser }
        });
        window.dispatchEvent(event);
        console.log('Dispatched login event');
    }
    
    // Helper to dispatch logout event
    function dispatchLogoutEvent() {
        window.dispatchEvent(new CustomEvent('user:logout'));
        console.log('Dispatched logout event');
    }
    
    // Update profile
    async function updateProfile(userData) {
        try {
            if (!isLoggedIn()) {
                return { success: false, message: 'Not authenticated' };
            }
            
            const response = await fetch(`${API_URL}/users/update.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                // Update stored user data
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                currentUser = data.user;
                
                return { success: true, message: 'Profile updated', user: data.user };
            } else {
                return { success: false, message: data.message || 'Failed to update profile' };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: `Failed to update profile: ${error.message}` };
        }
    }
    
    // Change password
    async function changePassword(passwordData) {
        try {
            if (!isLoggedIn()) {
                return { success: false, message: 'Not authenticated' };
            }
            
            const response = await fetch(`${API_URL}/users/change-password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(passwordData)
            });
            
            const data = await response.json();
            
            return {
                success: data.success,
                message: data.message || (data.success ? 'Password changed' : 'Failed to change password')
            };
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: `Failed to change password: ${error.message}` };
        }
    }
    
    // Initialize on module load
    function init() {
        // Check if user is logged in
        const loggedIn = isLoggedIn();
        console.log('Auth state changed - User logged in:', loggedIn);
    }
    
    // Call init when the script loads
    init();
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', function(event) {
        if (event.key === USER_KEY || event.key === TOKEN_KEY) {
            refreshAuthState();
        }
    });
    
    // Return public API
    return {
        getCurrentUser,
        isLoggedIn,
        getToken,
        register,
        login,
        logout,
        refreshAuthState,
        updateProfile,
        changePassword
    };
})();

console.log('FitZoneAuth initialized');

/* 
   Ensure token handling is consistent so users remain logged in across pages.
   Store and retrieve the token from localStorage, and keep the "logged in" state 
   unless the user explicitly logs out.
*/

// Example snippet to retain login state:
function setToken(token) {
    localStorage.setItem('fitzone_token', token);
}

// On initialization, load token from localStorage
function initAuth() {
    const savedToken = localStorage.getItem('fitzone_token');
    if (savedToken) {
        // Validate token or assume user is logged in; dispatch login event
        window.dispatchEvent(new Event('user:login'));
    }
    // Check if user is logged in
    const loggedIn = isLoggedIn();
    console.log('Auth state changed - User logged in:', loggedIn);
}

// Logout should clear token
function logout() {
    localStorage.removeItem('fitzone_token');
    window.dispatchEvent(new Event('user:logout'));
}

/**
 * Update UI based on auth state - fixed to handle missing elements
 */
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    window.addEventListener('user:login', updateAuthUI);
    window.addEventListener('user:logout', updateAuthUI);
    document.addEventListener('userLoggedIn', updateAuthUI);
    document.addEventListener('userLoggedOut', updateAuthUI);
});

/**
 * Update UI elements based on auth state - with null checking
 */
function updateAuthUI() {
    const isLoggedIn = FitZoneAuth.isLoggedIn();
    const user = FitZoneAuth.getCurrentUser();
    
    console.log('Auth state changed - User logged in:', isLoggedIn);
    
    // Update login/account links - with safe element checks
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    
    if (loginLinks && loginLinks.length > 0) {
        loginLinks.forEach(link => {
            const parentLi = link.closest('li');
            
            if (!parentLi) return; // Skip if no parent li element
            
            if (isLoggedIn && user) {
                // Change login link to account link
                link.textContent = user.prenom || 'My Account';
                link.href = 'profile.html';
                
                // Safely add logout option (if it doesn't already exist)
                const existingLogout = parentLi.parentNode.querySelector('.logout-link');
                
                if (!existingLogout && parentLi.parentNode) {
                    const logoutItem = document.createElement('li');
                    logoutItem.innerHTML = `<a href="#" class="logout-link">Logout</a>`;
                    
                    // Add event listener to the logout link
                    const logoutLink = logoutItem.querySelector('.logout-link');
                    if (logoutLink) {
                        logoutLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            FitZoneAuth.logout();
                            window.location.href = 'index.html';
                        });
                    }
                    
                    // Insert after parent li
                    if (parentLi.nextSibling) {
                        parentLi.parentNode.insertBefore(logoutItem, parentLi.nextSibling);
                    } else {
                        parentLi.parentNode.appendChild(logoutItem);
                    }
                }
            } else {
                // Make sure it's a login link
                link.textContent = 'Login';
                link.href = 'login.html';
                
                // Remove any logout links (safely)
                const logoutLinks = parentLi.parentNode ? parentLi.parentNode.querySelectorAll('.logout-link') : [];
                logoutLinks.forEach(logoutLink => {
                    const logoutLi = logoutLink.closest('li');
                    if (logoutLi && logoutLi.parentNode) {
                        logoutLi.parentNode.removeChild(logoutLi);
                    }
                });
            }
        });
    }
    
    // Update any user-specific elements
    const userNameElements = document.querySelectorAll('.user-name');
    if (userNameElements) {
        userNameElements.forEach(element => {
            element.textContent = isLoggedIn && user ? (user.prenom || 'User') : '';
        });
    }
    
    // Add logged-in class to body for CSS targeting
    if (isLoggedIn) {
        document.body.classList.add('logged-in');
    } else {
        document.body.classList.remove('logged-in');
    }
}

// Log auth module init
console.log('FitZoneAuth initialized');
