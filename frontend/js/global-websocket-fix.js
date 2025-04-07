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
