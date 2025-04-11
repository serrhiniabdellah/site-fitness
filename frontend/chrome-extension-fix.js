/**
 * Chrome Extension WebSocket URL Fixer
 * Ensures WebSocket URLs are properly formatted
 */
console.log('Chrome Extension WebSocket URL Fixer loaded');

(function() {
    // Store reference to the original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Override the WebSocket constructor
    window.WebSocket = function(url, protocols) {
        // Fix common WebSocket URL formatting issues
        if (url && typeof url === 'string') {
            const originalUrl = url;
            
            // Specific fixes for Chrome extension issues
            if (url === 'ws127.0.0.1:35729/livereload' || 
                url.startsWith('ws127.0.0.1')) {
                url = url.replace(/^ws(?=[0-9])/, 'ws://');
                console.log('Fixed Chrome extension WebSocket URL:', url);
            }
            
            // General fixes for any URL missing protocol separator
            if (!url.includes('://')) {
                if (url.startsWith('ws') && !url.startsWith('ws://')) {
                    url = url.replace(/^ws/, 'ws://');
                } else if (url.startsWith('wss') && !url.startsWith('wss://')) {
                    url = url.replace(/^wss/, 'wss://');
                }
            }
            
            if (url !== originalUrl) {
                console.log('WebSocket URL transformed:', originalUrl, '->', url);
            }
        }
        
        // Call the original constructor with the fixed URL
        return new OriginalWebSocket(url, protocols);
    };
    
    // Copy over original properties
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    console.log('WebSocket constructor successfully patched for Chrome extensions');
})();
