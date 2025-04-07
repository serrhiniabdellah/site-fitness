/**
 * Ajax Helper Library
 * Standardized API calls with CORS and error handling
 */
const AjaxHelper = (function() {
    /**
     * Make an API request with standardized error handling
     */
    async function apiRequest(endpoint, options = {}) {
        try {
            // Merge default options with provided options
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                mode: 'cors'
            };
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            };
            
            // Add auth token if available
            if (typeof FitZoneAuth !== 'undefined' && FitZoneAuth.isLoggedIn()) {
                mergedOptions.headers.Authorization = `Bearer ${FitZoneAuth.getToken()}`;
            }
            
            // Determine full URL
            const apiBaseUrl = CONFIG?.API_URL || '/api';
            const fullUrl = endpoint.startsWith('http') ? endpoint : `${apiBaseUrl}/${endpoint}`;
            
            console.log(`Making ${mergedOptions.method} request to ${fullUrl}`);
            
            // Send the request
            const response = await fetch(fullUrl, mergedOptions);
            
            // Handle response status
            if (!response.ok && response.status !== 404) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            // Get response text
            const responseText = await response.text();
            
            // If empty response, return empty success
            if (!responseText) {
                return { success: true, data: null };
            }
            
            // Parse JSON
            try {
                return JSON.parse(responseText);
            } catch (error) {
                console.error('Response parse error:', error);
                console.log('Raw response:', responseText);
                throw new Error('Invalid JSON response from server');
            }
        } catch (error) {
            console.error('API request failed:', error);
            
            // Return standardized error format
            return {
                success: false,
                message: error.message || 'Request failed',
                error: error
            };
        }
    }
    
    /**
     * Simple GET request helper
     */
    function get(endpoint, params = {}) {
        // Build query string
        const queryString = Object.keys(params).length > 0
            ? '?' + new URLSearchParams(params).toString()
            : '';
            
        return apiRequest(`${endpoint}${queryString}`);
    }
    
    /**
     * Simple POST request helper
     */
    function post(endpoint, data = {}) {
        return apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Simple PUT request helper
     */
    function put(endpoint, data = {}) {
        return apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * Simple DELETE request helper
     */
    function del(endpoint, params = {}) {
        // Build query string
        const queryString = Object.keys(params).length > 0
            ? '?' + new URLSearchParams(params).toString()
            : '';
            
        return apiRequest(`${endpoint}${queryString}`, {
            method: 'DELETE'
        });
    }
    
    // Return public API
    return {
        apiRequest,
        get,
        post,
        put,
        delete: del
    };
})();

// Make available globally
window.AjaxHelper = AjaxHelper;
console.log('Ajax Helper initialized');
