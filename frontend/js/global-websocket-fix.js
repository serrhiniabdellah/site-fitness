/**
 * Global WebSocket Fix v1.2
 * Fixes WebSocket URL issues for all contexts
 */
(function() {
    console.log('Global WebSocket Fix initializing');
    
    // Only proceed if not already patched
    if (window.__websocketPatched) {
        console.log('WebSocket already patched, skipping');
        return;
    }
    
    // Mark as patched to prevent double patching
    window.__websocketPatched = true;
    
    // Store original WebSocket constructor ONCE
    const OriginalWebSocket = window.WebSocket;
    
    // Save original reference
    window.__originalWebSocket = OriginalWebSocket;
    
    /**
     * Fix WebSocket URL format
     * @param {string} url - The WebSocket URL to fix
     * @return {string} - The fixed WebSocket URL
     */
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Original URL for logging
        const originalUrl = url;
        
        // Handle specific problematic Chrome extension URL
        if (url === 'ws127.0.0.1:35729/livereload') {
            console.log('[WebSocket Fix] Fixed specific Chrome extension URL');
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // Fix URL only once - don't recurse
        if (!url.includes('://')) {
            // Fix ws127.0.0.1 format
            if (url.match(/^ws[0-9]/)) {
                url = 'ws://' + url.substring(2);
            }
            // Fix wss127.0.0.1 format
            else if (url.match(/^wss[0-9]/)) {
                url = 'wss://' + url.substring(3);
            }
            // Generic case - add protocol
            else if (url.startsWith('ws')) {
                url = 'ws://' + url.substring(2);
            }
            else if (url.startsWith('wss')) {
                url = 'wss://' + url.substring(3);
            }
        }
        
        // Log if we changed something
        if (url !== originalUrl) {
            console.log(`[WebSocket Fix] URL transformed: ${originalUrl} → ${url}`);
        }
        
        return url;
    }
    
    // Safe replacement WebSocket constructor
    window.WebSocket = function(url, protocols) {
        try {
            // Fix URL
            const fixedUrl = fixWebSocketUrl(url);
            
            // Use original constructor directly
            return new OriginalWebSocket(fixedUrl, protocols);
        } catch (error) {
            console.error('[WebSocket Fix] Error creating WebSocket:', error);
            throw error;
        }
    };
    
    // Copy prototype and static properties
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    // Make the URL fixer available globally
    window.fixWebSocketUrl = fixWebSocketUrl;
    
    console.log('Global WebSocket Fix applied successfully');
})();

/**
 * WebSocket URL fixer to handle common mistakes in WebSocket URLs
 * This helps prevent connection errors when working with local development servers
 */
(function() {
    console.log('Global WebSocket Fix initializing');
    
    // Store reference to original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Function to fix WebSocket URL format
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') {
            return url;
        }
        
        let fixedUrl = url;
        
        // Fix common errors in WebSocket URLs
        
        // Common pattern: ws127.0.0.1:port/path -> ws://127.0.0.1:port/path
        if (url.startsWith('ws127.0.0.1')) {
            fixedUrl = url.replace('ws127.0.0.1', 'ws://127.0.0.1');
            console.log(`Fixed Chrome extension LiveReload URL: ${url} -> ${fixedUrl}`);
            return fixedUrl;
        }
        
        // Common pattern: wss127.0.0.1:port/path -> wss://127.0.0.1:port/path
        if (url.startsWith('wss127.0.0.1')) {
            fixedUrl = url.replace('wss127.0.0.1', 'wss://127.0.0.1');
            console.log(`Fixed secure WebSocket URL: ${url} -> ${fixedUrl}`);
            return fixedUrl;
        }
        
        // Missing protocol separator after 'ws'
        if (url.match(/^ws[0-9]/)) {
            fixedUrl = url.replace(/^ws/, 'ws://');
            console.log(`Fixed WebSocket URL: ${url} -> ${fixedUrl}`);
            return fixedUrl;
        }
        
        // Missing protocol separator after 'wss'
        if (url.match(/^wss[0-9]/)) {
            fixedUrl = url.replace(/^wss/, 'wss://');
            console.log(`Fixed secure WebSocket URL: ${url} -> ${fixedUrl}`);
            return fixedUrl;
        }
        
        // Ensure proper protocol format with double slashes
        fixedUrl = fixedUrl.replace(/^(ws|wss)(:)(?!\/{2})/, '$1$2//');
        
        // Log if URL was fixed
        if (fixedUrl !== url) {
            console.log(`WebSocket URL fixed: ${url} -> ${fixedUrl}`);
        }
        
        return fixedUrl;
    }
    
    // Create a safe WebSocket constructor
    function SafeWebSocket(url, protocols) {
        try {
            return new OriginalWebSocket(fixWebSocketUrl(url), protocols);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            throw error;
        }
    }
    
    // Override WebSocket constructor
    window.WebSocket = SafeWebSocket;
    
    // Maintain prototype and constants
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    console.log('Global WebSocket Fix applied successfully');
    
    // Special handling for Chrome extension reload
    window.addEventListener('load', function() {
        console.log('Initializing WebSocket fixes');
        
        // Fix for Chrome extension reload
        if (window.chrome && chrome.runtime) {
            const originalFetch = window.fetch;
            
            // Override fetch to fix WebSocket URLs in responses
            window.fetch = async function(resource, init) {
                try {
                    return await originalFetch(resource, init);
                } catch (error) {
                    if (error.message && error.message.includes('WebSocket')) {
                        console.log('Intercepted WebSocket error in fetch:', error.message);
                    }
                    throw error;
                }
            };
            
            console.log('Enhanced fetch for WebSocket URLs');
        }
        
        console.log('WebSocket fixes initialized');
    });
})();
