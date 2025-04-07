/**
 * LiveReload script for development v2.0
 */
(function() {
    // Configuration
    const config = {
        // WebSocket URL for LiveReload (make sure to use proper URL format)
        websocketUrl: 'ws://127.0.0.1:35729/livereload',
        // Max reconnection attempts
        maxReconnectAttempts: 3,
        // Current reconnection attempt
        currentReconnectAttempt: 0
    };
    
    let socket = null;
    
    function initWebSocket() {
        // Stop trying if we've reached max attempts
        if (config.currentReconnectAttempt >= config.maxReconnectAttempts) {
            console.log('Maximum reconnection attempts reached. Live reload disabled.');
            return;
        }
        
        try {
            // Use the global URL fixer if available
            let safeUrl = config.websocketUrl;
            if (typeof window.fixWebSocketUrl === 'function') {
                safeUrl = window.fixWebSocketUrl(config.websocketUrl);
            } else {
                // Backup URL fixing logic if global function isn't available
                if (safeUrl.match(/^ws[0-9]/)) {
                    safeUrl = safeUrl.replace(/^ws/, 'ws://');
                }
            }
            
            console.log('Connecting to reload WebSocket:', safeUrl);
            
            // Create WebSocket connection
            socket = new WebSocket(safeUrl);
            
            socket.onopen = function() {
                console.log('Reload WebSocket connected');
                config.currentReconnectAttempt = 0;
            };
            
            socket.onmessage = function(event) {
                console.log('Reload message received');
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'reload') {
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
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
    
    // Only run in development mode
    if ((window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && 
        !window.location.href.startsWith('chrome-extension://')) {
        console.log('Development mode detected, initializing live reload');
        
        // Wait for document to be ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log("LiveReload initialized. Page ready for automatic refresh.");
            
            // Start the WebSocket connection after a short delay to ensure URL fixer is ready
            setTimeout(initWebSocket, 500);
        });
    } else {
        console.log('Not in development mode, reload functionality disabled');
    }
})();
