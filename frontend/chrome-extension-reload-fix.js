/**
 * Chrome Extension Reload Fix v1.0
 * Specifically fixes WebSocket URLs in Chrome extensions that use live-reload
 */
(function() {
    // Wait for all scripts to load
    window.addEventListener('load', function() {
        console.log('Chrome Extension Reload Fix activated');
        
        // Check for Chrome extensions
        if (window.chrome && chrome.runtime) {
            // Add a script element with our WebSocket URL fixer
            const script = document.createElement('script');
            script.textContent = `
                // Override WebSocket for Chrome extensions
                if (window.chrome && chrome.runtime) {
                    console.log("Applying Chrome extension WebSocket URL fix");
                    
                    // Create storage for original WebSocket
                    window.__originalWebSocket = window.__originalWebSocket || window.WebSocket;
                    
                    // Create a fixed WebSocket constructor
                    window.WebSocket = function(url, protocols) {
                        if (typeof url === 'string') {
                            // Fix ws127.0.0.1 format
                            if (url.match(/^ws[0-9]/)) {
                                url = url.replace(/^ws/, 'ws://');
                                console.log('Fixed WebSocket URL:', url);
                            } else if (url.match(/^wss[0-9]/)) {
                                url = url.replace(/^wss/, 'wss://');
                                console.log('Fixed WebSocket URL:', url);
                            }
                        }
                        return new window.__originalWebSocket(url, protocols);
                    };
                    
                    // Copy prototype and properties
                    window.WebSocket.prototype = window.__originalWebSocket.prototype;
                    Object.getOwnPropertyNames(window.__originalWebSocket).forEach(function(prop) {
                        if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
                            window.WebSocket[prop] = window.__originalWebSocket[prop];
                        }
                    });
                }
            `;
            
            // Add to document to execute
            document.head.appendChild(script);
        }
    });
})();
