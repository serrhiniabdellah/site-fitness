/**
 * CORS Proxy for API requests
 * Helps with local development when CORS headers aren't properly set on the backend
 */

(function() {
    // Log initialization for debugging
    console.log('[CORS Proxy] Initializing enhanced CORS proxy handler');
    
    const originalFetch = window.fetch;
    
    // CORS proxy URLs (multiple options for fallback)
    const CORS_PROXIES = [
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ];
    
    // Track failed URLs to avoid infinite retry loops
    const failedUrls = new Set();
    
    // Check if we're in Docker environment
    const IS_DOCKER = window.location.port === '80' || window.location.port === '';
    
    // Fixed API base URLs - update these to match your htdocs deployment
    const API_BASE_URL = IS_DOCKER ? '/api' : 'http://localhost/site_fitness/backend/api';
    const FALLBACK_API_URL = IS_DOCKER ? '/api' : 'http://127.0.0.1/site_fitness/backend/api';
    
    // Override fetch to handle CORS
    window.fetch = async function(url, options = {}) {
        // Clone options to avoid modifying the original
        const originalOptions = {...options};
        let modifiedOptions = {...options};
        
        // Format URL properly
        const isString = typeof url === 'string';
        const urlString = isString ? url : url.url;
        
        // Skip if this URL already failed with our handling
        if (failedUrls.has(urlString)) {
            console.log('[CORS Proxy] Skipping previously failed URL:', urlString);
            return originalFetch(url, originalOptions);
        }
        
        try {
            // Only intercept API calls, not all fetch requests
            if (urlString.includes('/api/') || urlString.includes('/site_fitness/backend/')) {
                console.log('[CORS Proxy] Intercepting API request:', urlString);
                
                // In Docker environment, don't proxy requests, just use direct paths
                if (IS_DOCKER && urlString.startsWith('/api/')) {
                    console.log('[CORS Proxy] Docker environment detected, using direct API path:', urlString);
                    return originalFetch(urlString, originalOptions);
                }
                
                // Prepare headers
                if (!modifiedOptions.headers) {
                    modifiedOptions.headers = {};
                }
                
                // Convert Headers object to plain object if needed
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
                
                // Set crucial CORS headers that help preflight requests succeed
                modifiedOptions.mode = 'cors';
                modifiedOptions.credentials = 'include';
                modifiedOptions.headers['Origin'] = window.location.origin;
                
                // Optional: Add timestamp to bust cache for GET requests
                if (modifiedOptions.method === undefined || modifiedOptions.method === 'GET') {
                    const separator = urlString.includes('?') ? '&' : '?';
                    const timestampedUrl = `${urlString}${separator}_t=${Date.now()}`;
                    
                    // Use the timestamped URL
                    console.log('[CORS Proxy] Using timestamped URL:', timestampedUrl);
                    
                    // Try direct connection with timestamped URL
                    try {
                        const response = await originalFetch(timestampedUrl, modifiedOptions);
                        if (response.ok) return response;
                    } catch (e) {
                        console.log('[CORS Proxy] Direct request with timestamp failed:', e);
                    }
                }
                
                // Fix URLs to point to our apache backend when needed
                let targetUrl = urlString;
                
                // If URL appears to be a relative API path, convert it to absolute with proper domain
                if (urlString.startsWith('/api/')) {
                    targetUrl = API_BASE_URL + urlString.substring(4);
                    console.log('[CORS Proxy] Converting relative API path to:', targetUrl);
                }
                
                // Define multiple connection strategies
                const connectionStrategies = [
                    // Strategy 1: Direct connection to original URL
                    async () => {
                        console.log('[CORS Proxy] Strategy 1: Direct connection');
                        const response = await originalFetch(targetUrl, modifiedOptions);
                        console.log('[CORS Proxy] Direct connection succeeded');
                        return response;
                    },
                    
                    // Strategy 2: Try with alternative hostname (localhost ↔ 127.0.0.1)
                    async () => {
                        let altUrl = targetUrl;
                        if (targetUrl.includes('localhost')) {
                            altUrl = targetUrl.replace('localhost', '127.0.0.1');
                        } else if (targetUrl.includes('127.0.0.1')) {
                            altUrl = targetUrl.replace('127.0.0.1', 'localhost');
                        }
                        
                        if (altUrl !== targetUrl) {
                            console.log('[CORS Proxy] Strategy 2: Using alternative URL:', altUrl);
                            const response = await originalFetch(altUrl, modifiedOptions);
                            console.log('[CORS Proxy] Alternative URL succeeded');
                            return response;
                        }
                        throw new Error('No alternative URL available');
                    },
                    
                    // Strategy 3: Use external CORS proxies
                    async () => {
                        for (const proxy of CORS_PROXIES) {
                            const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
                            console.log('[CORS Proxy] Strategy 3: Using external proxy:', proxy);
                            
                            // When using a proxy, remove mode and modify other options
                            const proxyOptions = {...modifiedOptions};
                            delete proxyOptions.mode;
                            delete proxyOptions.credentials;
                            
                            const response = await originalFetch(proxyUrl, proxyOptions);
                            console.log('[CORS Proxy] External proxy succeeded');
                            return response;
                        }
                        throw new Error('All proxies failed');
                    },
                    
                    // Strategy 4: Use OPTIONS preflight then actual request
                    async () => {
                        // For non-GET requests, try sending an OPTIONS preflight first
                        if (modifiedOptions.method !== 'GET') {
                            console.log('[CORS Proxy] Strategy 4: Manual preflight');
                            // Send OPTIONS request manually
                            await originalFetch(targetUrl, {
                                method: 'OPTIONS',
                                headers: {
                                    'Origin': window.location.origin,
                                    'Access-Control-Request-Method': modifiedOptions.method,
                                    'Access-Control-Request-Headers': 'Content-Type, Authorization'
                                },
                                mode: 'cors',
                                credentials: 'include'
                            });
                            
                            // Now send the actual request
                            const response = await originalFetch(targetUrl, modifiedOptions);
                            console.log('[CORS Proxy] Manual preflight succeeded');
                            return response;
                        }
                        throw new Error('Manual preflight only applicable for non-GET requests');
                    },
                    
                    // Strategy 5: Use the fallback API URL directly
                    async () => {
                        if (targetUrl.includes(API_BASE_URL)) {
                            const fallbackUrl = targetUrl.replace(API_BASE_URL, FALLBACK_API_URL);
                            console.log('[CORS Proxy] Strategy 5: Using fallback API URL:', fallbackUrl);
                            const response = await originalFetch(fallbackUrl, modifiedOptions);
                            console.log('[CORS Proxy] Fallback API URL succeeded');
                            return response;
                        }
                        throw new Error('URL does not match API base URL pattern');
                    }
                ];
                
                // Try each strategy in sequence until one succeeds
                for (const strategy of connectionStrategies) {
                    try {
                        const response = await strategy();
                        if (response) {
                            return response;
                        }
                    } catch (error) {
                        console.log(`[CORS Proxy] Strategy failed: ${error.message}`);
                        // Continue to next strategy
                    }
                }
                
                // If all strategies failed, mark this URL
                failedUrls.add(urlString);
                throw new Error(`All CORS strategies failed for ${urlString}`);
            }
            
            // For non-API requests, use original fetch
            return originalFetch(url, originalOptions);
            
        } catch (error) {
            console.error('[CORS Proxy] All strategies failed:', error);
            throw error;
        }
    };
    
    console.log('[CORS Proxy] Enhanced CORS handler initialized and active');
})();
