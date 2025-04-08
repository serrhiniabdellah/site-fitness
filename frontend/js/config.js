/**
 * Application Configuration v1.1
 * Central configuration for the FitZone application
 */

// Determine environment
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEBUG_MODE = IS_DEV;

// API configuration
const CONFIG = {
    // API Base URL - updated to use absolute URL for backend
    API_URL: IS_DEV ? 'http://localhost/site_fitness/backend/api' : 'https://yoursite.com/api',
    
    // WebSocket URL
    WS_URL: IS_DEV ? 'ws://localhost:8080' : 'wss://yoursite.com/ws',
    
    // Debug mode toggle
    DEBUG_MODE: DEBUG_MODE,
    
    // Authentication settings
    LOGIN_EXPIRES: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Product pagination
    PRODUCTS_PER_PAGE: 8,

    // Site URL
    SITE_URL: 'http://127.0.0.1:5500/frontend',
    
    // Feature flags
    FEATURES: {
        ENABLE_WISHLIST: true,
        ENABLE_REVIEWS: true,
        ENABLE_CART_MERGE: true
    },
    
    // Cart configuration
    CART: {
        SAVE_IN_LOCALSTORAGE: true,
        SYNC_WITH_SERVER: true
    },
    
    // Session timeout (in minutes)
    SESSION_TIMEOUT: 120
};

console.log('CONFIG initialized');

// Function to make standardized API calls
async function makeApiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Help with CORS
            },
            credentials: 'include' // Include cookies with requests
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        // Add auth token if available
        const token = localStorage.getItem('fitzone_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Build full URL using CONFIG.API_URL - ensure it's absolute
        const apiUrl = CONFIG.API_URL;
        const fullUrl = endpoint.startsWith('/') ? `${apiUrl}${endpoint}` : `${apiUrl}/${endpoint}`;
        
        console.log(`Making ${method} request to ${fullUrl}`);
        
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

/**
 * FitZone Configuration
 * Global configuration settings for the application
 */

// Check if CONFIG is already defined to prevent duplicate declarations
if (typeof CONFIG === 'undefined') {
    const CONFIG = {
        // API URL - change this to your actual API endpoint
        API_URL: 'http://localhost/site_fitness/backend/api',
        
        // Authentication settings
        AUTH: {
            TOKEN_STORAGE_KEY: 'fitzone_token',
            USER_STORAGE_KEY: 'fitzone_user',
            TOKEN_EXPIRY_DAYS: 7
        },
        
        // Cart settings
        CART: {
            STORAGE_KEY: 'fitzone_cart',
            SESSION_ID_KEY: 'fitzone_cart_session'
        },
        
        // Debug settings
        DEBUG: true,
        
        // Environment
        ENV: 'development'
    };

    // Debug log if in development mode
    if (CONFIG.DEBUG) {
        console.log('CONFIG initialized');
    }

    // Make CONFIG available globally
    window.CONFIG = CONFIG;
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CONFIG;
}

// Development indicator
// Use this without re-declaring if already set
if (typeof IS_DEV === 'undefined') {
    const IS_DEV = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
    
    if (IS_DEV) {
        console.log('Running in development mode');
    }
}