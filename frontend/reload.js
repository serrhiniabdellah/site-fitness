/**
 * LiveReload script for development
 */
(function() {
    // Configuration
    const config = {
        // WebSocket URL for LiveReload
        websocketUrl: 'ws://127.0.0.1:35729/livereload',
        // Max reconnection attempts
        maxReconnectAttempts: 3,
        // Current reconnection attempt
        currentReconnectAttempt: 0,
        // How often to check for changes (milliseconds)
        reloadInterval: 1000
    };
    
    let socket = null;
    
    /**
     * Ensure WebSocket URL has proper format with ws:// protocol
     */
    function fixWebSocketUrl(url) {
        if (typeof url !== 'string') return url;
        
        // Fix missing protocol in WebSocket URLs
        if (url.match(/^ws[0-9]/)) {
            // URLs like ws127.0.0.1 should be ws://127.0.0.1
            return url.replace(/^ws/, 'ws://');
        } else if (url.match(/^wss[0-9]/)) {
            // URLs like wss127.0.0.1 should be wss://127.0.0.1
            return url.replace(/^wss/, 'wss://');
        } else if (url.startsWith('ws') && !url.includes('://')) {
            // Any other URLs starting with ws but missing ://
            return 'ws://' + url.substring(2);
        }
        
        return url;
    }
    
    function initWebSocket() {
        // Stop trying if we've reached max attempts
        if (config.currentReconnectAttempt >= config.maxReconnectAttempts) {
            console.log('Reached maximum reconnection attempts. Live reload disabled.');
            return;
        }
        
        try {
            // Fix URL format before creating WebSocket
            const safeUrl = fixWebSocketUrl(config.websocketUrl);
            console.log('Connecting to reload WebSocket:', safeUrl);
            
            socket = new WebSocket(safeUrl);
            
            socket.onopen = function() {
                console.log('Reload WebSocket connected');
                // Reset reconnection attempts on successful connection
                config.currentReconnectAttempt = 0;
            };
            
            socket.onmessage = function(event) {
                console.log('Reload message received:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'reload') {
                        window.location.reload();
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            socket.onclose = function() {
                config.currentReconnectAttempt++;
                const remainingAttempts = config.maxReconnectAttempts - config.currentReconnectAttempt;
                
                if (remainingAttempts > 0) {
                    console.log(`Reload WebSocket closed, reconnecting in 5s... (${remainingAttempts} attempts remaining)`);
                    setTimeout(initWebSocket, 5000);
                } else {
                    console.log('Reload WebSocket closed. No more reconnection attempts.');
                }
            };
            
            socket.onerror = function(error) {
                console.log('Reload WebSocket error:', error);
                // Don't close since onclose will be called automatically
            };
        } catch (error) {
            console.error('Failed to initialize reload WebSocket:', error);
            config.currentReconnectAttempt++;
            
            const remainingAttempts = config.maxReconnectAttempts - config.currentReconnectAttempt;
            if (remainingAttempts > 0) {
                console.log(`Retrying in 5 seconds... (${remainingAttempts} attempts remaining)`);
                setTimeout(initWebSocket, 5000);
            }
        }
    }
    
    // Start WebSocket connection only in development mode and if not in an extension context
    if ((window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && 
        !window.location.href.startsWith('chrome-extension://')) {
        console.log('Development mode detected, initializing live reload');
        initWebSocket();
    } else {
        console.log('Not in development mode or running in extension context, live reload disabled');
    }
})();
