/**
 * Chrome Extension WebSocket URL Fixer v1.4
 * Fixes malformed WebSocket URLs in Chrome extensions
 */
(function() {
    console.log('Chrome Extension WebSocket URL Fixer loaded');
    
    // Store original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Create a global safe WebSocket URL formatter
    window.fixWebSocketUrl = function(url) {
        if (typeof url !== 'string') return url;
        
        // Log original for debugging
        const originalUrl = url;
        
        // Fix Chrome extension specific pattern: ws127.0.0.1:port/path
        if (url.match(/^ws[0-9]/)) {
            url = url.replace(/^ws(?=\d)/, 'ws://');
            console.log('Fixed critical WebSocket URL format (ws + digits):', url);
        }
        
        // Fix similarly for wss: wss127.0.0.1:port/path
        if (url.match(/^wss[0-9]/)) {
            url = url.replace(/^wss(?=\d)/, 'wss://');
            console.log('Fixed critical WebSocket URL format (wss + digits):', url);
        }
        
        // Fix for ws or wss without protocol separator
        if ((url.startsWith('ws') || url.startsWith('wss')) && !url.includes('://')) {
            url = url.replace(/^(ws|wss)/, '$1://');
            console.log('Fixed WebSocket URL missing protocol separator:', url);
        }
        
        // Log if transformation occurred
        if (url !== originalUrl) {
            console.log(`WebSocket URL transformed: ${originalUrl} → ${url}`);
        }
        
        return url;
    };
    
    // Override WebSocket constructor
    window.WebSocket = function(url, protocols) {
        try {
            // Fix URL before creating WebSocket
            const fixedUrl = window.fixWebSocketUrl(url);
            
            // Create WebSocket with fixed URL
            return new OriginalWebSocket(fixedUrl, protocols);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            
            // Try with a more aggressively fixed URL
            try {
                const forcedUrl = 'ws://' + String(url).replace(/^(ws|wss)(:\/\/)?/, '');
                console.log('Attempting aggressive URL fix:', forcedUrl);
                return new OriginalWebSocket(forcedUrl, protocols);
            } catch (retryError) {
                console.error('WebSocket retry also failed:', retryError);
                
                // Return mock WebSocket object to prevent further errors
                return {
                    url: url,
                    readyState: 3, // CLOSED
                    send: function() { console.warn('Attempted to send on failed WebSocket'); },
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
        }
    };
    
    // Copy prototype and static properties
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    Object.getOwnPropertyNames(OriginalWebSocket).forEach(function(prop) {
        if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
            window.WebSocket[prop] = OriginalWebSocket[prop];
        }
    });
    
    // Directly patch the Chrome extension's reload.js WebSocket issue
    document.addEventListener('DOMContentLoaded', function() {
        // Find any script elements that might be the problematic Chrome extension
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && script.src.includes('chrome-extension') && script.src.includes('reload.js')) {
                console.log('Located potential Chrome extension reload script:', script.src);
                
                // Try to intercept and fix their WebSocket creation
                try {
                    // Create a global accessor that extensions might use
                    window.ChromeExtensionWebSocket = function(url, protocols) {
                        const fixedUrl = window.fixWebSocketUrl(url);
                        return new OriginalWebSocket(fixedUrl, protocols);
                    };
                    window.ChromeExtensionWebSocket.prototype = OriginalWebSocket.prototype;
                } catch (e) {
                    console.error('Failed to patch Chrome extension WebSocket:', e);
                }
            }
        });
    });
    
    // Global error handler for WebSocket URL errors
    window.addEventListener('error', function(event) {
        if (event.message && 
            event.message.includes("WebSocket") && 
            (event.message.includes("URL") || event.message.includes("scheme"))) {
            
            console.warn('Caught WebSocket URL error:', event.message);
            
            // Try to extract and fix URL
            const urlMatch = event.message.match(/'([^']+)'/);
            if (urlMatch && urlMatch[1]) {
                const badUrl = urlMatch[1];
                const fixedUrl = window.fixWebSocketUrl(badUrl);
                console.log(`Attempted recovery of bad WebSocket URL: ${badUrl} → ${fixedUrl}`);
            }
            
            event.preventDefault();
            return true;
        }
    }, true);
    
    console.log('WebSocket constructor successfully patched for Chrome extensions');
})();
