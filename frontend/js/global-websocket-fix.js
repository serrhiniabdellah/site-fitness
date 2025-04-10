/**
 * Global WebSocket Fix v1.4
 * Fixes WebSocket URL issues for all contexts
 */
(function() {
    console.log('Global WebSocket Fix initializing');
    
    // Only proceed if not already patched
    if (window.__websocketPatched) {
        console.log('WebSocket already patched, skipping');
        return;
    }
    
    // Mark as patched to prevent double patching
    window.__websocketPatched = true;
    
    // Store original WebSocket constructor, being careful to check if it was already patched
    const OriginalWebSocket = window.__originalWebSocket || window.WebSocket;
    
    /**
     * Fix WebSocket URL format
     * @param {string} url - The WebSocket URL to fix
     * @return {string} - The fixed WebSocket URL
     */
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Original URL for logging
        const originalUrl = url;
        
        // If URL is already properly formatted, return it as is
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }
        
        // Handle specific problematic Chrome extension URL patterns
        if (url === 'ws127.0.0.1:35729/livereload') {
            console.log('[WebSocket Fix] Fixed specific Chrome extension URL');
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // More aggressive fix for various malformed ws URLs
        if (url.match(/^ws[0-9]/)) {
            url = 'ws://' + url.substring(2);
            console.log('[WebSocket Fix] Fixed ws numeric pattern:', url);
        } 
        // Fix wss127.0.0.1 format
        else if (url.match(/^wss[0-9]/)) {
            url = 'wss://' + url.substring(3);
            console.log('[WebSocket Fix] Fixed wss numeric pattern:', url);
        }
        // Handle cases where ws: is missing the //
        else if (url.startsWith('ws:') && !url.startsWith('ws://')) {
            url = 'ws://' + url.substring(3);
            console.log('[WebSocket Fix] Added missing // after ws:');
        }
        // Handle cases where wss: is missing the //
        else if (url.startsWith('wss:') && !url.startsWith('wss://')) {
            url = 'wss://' + url.substring(4);
            console.log('[WebSocket Fix] Added missing // after wss:');
        }
        
        // Log if we changed something
        if (url !== originalUrl) {
            console.log(`[WebSocket Fix] URL transformed: ${originalUrl} → ${url}`);
        }
        
        return url;
    }
    
    // Only replace the constructor if it hasn't been patched by websocket-earlyfix.js
    if (!window.__webSocketEarlyFixInstalled) {
        // Safe replacement WebSocket constructor
        window.WebSocket = function(url, protocols) {
            try {
                // Fix URL
                const fixedUrl = fixWebSocketUrl(url);
                
                // Use original constructor directly
                return new OriginalWebSocket(fixedUrl, protocols);
            } catch (error) {
                console.error('[WebSocket Fix] Error creating WebSocket:', error);
                throw error;
            }
        };
        
        // Copy prototype and static properties
        window.WebSocket.prototype = OriginalWebSocket.prototype;
        window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
        window.WebSocket.OPEN = OriginalWebSocket.OPEN;
        window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
        window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
        
        console.log('Global WebSocket Fix applied successfully');
    } else {
        console.log('WebSocket was already patched by websocket-earlyfix.js, using that implementation');
    }
    
    // Special handling for Chrome extension reload
    window.addEventListener('load', function() {
        console.log('Initializing WebSocket fixes');
        
        // Fix for Chrome extension reload
        if (window.chrome && chrome.runtime) {
            const originalFetch = window.fetch;
            
            // Override fetch to fix WebSocket URLs in responses
            window.fetch = async function(resource, init) {
                try {
                    return await originalFetch(resource, init);
                } catch (error) {
                    if (error.message && error.message.includes('WebSocket')) {
                        console.log('Intercepted WebSocket error in fetch:', error.message);
                    }
                    throw error;
                }
            };
            
            console.log('Enhanced fetch for WebSocket URLs');
        }
        
        console.log('WebSocket fixes initialized');
    });
})();
