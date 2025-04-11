/**
 * Application Configuration v1.4
 * Central configuration for the FitZone application
 */

// Determine environment
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEBUG_MODE = IS_DEV;

// Docker environment detection - Docker setup uses /api/ as the path
const IS_DOCKER = window.location.port === '80' || window.location.port === '';

// Global configuration for FitZone frontend
const CONFIG = {
    // API URLs with fallbacks - Docker setup uses a different URL structure
    API_URL: IS_DOCKER ? '/api' : 'http://localhost/site_fitness/backend/api', 
    API_URL_ALT: IS_DOCKER ? '/api' : 'http://127.0.0.1/site_fitness/backend/api',
    
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
        ENABLED: !IS_DOCKER, // No need for CORS proxy in Docker environment
        PROXY_URLS: [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ]
    }
};

// Initialize configuration
(function() {
    console.log('CONFIG initialized', IS_DOCKER ? '(Docker Environment)' : '(Standard Environment)');
    
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
        
        if (DEBUG_MODE) {
            console.log(`Making ${method} request to ${fullUrl}`);
        }
        
        try {
            const response = await fetch(fullUrl, options);
            
            // Handle empty responses
            const responseText = await response.text();
            if (!responseText) {
                return { success: false, message: 'Empty response from server' };
            }
            
            // Parse JSON response - with silent error handling
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                // Check if this looks like an HTML response (likely a page redirect)
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    // Silently fail for HTML responses - this is expected in some cases
                    if (DEBUG_MODE) {
                        console.warn('Received HTML response instead of JSON', { url: fullUrl });
                    }
                    return { success: false, message: 'Invalid response format (HTML)' };
                } else {
                    // Only log parse errors for non-HTML responses
                    if (DEBUG_MODE) {
                        console.warn('JSON parse error:', parseError.message);
                    }
                    throw new Error(`Invalid JSON response`);
                }
            }
        } catch (fetchError) {
            // If primary URL fails and we haven't tried alternative yet, try the alternative URL
            if (tryAlt) {
                if (DEBUG_MODE) {
                    console.log('Primary API URL failed. Trying alternative URL...');
                }
                const altApiUrl = CONFIG.API_URL_ALT;
                const altFullUrl = endpoint.startsWith('/') ? `${altApiUrl}${endpoint}` : `${altApiUrl}/${endpoint}`;
                
                if (DEBUG_MODE) {
                    console.log(`Making ${method} request to alternative URL: ${altFullUrl}`);
                }
                
                try {
                    const altResponse = await fetch(altFullUrl, options);
                    const altResponseText = await altResponse.text();
                    
                    if (!altResponseText) {
                        return { success: false, message: 'Empty response from server (alternative URL)' };
                    }
                    
                    try {
                        return JSON.parse(altResponseText);
                    } catch (parseError) {
                        // Similarly handle HTML responses silently
                        if (altResponseText.trim().startsWith('<!DOCTYPE') || altResponseText.trim().startsWith('<html')) {
                            if (DEBUG_MODE) {
                                console.warn('Alternative URL returned HTML response');
                            }
                            return { success: false, message: 'Invalid response format (HTML)' };
                        } else {
                            if (DEBUG_MODE) {
                                console.warn('JSON parse error (alt):', parseError.message);
                            }
                            throw new Error(`Invalid JSON response from alternative URL`);
                        }
                    }
                } catch (altFetchError) {
                    // Silently fail the alternative request
                    return { success: false, message: 'Failed to connect to API servers' };
                }
            } else {
                if (DEBUG_MODE) {
                    console.warn('API request failed:', fetchError.message);
                }
                throw fetchError;
            }
        }
    } catch (error) {
        if (DEBUG_MODE) {
            console.warn('API call failed:', error.message);
        }
        return { success: false, error: error.message };
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