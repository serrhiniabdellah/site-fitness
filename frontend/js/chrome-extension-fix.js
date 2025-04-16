/**
 * Chrome Extension WebSocket URL Fixer
 * Ensures WebSocket URLs are properly formatted
 */
console.log('Chrome Extension WebSocket URL Fixer loaded');

// Chrome extension WebSocket fix
(function() {
    console.log('Chrome Extension WebSocket URL Fixer loaded');
    
    // Store original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Special fix for Chrome extension reload.js which uses malformed URL format
    function fixChromeExtensionWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Handle the specific problematic format in the error: 'ws127.0.0.1'
        if (url.startsWith('ws') && !url.startsWith('ws://') && !url.startsWith('wss://')) {
            // Fix URLs like ws127.0.0.1:35729/livereload
            if (url.match(/^ws[0-9]/)) {
                return 'ws://' + url.substring(2);
            }
            // Fix URLs like wss127.0.0.1:35729/livereload
            else if (url.match(/^wss[0-9]/)) {
                return 'wss://' + url.substring(3);
            }
        }
        
        return url;
    }
    
    try {
        // Replace WebSocket constructor to intercept and fix URLs
        window.WebSocket = function(url, protocols) {
            try {
                const fixedUrl = fixChromeExtensionWebSocketUrl(url);
                
                if (fixedUrl !== url) {
                    console.log(`Fixed Chrome extension WebSocket URL: ${url} → ${fixedUrl}`);
                }
                
                return new OriginalWebSocket(fixedUrl, protocols);
            } catch (error) {
                console.error('Error creating WebSocket with fixed URL:', error);
                
                // If our fix didn't work, try original URL as fallback
                if (fixedUrl !== url) {
                    console.log('Trying original URL as fallback');
                    return new OriginalWebSocket(url, protocols);
                }
                
                throw error;
            }
        };
        
        // Copy prototype and static properties
        window.WebSocket.prototype = OriginalWebSocket.prototype;
        window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
        window.WebSocket.OPEN = OriginalWebSocket.OPEN;
        window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
        window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
        
        console.log('WebSocket constructor successfully patched for Chrome extensions');
    } catch (error) {
        console.error('Failed to patch WebSocket for Chrome extensions:', error);
    }
})();
