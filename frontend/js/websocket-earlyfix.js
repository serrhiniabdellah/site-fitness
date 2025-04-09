/**
 * WebSocket Early Fix
 * This script runs before any other scripts to patch the WebSocket constructor
 * It fixes URL formatting issues before Chrome extensions can access WebSocket
 */
(function() {
    'use strict';
    console.log('[WebSocket-EarlyFix] Installing WebSocket constructor patch');
    
    // Don't patch if already patched
    if (window.__webSocketEarlyFixInstalled || window.__websocketPatched) {
        console.log('[WebSocket-EarlyFix] WebSocket already patched, skipping');
        return;
    }
    
    // Keep reference to the original WebSocket constructor
    window.__originalWebSocket = window.WebSocket;
    
    /**
     * Fix WebSocket URLs with bad formatting
     * Specifically targets the issue with Chrome extensions
     * @param {string} url - The URL to fix
     * @return {string} - The fixed URL
     */
    window.fixWebSocketUrl = function(url) {
        if (typeof url !== 'string') return url;
        
        // Log the original URL for debugging
        const originalUrl = url;
        
        // Handle the specific error case with Chrome extensions
        if (url === 'ws127.0.0.1:35729/livereload') {
            url = 'ws://127.0.0.1:35729/livereload';
        }
        
        // Already correctly formatted
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }
        
        // Fix URLs like ws127.0.0.1:port
        if (/^ws[0-9]/.test(url)) {
            url = 'ws://' + url.substring(2);
        }
        // Fix URLs like wss127.0.0.1:port
        else if (/^wss[0-9]/.test(url)) {
            url = 'wss://' + url.substring(3);
        }
        // Fix URLs like ws:127.0.0.1 (missing //)
        else if (url.startsWith('ws:') && !url.includes('://')) {
            url = 'ws://' + url.substring(3);
        }
        // Fix URLs like wss:127.0.0.1 (missing //)
        else if (url.startsWith('wss:') && !url.includes('://')) {
            url = 'wss://' + url.substring(4);
        }
        
        // Log if URL was changed
        if (url !== originalUrl) {
            console.log(`[WebSocket-EarlyFix] Fixed URL: "${originalUrl}" → "${url}"`);
        }
        
        return url;
    };
    
    // Override the WebSocket constructor
    window.WebSocket = function(url, protocols) {
        // Fix the URL
        const fixedUrl = window.fixWebSocketUrl(url);
        
        // Create WebSocket with fixed URL
        return new window.__originalWebSocket(fixedUrl, protocols);
    };
    
    // Copy prototype properties
    window.WebSocket.prototype = window.__originalWebSocket.prototype;
    
    // Copy static properties
    window.WebSocket.CONNECTING = window.__originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = window.__originalWebSocket.OPEN;
    window.WebSocket.CLOSING = window.__originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = window.__originalWebSocket.CLOSED;
    
    // Set mark that early fix is installed
    window.__webSocketEarlyFixInstalled = true;
    
    console.log('[WebSocket-EarlyFix] WebSocket constructor successfully patched');
})();