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
        
        // Handle specific problematic patterns seen in error logs
        if (url === 'ws127.0.0.1:35729/livereload') {
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // Fix all common URL format issues
        if (url.match(/^ws[0-9]/)) {
            // If URL starts with 'ws' followed by a number (like ws127.0.0.1)
            return url.replace(/^ws/, 'ws://');
        } else if (url.match(/^wss[0-9]/)) {
            // If URL starts with 'wss' followed by a number (like wss127.0.0.1)
            return url.replace(/^wss/, 'wss://');
        } else if (url.startsWith('ws') && !url.includes('://')) {
            // Any URL starting with ws but missing ://
            return 'ws://' + url.substring(2);
        } else if (url.startsWith('wss') && !url.includes('://')) {
            // Any URL starting with wss but missing ://
            return 'wss://' + url.substring(3);
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
            
            // Try one more time with a different fix if this is a specific Chrome extension issue
            if (error.message && error.message.includes("scheme must be")) {
                const lastResortUrl = 'ws://127.0.0.1:35729/livereload';
                console.log(`Attempting last resort connection to ${lastResortUrl}`);
                try {
                    return new OriginalWebSocket(lastResortUrl, protocols);
                } catch (innerError) {
                    console.error("Final attempt failed:", innerError);
                }
            }
            
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
    
    // Also listen for WebSocket errors in the global scope
    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('WebSocket') && e.message.includes('scheme')) {
            console.log('Caught WebSocket URL error:', e.message);
            // Don't prevent default to allow other handlers to run
        }
    });
})();
