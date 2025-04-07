// Global configuration for FitZone application
// Using window.CONFIG to prevent redeclaration errors
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
        API_URL: 'http://localhost/site_fitness/backend/api',
        UPLOAD_URL: 'http://localhost/site_fitness/backend/uploads',
        DEBUG_MODE: true,
        DEFAULT_ERROR_MESSAGE: 'Something went wrong. Please try again later.',
        CURRENCY: '€',
        
        // Auth settings
        AUTH_TOKEN_KEY: 'fitzone_token',
        USER_DATA_KEY: 'fitzone_user',
        
        // WebSocket settings - explicitly formatted with protocol
        WS_URL: 'ws://127.0.0.1:8080',
        LIVERELOAD_URL: 'ws://127.0.0.1:35729/livereload',
        
        // Cart settings
        CART_KEY: 'fitzone_cart',
        
        // Login settings
        REDIRECT_DELAY: 1000,  // Wait 1 second before redirecting after login
        LOGIN_EXPIRES: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };
    
    // Prevent accidental overwriting
    Object.freeze(window.CONFIG);
    
    console.log('CONFIG initialized');
}

// For backward compatibility with existing code using API_BASE_URL
// Only define if it doesn't already exist
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = window.CONFIG.API_URL;
}

// Helper for logging in debug mode only
if (typeof CONFIG.log === 'undefined') {
    CONFIG.log = function(...args) {
        if (CONFIG.DEBUG_MODE) {
            console.log(...args);
        }
    };
}

// Function to make standardized API calls
async function makeApiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // For cookies/sessions if needed
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`);
        
        // Handle OPTIONS preflight for CORS
        if (method !== 'GET' && method !== 'HEAD') {
            // First check if the API is reachable with a ping
            try {
                const pingResponse = await fetch(`${API_BASE_URL}/ping.php`);
                if (!pingResponse.ok) {
                    console.warn('API ping failed, proceeding with request anyway');
                }
            } catch (pingError) {
                console.warn('API ping error:', pingError);
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Get the text response first to handle empty responses
        const responseText = await response.text();
        
        // If response is empty, return a standard format
        if (!responseText) {
            console.error('Empty response from server');
            return { success: false, message: 'Server returned an empty response' };
        }
        
        // Parse JSON
        try {
            const jsonData = JSON.parse(responseText);
            return jsonData;
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Response was:', responseText);
            throw new Error(`Invalid JSON response: ${responseText}`);
        }
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Initialize WebSocket connection with proper URL format
function initWebSocket() {
    try {
        // Use proper URL with protocol already included
        const wsUrl = CONFIG.WS_URL;
        
        console.log('Initializing WebSocket connection to:', wsUrl);
        
        if (!wsUrl) return null;
        
        // Use our helper if available, otherwise native WebSocket
        if (window.FitZoneWebSocket) {
            return window.FitZoneWebSocket.connect(wsUrl);
        } else {
            return new WebSocket(wsUrl);
        }
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
        return null;
    }
}

// Only initialize WebSocket if it's being used
// const socket = initWebSocket();