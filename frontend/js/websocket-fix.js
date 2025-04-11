/**
 * Improved WebSocket URL Fix
 * Fixes malformed WebSocket URLs by ensuring the proper format
 * Silently patches without console logs
 */

(function() {
    'use strict';
    
    // Original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Patch WebSocket constructor
    window.WebSocket = function(url, protocols) {
        // Fix common URL issues
        if (url) {
            // Fix missing colon after scheme
            if (url.startsWith('ws127.') || url.startsWith('wss127.')) {
                url = url.replace(/^ws(s?)127\./, 'ws$1://127.');
            }
            
            // Fix other common errors
            if (url.startsWith('ws') && !url.startsWith('ws:') && !url.startsWith('wss:')) {
                if (url.includes('://')) {
                    // URL has malformed scheme
                    url = 'ws://' + url.substring(url.indexOf('://') + 3);
                } else {
                    // URL is missing scheme separator
                    url = url.replace(/^ws(?!s)/, 'ws://');
                    url = url.replace(/^wss(?!\:)/, 'wss://');
                }
            }
        }
        
        // Create new WebSocket with fixed URL
        return new OriginalWebSocket(url, protocols);
    };
    
    // Preserve prototype chain
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
})();