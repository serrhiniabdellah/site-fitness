/**
 * Chrome Extension WebSocket URL Fixer v2.1
 * Fixes malformed WebSocket URLs in Chrome extensions
 */
(function() {
    console.log('Chrome Extension WebSocket URL Fixer loaded');
    
    // Skip if global WebSocket fix is already applied
    if (window.__websocketPatched) {
        console.log('Using existing WebSocket patch');
        return;
    }
    
    // Mark as patched to prevent double patching
    window.__websocketPatched = true;
    
    // Store original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    window.__originalWebSocket = OriginalWebSocket;
    
    // Create WebSocket URL fixer
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Handle specific Chrome extension problematic URL
        if (url === 'ws127.0.0.1:35729/livereload') {
            console.log('Fixed Chrome extension reload URL');
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // Fix ws + numbers pattern
        if (url.match(/^ws[0-9]/)) {
            return 'ws://' + url.substring(2);
        }
        
        // Fix wss + numbers pattern
        if (url.match(/^wss[0-9]/)) {
            return 'wss://' + url.substring(3);
        }
        
        // More general case - add protocol if missing
        if (url.startsWith('ws') && !url.includes('://')) {
            return 'ws://' + url.substring(2);
        }
        
        if (url.startsWith('wss') && !url.includes('://')) {
            return 'wss://' + url.substring(3);
        }
        
        return url;
    }
    
    // Make URL fixer available globally
    window.fixWebSocketUrl = fixWebSocketUrl;
    
    // Create new WebSocket constructor
    window.WebSocket = function(url, protocols) {
        try {
            const fixedUrl = fixWebSocketUrl(url);
            return new OriginalWebSocket(fixedUrl, protocols);
        } catch (error) {
            console.error('WebSocket connection error:', error);
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
})();
