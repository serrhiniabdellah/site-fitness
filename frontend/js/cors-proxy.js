/**
 * CORS Proxy for Development v1.1
 * Handles CORS issues when using different origins for frontend and backend
 */
(function() {
    console.log('CORS proxy initialized');
    
    // Only activate in development mode
    if (!window.location.hostname.includes('127.0.0.1') && !window.location.hostname.includes('localhost')) {
        console.log('Not in development mode, CORS proxy disabled');
        return;
    }
    
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Override fetch to add CORS handling for API requests
    window.fetch = async function(resource, options = {}) {
        let url = resource;
        
        // Convert Request objects to URL strings
        if (resource instanceof Request) {
            url = resource.url;
            options = {
                method: resource.method,
                headers: resource.headers,
                // ...other properties from Request
                ...options
            };
        }
        
        // Check if this is an API request to the backend
        if (typeof url === 'string' && url.includes('/site_fitness/backend/api')) {
            console.log('Intercepting API request with CORS proxy:', url);
            
            // Add CORS headers
            const newOptions = {
                ...options,
                headers: {
                    ...options.headers || {},
                    'Origin': window.location.origin,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
                credentials: 'include'
            };
            
            try {
                // Try the original request with modified options
                return await originalFetch(url, newOptions);
            } catch (error) {
                console.warn('CORS request failed, trying alternative approach:', error);
                
                // If original request fails with CORS error, try a fallback approach
                if (error.message.includes('CORS') || error.name === 'TypeError') {
                    // For development only - display detailed error
                    console.error('CORS Error Details:', { 
                        url, 
                        originalOptions: options,
                        modifiedOptions: newOptions,
                        error
                    });
                    
                    // Show user-friendly message in console
                    console.info('%c💡 CORS Issue Detected', 'font-size: 14px; font-weight: bold; color: orange;');
                    console.info('%cTo fix this issue:', 'font-weight: bold;');
                    console.info('1. Ensure your backend has proper CORS headers');
                    console.info('2. Try serving frontend and backend from the same origin');
                    console.info('3. Use a CORS proxy in development');
                    
                    // Rethrow the error with a more helpful message
                    throw new Error(`CORS error accessing ${url}. Check the console for details.`);
                }
                
                // If it's not a CORS error, rethrow the original error
                throw error;
            }
        }
        
        // For non-API requests, use the original fetch
        return originalFetch(resource, options);
    };
})();
