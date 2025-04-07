/**
 * Chrome Extension Reload Fix v2.1
 * Specifically targets and fixes the 'ws127.0.0.1:35729/livereload' URL format issue
 */
(function() {
    // Execute immediately to catch WebSocket usage early
    console.log('Chrome Extension Reload Fix initialized');
    
    // Skip if WebSocket has already been patched
    if (window.__websocketPatched) {
        console.log('WebSocket already patched, skipping reload fix');
        return;
    }
    
    // Inject specific fix for Chrome extension reload script
    try {
        const script = document.createElement('script');
        script.textContent = `
            try {
                // Only patch if not already patched
                if (!window.__websocketPatched) {
                    // Original WebSocket reference
                    window.__originalWebSocket = window.__originalWebSocket || WebSocket;
                    
                    // Create patched WebSocket constructor
                    WebSocket = function(url, protocols) {
                        // Fix the specific problematic URL
                        if (typeof url === 'string' && url === 'ws127.0.0.1:35729/livereload') {
                            console.log('Fixed Chrome extension reload WebSocket URL');
                            url = 'ws://127.0.0.1:35729/livereload';
                        }
                        
                        // Create WebSocket with fixed URL
                        return new window.__originalWebSocket(url, protocols);
                    };
                    
                    // Copy prototype and properties
                    WebSocket.prototype = window.__originalWebSocket.prototype;
                    WebSocket.CONNECTING = window.__originalWebSocket.CONNECTING;
                    WebSocket.OPEN = window.__originalWebSocket.OPEN;
                    WebSocket.CLOSING = window.__originalWebSocket.CLOSING;
                    WebSocket.CLOSED = window.__originalWebSocket.CLOSED;
                    
                    // Mark as patched
                    window.__websocketPatched = true;
                    console.log('Chrome extension WebSocket patched');
                }
            } catch(e) {
                console.error('Failed to patch Chrome extension WebSocket:', e);
            }
        `;
        
        // Add to document and remove (executes inline)
        document.head.appendChild(script);
        document.head.removeChild(script);
    } catch (e) {
        console.error('Failed to inject WebSocket fix script:', e);
    }
})();
