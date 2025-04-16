/**
 * Live Reload Script
 * Enhanced version with Chrome extension compatibility
 */
(function() {
    console.log('[LiveReload] Initializing LiveReload with improved WebSocket handling');
    
    // Configuration
    const RETRY_INTERVAL = 3000; // Retry connection every 3 seconds
    const MAX_RETRIES = 10;      // Maximum number of connection attempts
    
    let socket = null;
    let retryCount = 0;
    let retryTimeout = null;
    
    /**
     * Fix WebSocket URL to ensure proper format
     * Uses the global WebSocketHelper or early fix if available
     */
    function fixWebSocketUrl(url) {
        // Use global fixers if available
        if (window.fixWebSocketUrl) {
            return window.fixWebSocketUrl(url);
        }
        
        if (window.WebSocketHelper && window.WebSocketHelper.fixUrl) {
            return window.WebSocketHelper.fixUrl(url);
        }
        
        // Fallback implementation
        if (typeof url !== 'string') return url;
        
        // Special case for the problematic URL
        if (url === 'ws127.0.0.1:35729/livereload') {
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // Already properly formatted URL
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }
        
        // Common format fixes
        if (url.startsWith('ws')) {
            return 'ws://' + url.substring(2);
        }
        
        return url;
    }
    
    /**
     * Create WebSocket with error handling
     */
    function createWebSocket() {
        try {
            // Use standard port for LiveReload
            const url = fixWebSocketUrl('ws://127.0.0.1:35729/livereload');
            
            console.log('[LiveReload] Creating WebSocket connection to', url);
            
            if (window.WebSocketHelper && window.WebSocketHelper.createWebSocket) {
                return window.WebSocketHelper.createWebSocket(url);
            }
            
            return new WebSocket(url);
        } catch (error) {
            console.error('[LiveReload] Error creating WebSocket:', error);
            return null;
        }
    }
    
    /**
     * Connect to LiveReload server
     */
    function connect() {
        if (socket) {
            // Close any existing connection
            try {
                socket.close();
            } catch (e) {
                // Ignore errors during close
            }
            socket = null;
        }
        
        // Create new WebSocket connection
        socket = createWebSocket();
        
        if (!socket) {
            scheduleRetry();
            return;
        }
        
        // Setup event handlers
        socket.onopen = function() {
            console.log('[LiveReload] Connected successfully');
            retryCount = 0; // Reset retry counter on successful connection
            
            // Send hello message
            socket.send(JSON.stringify({
                command: 'hello',
                protocols: ['http://livereload.com/protocols/official-7']
            }));
        };
        
        socket.onclose = function() {
            console.log('[LiveReload] Connection closed');
            socket = null;
            scheduleRetry();
        };
        
        socket.onerror = function(error) {
            console.error('[LiveReload] WebSocket error:', error);
            
            // Let the onclose handler schedule the retry
            try {
                socket.close();
            } catch (e) {
                // Ignore errors during close
            }
        };
        
        socket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                if (data && data.command === 'reload') {
                    console.log('[LiveReload] Reloading page...');
                    window.location.reload();
                }
            } catch (e) {
                console.error('[LiveReload] Error processing message:', e);
            }
        };
    }
    
    /**
     * Schedule reconnection attempt
     */
    function scheduleRetry() {
        if (retryTimeout) {
            clearTimeout(retryTimeout);
        }
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`[LiveReload] Scheduling reconnection attempt ${retryCount}/${MAX_RETRIES} in ${RETRY_INTERVAL}ms`);
            
            retryTimeout = setTimeout(function() {
                console.log(`[LiveReload] Attempting to reconnect (${retryCount}/${MAX_RETRIES})`);
                connect();
            }, RETRY_INTERVAL);
        } else {
            console.log('[LiveReload] Maximum reconnection attempts reached. Giving up.');
        }
    }
    
    // Start connection when script loads
    console.log('[LiveReload] Starting LiveReload client');
    connect();
})();
