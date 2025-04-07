/**
 * LiveReload script for development v2.0
 */
(function() {
    // Configuration
    const config = {
        // WebSocket URL for LiveReload - ensure proper URL format
        websocketUrl: 'ws://127.0.0.1:35729/livereload',
        // Max reconnection attempts
        maxReconnectAttempts: 5,
        // Current reconnection attempt
        currentReconnectAttempt: 0,
        // How often to check for changes (milliseconds)
        reloadInterval: 1000
    };
    
    let socket = null;
    
    /**
     * Ensure WebSocket URL has proper format
     */
    function fixWebSocketUrl(url) {
        // Handle the specific problematic case
        if (url === 'ws127.0.0.1:35729/livereload') {
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // If URL already has proper format, return as is
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }
        
        // Fix URLs that start with ws followed by a number
        if (url.match(/^ws[0-9]/)) {
            return 'ws://' + url.substring(2);
        }
        
        // Fix URLs that start with wss followed by a number
        if (url.match(/^wss[0-9]/)) {
            return 'wss://' + url.substring(3);
        }
        
        // For any other URLs starting with ws but missing ://
        if (url.startsWith('ws') && !url.includes('://')) {
            return 'ws://' + url.substring(2);
        }
        
        return url;
    }
    
    function initWebSocket() {
        // Skip if max attempts reached
        if (config.currentReconnectAttempt >= config.maxReconnectAttempts) {
            console.log('Maximum reconnection attempts reached. Live reload disabled.');
            return;
        }
        
        try {
            // Use global WebSocket URL fixer if available
            let url = config.websocketUrl;
            if (window.fixWebSocketUrl) {
                url = window.fixWebSocketUrl(url);
            } else {
                url = fixWebSocketUrl(url);
            }
            
            console.log('Connecting to reload WebSocket:', url);
            
            // Use window.__originalWebSocket if available (to avoid patched version)
            const WebSocketConstructor = window.__originalWebSocket || window.WebSocket;
            socket = new WebSocketConstructor(url);
            
            socket.onopen = function() {
                console.log('Reload WebSocket connected successfully');
                config.currentReconnectAttempt = 0;
            };
            
            socket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.command === 'reload') {
                        window.location.reload();
                    }
                } catch (e) {
                    console.error('Error processing reload message:', e);
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
    
    // Start WebSocket connection only in development mode
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        console.log('Development mode detected, initializing live reload');
        
        // Wait for document to be ready before initializing
        document.addEventListener('DOMContentLoaded', function() {
            console.log('LiveReload initialized. Page ready for automatic refresh.');
            
            // Slight delay to ensure all WebSocket patches are applied
            setTimeout(initWebSocket, 300);
        });
    }
})();
