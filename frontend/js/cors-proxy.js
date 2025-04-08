/**
 * CORS Proxy for API requests
 * Helps with local development when CORS headers aren't properly set on the backend
 */

(function() {
    const originalFetch = window.fetch;
    
    // CORS proxy URL
    const CORS_PROXY = 'https://corsproxy.io/?';
    
    // Allowed domains that will bypass the CORS proxy
    const ALLOWED_DOMAINS = [
        '127.0.0.1',
        'localhost'
    ];
    
    // Check if URL should use CORS proxy
    function shouldUseProxy(url) {
        try {
            const urlObj = new URL(url);
            return !ALLOWED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
        } catch (e) {
            return false;
        }
    }
    
    // Override fetch to handle CORS
    window.fetch = async function(url, options = {}) {
        const originalOptions = {...options};
        let modifiedOptions = {...options};
        
        try {
            // Format URL properly
            const isString = typeof url === 'string';
            const urlString = isString ? url : url.url;
            
            // For API requests, add Authorization header if available
            if (urlString.includes('/api/')) {
                // Add headers if not exists
                if (!modifiedOptions.headers) {
                    modifiedOptions.headers = {};
                }
                
                // Convert Headers object to plain object
                if (modifiedOptions.headers instanceof Headers) {
                    const plainHeaders = {};
                    for (const [key, value] of modifiedOptions.headers.entries()) {
                        plainHeaders[key] = value;
                    }
                    modifiedOptions.headers = plainHeaders;
                }
                
                // Add Authorization header for API requests if token exists
                const token = localStorage.getItem('fitzone_token');
                if (token && !modifiedOptions.headers.Authorization) {
                    modifiedOptions.headers.Authorization = `Bearer ${token}`;
                }
                
                // For API requests to local server
                if (urlString.includes('localhost') || urlString.includes('127.0.0.1')) {
                    console.log('[CORS] Direct connection to API:', urlString);
                    
                    // Try direct connection first
                    try {
                        return await originalFetch(urlString, modifiedOptions);
                    } catch (directError) {
                        console.error('[CORS] Direct connection error:', directError);
                        
                        // If CSP allows, try CORS proxy as fallback
                        try {
                            console.log('[CORS] Trying alternate connection');
                            // Try without CORS proxy but with different options
                            modifiedOptions.mode = 'cors';
                            modifiedOptions.credentials = 'include';
                            return await originalFetch(urlString, modifiedOptions);
                        } catch (corsError) {
                            console.error('[CORS] Alternative connection failed');
                            throw directError; // Throw the original error
                        }
                    }
                }
            }
            
            // Default case, proceed with original fetch
            return await originalFetch(url, originalOptions);
            
        } catch (error) {
            console.error('[CORS] Request failed:', error);
            throw new Error(`CORS error accessing ${url}. Check the console for details.`);
        }
    };
    
    console.log('[CORS] CORS proxy initialized');
})();
