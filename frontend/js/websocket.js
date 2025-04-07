/**
 * FitZone WebSocket Module
 * Handles real-time communications
 */
const FitZoneWebSocket = (function() {
    const WS_URL = CONFIG?.WS_URL || 'ws://127.0.0.1:8080';
    let socket = null;
    let reconnectInterval = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    // Event handlers
    const eventHandlers = {
        message: [],
        open: [],
        close: [],
        error: []
    };
    
    // Initialize WebSocket connection
    function init() {
        if (!WS_URL) {
            console.error('WebSocket URL not defined in CONFIG');
            return;
        }
        
        try {
            // Create WebSocket connection with proper URL format
            socket = new WebSocket(WS_URL);
            
            socket.onopen = function(event) {
                console.log('WebSocket connection established');
                clearReconnectInterval();
                reconnectAttempts = 0;
                triggerEvent('open', event);
            };
            
            socket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    triggerEvent('message', data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    triggerEvent('message', event.data);
                }
            };
            
            socket.onclose = function(event) {
                console.log('WebSocket connection closed');
                triggerEvent('close', event);
                scheduleReconnect();
            };
            
            socket.onerror = function(error) {
                console.error('WebSocket error:', error);
                triggerEvent('error', error);
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    }
    
    // Send message through WebSocket
    function send(data) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return false;
        }
        
        try {
            const message = typeof data === 'object' ? JSON.stringify(data) : data;
            socket.send(message);
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }
    
    // Add event handler
    function on(eventType, handler) {
        if (!eventHandlers[eventType]) {
            eventHandlers[eventType] = [];
        }
        
        eventHandlers[eventType].push(handler);
    }
    
    // Remove event handler
    function off(eventType, handler) {
        if (!eventHandlers[eventType]) return;
        
        const index = eventHandlers[eventType].indexOf(handler);
        if (index !== -1) {
            eventHandlers[eventType].splice(index, 1);
        }
    }
    
    // Trigger event handlers
    function triggerEvent(eventType, data) {
        if (!eventHandlers[eventType]) return;
        
        eventHandlers[eventType].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
            }
        });
    }
    
    // Schedule reconnect
    function scheduleReconnect() {
        if (reconnectInterval) return;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
            return;
        }
        
        reconnectAttempts++;
        console.log(`Scheduling WebSocket reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        
        reconnectInterval = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            init();
        }, 3000); // Retry after 3 seconds
    }
    
    // Clear reconnect interval
    function clearReconnectInterval() {
        if (reconnectInterval) {
            clearTimeout(reconnectInterval);
            reconnectInterval = null;
        }
    }
    
    // Close WebSocket connection
    function close() {
        if (socket) {
            socket.close();
            socket = null;
        }
        
        clearReconnectInterval();
    }
    
    // Return public API
    return {
        init,
        send,
        on,
        off,
        close
    };
})();

// Don't auto-initialize, let pages decide when to connect
console.log('FitZoneWebSocket module loaded');
