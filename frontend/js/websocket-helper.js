/**
 * WebSocket Helper Utility
 * Provides standardized methods for working with WebSockets
 * and handles URL format issues
 */
(function() {
    // Create the WebSocket helper namespace
    window.FitZoneWebSocket = {
        /**
         * Creates a WebSocket connection with proper URL formatting
         * @param {string} url - WebSocket URL or endpoint
         * @param {object} options - Connection options
         * @returns {WebSocket} - The WebSocket connection
         */
        connect: function(url, options = {}) {
            try {
                // Default options
                const defaults = {
                    autoReconnect: true,
                    maxReconnectAttempts: 5,
                    reconnectInterval: 5000,
                    onOpen: null,
                    onClose: null,
                    onError: null,
                    onMessage: null
                };
                
                const settings = Object.assign({}, defaults, options);
                
                // Ensure URL has proper format (ws:// or wss://)
                let formattedUrl = url;
                
                // If URL doesn't start with ws:// or wss://, assume it's a relative path or missing protocol
                if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
                    // If URL starts with a slash, assume it's a relative path
                    if (url.startsWith('/')) {
                        // Use the current host with ws:// protocol
                        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        formattedUrl = `${protocol}//${window.location.host}${url}`;
                    } else if (url.match(/^[0-9]/)) {
                        // If URL starts with a number, assume it's an IP address or port
                        formattedUrl = `ws://${url}`;
                    } else if (url.includes('127.0.0.1') || url.includes('localhost')) {
                        // Missing protocol for localhost
                        formattedUrl = `ws://${url}`;
                    } else {
                        // For any other URL, prepend ws://
                        formattedUrl = `ws://${url}`;
                    }
                }
                
                console.log(`Connecting to WebSocket: ${formattedUrl}`);
                
                // Create WebSocket with the formatted URL
                const socket = new WebSocket(formattedUrl);
                let reconnectAttempts = 0;
                let reconnectTimer = null;
                
                // Set up event handlers
                socket.onopen = function(event) {
                    console.log(`WebSocket connected to ${formattedUrl}`);
                    reconnectAttempts = 0;
                    if (settings.onOpen) settings.onOpen(event, socket);
                };
                
                socket.onclose = function(event) {
                    console.log(`WebSocket disconnected from ${formattedUrl}`);
                    
                    // Attempt to reconnect if enabled
                    if (settings.autoReconnect && 
                        reconnectAttempts < settings.maxReconnectAttempts) {
                        console.log(`Attempting to reconnect in ${settings.reconnectInterval / 1000}s...`);
                        
                        reconnectTimer = setTimeout(function() {
                            reconnectAttempts++;
                            console.log(`Reconnection attempt ${reconnectAttempts} of ${settings.maxReconnectAttempts}`);
                            FitZoneWebSocket.connect(url, settings);
                        }, settings.reconnectInterval);
                    }
                    
                    if (settings.onClose) settings.onClose(event, socket);
                };
                
                socket.onerror = function(event) {
                    console.error(`WebSocket error with ${formattedUrl}:`, event);
                    if (settings.onError) settings.onError(event, socket);
                };
                
                socket.onmessage = function(event) {
                    if (settings.onMessage) settings.onMessage(event, socket);
                };
                
                // Add helper methods to the socket instance
                socket.sendJSON = function(data) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify(data));
                        return true;
                    }
                    return false;
                };
                
                socket.cancelReconnect = function() {
                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                };
                
                return socket;
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                return null;
            }
        },
        
        /**
         * Get a properly formatted WebSocket URL
         * @param {string} host - Hostname or IP
         * @param {number|string} port - Port number
         * @param {string} path - URL path
         * @param {boolean} secure - Use secure WebSocket (wss://)
         * @returns {string} Formatted WebSocket URL
         */
        formatUrl: function(host, port, path = '', secure = false) {
            const protocol = secure ? 'wss://' : 'ws://';
            const portStr = port ? `:${port}` : '';
            const pathStr = path && !path.startsWith('/') ? `/${path}` : path;
            
            return `${protocol}${host}${portStr}${pathStr}`;
        }
    };
    
    console.log('FitZoneWebSocket helper initialized');
})();
