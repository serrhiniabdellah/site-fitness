/**
 * Chrome Extension LiveReload WebSocket Fix v2.0
 * This script specifically targets and fixes the malformed WebSocket URL issue
 * that occurs with certain Chrome extensions attempting to create WebSocket connections
 */
(function() {
    console.log('[Chrome Extension Fix] Initializing WebSocket URL fixer for Chrome extensions');
    
    // Store the original WebSocket constructor if it hasn't been patched already
    if (!window.__originalWebSocketForChromeExtension) {
        window.__originalWebSocketForChromeExtension = window.WebSocket;
    }
    
    // Exit if already patched by this specific script
    if (window.__chromeExtensionWebSocketFixed) {
        console.log('[Chrome Extension Fix] WebSocket already patched for Chrome extensions');
        return;
    }
    
    // Mark as patched
    window.__chromeExtensionWebSocketFixed = true;
    
    /**
     * Fix the common Chrome extension LiveReload WebSocket URL issue
     * @param {string} url - The WebSocket URL to fix
     * @return {string} - The fixed WebSocket URL
     */
    function fixChromeExtensionWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        const originalUrl = url;
        let fixedUrl = url;
        
        // Handle the specific Chrome extension LiveReload issue
        if (url === 'ws127.0.0.1:35729/livereload' || 
            url === 'ws127.0.0.1:35729' ||
            url === 'ws:127.0.0.1:35729/livereload' ||
            url === 'ws127.0.0.1') {
            fixedUrl = 'ws://127.0.0.1:35729/livereload';
            console.log(`[Chrome Extension Fix] Fixed LiveReload URL: ${originalUrl} → ${fixedUrl}`);
            return fixedUrl;
        }
        
        // Only fix if URL is not already properly formatted
        if (!url.includes('://')) {
            // Fix ws127.0.0.1 format (most common issue)
            if (url.match(/^ws[0-9]/)) {
                fixedUrl = 'ws://' + url.substring(2);
            }
            // Fix wss127.0.0.1 format
            else if (url.match(/^wss[0-9]/)) {
                fixedUrl = 'wss://' + url.substring(3);
            }
            // Fix ws:hostname (missing //)
            else if (url.match(/^ws:[^/]/)) {
                fixedUrl = 'ws://' + url.substring(3);
            }
            // Fix wss:hostname (missing //)
            else if (url.match(/^wss:[^/]/)) {
                fixedUrl = 'wss://' + url.substring(4);
            }
            
            if (fixedUrl !== originalUrl) {
                console.log(`[Chrome Extension Fix] Fixed WebSocket URL: ${originalUrl} → ${fixedUrl}`);
            }
        }
        
        return fixedUrl;
    }
    
    // Replace the WebSocket constructor with our fixed version
    window.WebSocket = function(url, protocols) {
        // Fix the URL before creating the WebSocket
        const fixedUrl = fixChromeExtensionWebSocketUrl(url);
        
        // Use the original WebSocket constructor
        return new window.__originalWebSocketForChromeExtension(fixedUrl, protocols);
    };
    
    // Copy prototype and constants from original WebSocket
    window.WebSocket.prototype = window.__originalWebSocketForChromeExtension.prototype;
    window.WebSocket.CONNECTING = window.__originalWebSocketForChromeExtension.CONNECTING;
    window.WebSocket.OPEN = window.__originalWebSocketForChromeExtension.OPEN;
    window.WebSocket.CLOSING = window.__originalWebSocketForChromeExtension.CLOSING;
    window.WebSocket.CLOSED = window.__originalWebSocketForChromeExtension.CLOSED;
    
    // Also catch global errors related to WebSocket
    window.addEventListener('error', function(event) {
        if (event.message && 
            event.message.includes("WebSocket") && 
            (event.message.includes("scheme must be") || event.message.includes("is not allowed"))) {
            
            // Extract the bad URL from the error message
            const urlMatch = event.message.match(/['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
                const badUrl = urlMatch[1];
                const fixedUrl = fixChromeExtensionWebSocketUrl(badUrl);
                
                if (fixedUrl !== badUrl) {
                    console.log(`[Chrome Extension Fix] Caught WebSocket error with URL: ${badUrl}`);
                    console.log(`[Chrome Extension Fix] Attempting recovery with fixed URL: ${fixedUrl}`);
                    
                    // Try to create a WebSocket with the fixed URL
                    try {
                        const socket = new window.__originalWebSocketForChromeExtension(fixedUrl);
                        console.log('[Chrome Extension Fix] Successfully recovered WebSocket connection');
                        return true; // Prevent default error handling
                    } catch (e) {
                        console.error('[Chrome Extension Fix] Recovery attempt failed:', e);
                    }
                }
            }
        }
    }, true);
    
    console.log('[Chrome Extension Fix] WebSocket URL fixer installed for Chrome extensions');
})();