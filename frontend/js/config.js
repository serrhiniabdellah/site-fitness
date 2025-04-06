/**
 * Global configuration
 */
const CONFIG = {
    // Main API URL (adjust based on your PHP server)
    API_URL: 'http://127.0.0.1:5500/backend/api',
    UPLOAD_URL: 'http://127.0.0.1:5500/uploads',
    DEFAULT_ERROR_MESSAGE: 'An error occurred. Please try again.',
    // Fixed WebSocket URL with proper scheme
    WEBSOCKET_URL: 'ws://127.0.0.1:5500'
};

// Export for consistency
const API_BASE_URL = CONFIG.API_URL;

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
        // Proper WebSocket URL format with ws:// scheme
        const wsUrl = CONFIG.WEBSOCKET_URL;
        console.log('Initializing WebSocket connection to:', wsUrl);
        
        // Return without connecting if not using WebSockets
        if (!wsUrl) return null;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            console.log('WebSocket connection established');
        };
        
        socket.onclose = function() {
            console.log('WebSocket connection closed');
        };
        
        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
        
        return socket;
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
        return null;
    }
}

// Only initialize WebSocket if it's being used
// const socket = initWebSocket();