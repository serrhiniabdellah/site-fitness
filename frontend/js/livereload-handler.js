/**
 * LiveReload WebSocket error handler
 * This script intercepts and handles LiveReload WebSocket connection errors
 * and fixes URL format issues
 */
(function() {
    // Only run in development mode
    if (!window.CONFIG || !window.CONFIG.DEBUG_MODE) return;
    
    console.log("LiveReload handler initialized");
    
    // Store original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Function to fix WebSocket URLs with formatting issues
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Fix all common URL format issues
        if (url.match(/^ws[0-9]/)) {
            // If URL starts with 'ws' followed by a number (like ws127.0.0.1)
            return url.replace(/^ws/, 'ws://');
        } else if (url.startsWith('ws') && !url.includes('://')) {
            // Any URL starting with ws but missing ://
            return 'ws://' + url.substring(2);
        }
        
        return url;
    }
    
    // Override WebSocket constructor to fix URL formatting
    window.WebSocket = function(url, protocols) {
        // Fix URL formatting if needed
        const fixedUrl = fixWebSocketUrl(url);
        
        if (fixedUrl !== url) {
            console.log(`Fixed WebSocket URL format: ${url} → ${fixedUrl}`);
        }
        
        // Create the WebSocket with fixed URL
        try {
            return new OriginalWebSocket(fixedUrl, protocols);
        } catch (error) {
            console.error(`WebSocket connection error with URL ${fixedUrl}:`, error);
            // Return a mock WebSocket object to prevent further errors
            return {
                url: fixedUrl,
                readyState: 3, // CLOSED
                send: function() {},
                close: function() {},
                onopen: null,
                onclose: null,
                onerror: null,
                onmessage: null,
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() { return true; }
            };
        }
    };
    
    // Copy prototype and static properties
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    Object.getOwnPropertyNames(OriginalWebSocket).forEach(prop => {
        if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
            window.WebSocket[prop] = OriginalWebSocket[prop];
        }
    });
})();
