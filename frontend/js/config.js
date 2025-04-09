/**
 * Application Configuration v1.3
 * Central configuration for the FitZone application
 */

// Determine environment
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEBUG_MODE = IS_DEV;

// Automatically detect if we're running from localhost:5500 (dev) or localhost (Apache)
const isDevEnvironment = window.location.hostname === '127.0.0.1' && window.location.port === '5500';

// Global configuration for FitZone frontend
const CONFIG = {
    // API URLs with fallbacks
    API_URL: 'http://localhost/site_fitness/backend/api',
    API_URL_ALT: 'http://127.0.0.1/site_fitness/backend/api',
    
    // Image paths
    PRODUCT_IMG_PATH: 'img/products/',
    
    // Authentication configuration
    AUTH: {
        TOKEN_STORAGE_KEY: 'fitzone_token',
        USER_STORAGE_KEY: 'fitzone_user',
        TIMESTAMP_KEY: 'fitzone_auth_timestamp',
        SESSION_TIMEOUT: 3600000 // 1 hour in milliseconds
    },
    
    // CORS proxy settings
    CORS: {
        ENABLED: true,
        PROXY_URLS: [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ]
    }
};

// Initialize configuration
(function() {
    console.log('CONFIG initialized');
    
    // Check if we need to use alternative API URL
    function checkApiAvailability() {
        fetch(CONFIG.API_URL + '/test_connection.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Primary API unreachable');
                }
                return response.json();
            })
            .then(data => {
                console.log('Primary API available:', data);
            })
            .catch(err => {
                console.warn('Primary API URL failed, switching to alternative URL');
                // Swap the URLs
                const temp = CONFIG.API_URL;
                CONFIG.API_URL = CONFIG.API_URL_ALT;
                CONFIG.API_URL_ALT = temp;
                
                // Try the alternative URL
                fetch(CONFIG.API_URL + '/test_connection.php')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Alternative API also unreachable');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Alternative API available:', data);
                    })
                    .catch(altErr => {
                        console.error('Both API URLs failed:', altErr);
                    });
            });
    }
    
    // Optional: Check API availability on startup
    // checkApiAvailability();
})();

// Function to make standardized API calls with fallback to alternative URL
async function makeApiCall(endpoint, method = 'GET', data = null, tryAlt = true) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            },
            credentials: 'include', // Include cookies with requests
            mode: 'cors' // Explicitly request CORS mode
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        // Add auth token if available
        const token = localStorage.getItem(CONFIG.AUTH.TOKEN_STORAGE_KEY);
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Build full URL using CONFIG.API_URL - ensure it's absolute
        const apiUrl = CONFIG.API_URL;
        const fullUrl = endpoint.startsWith('/') ? `${apiUrl}${endpoint}` : `${apiUrl}/${endpoint}`;
        
        console.log(`Making ${method} request to ${fullUrl}`);
        
        try {
            const response = await fetch(fullUrl, options);
            
            // Handle empty responses
            const responseText = await response.text();
            if (!responseText) {
                return { success: false, message: 'Empty response from server' };
            }
            
            // Parse JSON response
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Response text:', responseText.substring(0, 100) + '...');
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }
        } catch (fetchError) {
            // If primary URL fails and we haven't tried alternative yet, try the alternative URL
            if (tryAlt) {
                console.log('Primary API URL failed. Trying alternative URL...');
                const altApiUrl = CONFIG.API_URL_ALT;
                const altFullUrl = endpoint.startsWith('/') ? `${altApiUrl}${endpoint}` : `${altApiUrl}/${endpoint}`;
                
                console.log(`Making ${method} request to alternative URL: ${altFullUrl}`);
                
                const altResponse = await fetch(altFullUrl, options);
                const altResponseText = await altResponse.text();
                
                if (!altResponseText) {
                    return { success: false, message: 'Empty response from server (alternative URL)' };
                }
                
                try {
                    return JSON.parse(altResponseText);
                } catch (parseError) {
                    console.error('JSON parse error (alt):', parseError);
                    throw new Error(`Invalid JSON response from alternative URL: ${altResponseText.substring(0, 100)}...`);
                }
            } else {
                throw fetchError;
            }
        }
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Export functionality for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        makeApiCall
    };
}

// Make CONFIG available globally
window.CONFIG = CONFIG;