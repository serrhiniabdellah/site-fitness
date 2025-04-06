/**
 * FitZone Authentication Module
 */
const FitZoneAuth = (function() {
    // Use the centralized API URL from config.js
    const API_URL = CONFIG.API_URL;
    const AUTH_TOKEN_KEY = 'fitzone_auth_token';
    const USER_DATA_KEY = 'fitzone_user_data';
    
    // Register a new user
    async function register(userData) {
        try {
            console.log('Registering user with data:', userData);
            
            // Format the data for the backend
            const registrationData = {
                prenom: userData.first_name || userData.prenom,
                nom: userData.last_name || userData.nom,
                email: userData.email,
                password: userData.password
            };
            
            const response = await fetch(`${API_URL}/users/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });
            
            // Log the status and headers for debugging
            console.log('Registration response status:', response.status);
            
            // Get the raw text response first
            const responseText = await response.text();
            console.log('Raw registration response:', responseText);
            
            // Parse the JSON
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Server returned invalid JSON. Raw response: ${responseText}`);
            }
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // On successful registration, save user data
            if (data.user) {
                saveUserData(data.user);
            }
            
            if (data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            }
            
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Log in a user
    async function login(credentials) {
        try {
            console.log('Logging in with credentials:', {...credentials, password: '***'});
            
            // Try both login endpoints with proper error handling
            let response;
            let endpoint = '/login.php';
            
            try {
                // First try the main login endpoint
                response = await fetch(`${API_URL}/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                });
            } catch (error) {
                console.log(`Error with main login endpoint: ${error.message}`);
                
                // If that fails, try the users/login.php endpoint
                endpoint = '/users/login.php';
                response = await fetch(`${API_URL}/users/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                });
            }
            
            // Log the response info for debugging
            console.log(`Login ${endpoint} response status:`, response.status);
            
            // Get the raw text response
            const responseText = await response.text();
            console.log(`Raw login ${endpoint} response:`, responseText);
            
            // Parse the JSON
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Server returned invalid JSON. Raw response: ${responseText}`);
            }
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Save user data and token
            if (data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            }
            
            if (data.user) {
                saveUserData(data.user);
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Log out the current user
    function logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
    
    // Save user data to localStorage
    function saveUserData(userData) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
    
    // Get current user data
    function getCurrentUser() {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    
    // Check if user is logged in
    function isLoggedIn() {
        return !!localStorage.getItem(USER_DATA_KEY);
    }
    
    // Get authentication token
    function getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    
    // Update user profile
    async function updateProfile(userData) {
        try {
            const user = getCurrentUser();
            const token = getToken();
            
            if (!user || !token) {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch(`${API_URL}/users/update.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: user.id_utilisateur,
                    token: token,
                    ...userData
                }),
            });
            
            // Get the raw text response
            const responseText = await response.text();
            console.log('Raw update profile response:', responseText);
            
            // Parse the JSON
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Server returned invalid JSON. Raw response: ${responseText}`);
            }
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            // Update stored user data
            if (data.user) {
                saveUserData(data.user);
            }
            
            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
    
    // Change password
    async function changePassword(passwordData) {
        try {
            const user = getCurrentUser();
            const token = getToken();
            
            if (!user || !token) {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch(`${API_URL}/users/change-password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: user.id_utilisateur,
                    token: token,
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                }),
            });
            
            // Get the response
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to change password');
            }
            
            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }
    
    // Public API
    return {
        register,
        login,
        logout,
        getCurrentUser,
        isLoggedIn,
        getToken,
        updateProfile,
        changePassword
    };
})();
