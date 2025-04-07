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
            // Fix missing colon after protocol
            if (url.startsWith('ws') && !url.startsWith('ws:') && !url.startsWith('wss:')) {
                if (url.startsWith('ws127.0.0.1')) {
                    url = url.replace('ws127.0.0.1', 'ws://127.0.0.1');
                    console.log('Fixed WebSocket URL:', url);
                } else if (url.startsWith('wslocalhost')) {
                    url = url.replace('wslocalhost', 'ws://localhost');
                    console.log('Fixed WebSocket URL:', url);
                } else {
                    // Add missing colon and slashes
                    if (url.match(/^ws[^:]/)) {
                        url = url.replace(/^ws/, 'ws://');
                        console.log('Fixed WebSocket URL format:', url);
                    } else if (url.match(/^wss[^:]/)) {
                        url = url.replace(/^wss/, 'wss://');
                        console.log('Fixed WebSocket URL format:', url);
                    }
                }
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
