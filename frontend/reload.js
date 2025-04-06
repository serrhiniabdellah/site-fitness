/**
 * LiveReload script for development
 */
(function() {
    // Configuration
    const config = {
        // Proper WebSocket URL format
        websocketUrl: 'ws://127.0.0.1:35729/livereload',
        // Max reconnection attempts
        maxReconnectAttempts: 3,
        // Current reconnection attempt
        currentReconnectAttempt: 0,
        // How often to check for changes (milliseconds)
        reloadInterval: 1000
    };
    
    let socket = null;
    
    function initWebSocket() {
        // Stop trying if we've reached max attempts
        if (config.currentReconnectAttempt >= config.maxReconnectAttempts) {
            console.log('Reached maximum reconnection attempts. Live reload disabled.');
            return;
        }
        
        try {
            console.log('Connecting to reload WebSocket:', config.websocketUrl);
            socket = new WebSocket(config.websocketUrl);
            
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
                console.error('Reload WebSocket error:', error);
                socket.close();
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
