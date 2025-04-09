/**
 * WebSocket Helper
 * Utility functions to ensure consistent WebSocket behavior across browsers
 * Especially important for Chrome extensions that require proper URL formatting
 */

(function() {
    // Record that the helper has been loaded
    window.__webSocketHelperLoaded = true;
    
    // Import the fix function if it exists, or create our own implementation
    const hasEarlyFix = window.__webSocketEarlyFixInstalled && window.fixWebSocketUrl;
    
    /**
     * Fix WebSocket URLs with common formatting issues
     * @param {string} url - The WebSocket URL to fix
     * @returns {string} - The fixed WebSocket URL
     */
    function fixWebSocketUrl(url) {
        // If early fix is installed, use that implementation
        if (hasEarlyFix && window.fixWebSocketUrl) {
            return window.fixWebSocketUrl(url);
        }
        
        // Otherwise, use our own implementation
        if (typeof url !== 'string') return url;
        
        // Handle common problematic cases first
        // This is the exact pattern that caused the error in Chrome extension
        if (url === 'ws127.0.0.1:35729/livereload') {
            return 'ws://127.0.0.1:35729/livereload';
        }
        
        // If already has proper format, return as is
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }
        
        // Fix URLs like ws127.0.0.1
        if (/^ws[0-9]/.test(url)) {
            url = 'ws://' + url.substring(2);
        } 
        // Fix URLs like wss127.0.0.1
        else if (/^wss[0-9]/.test(url)) {
            url = 'wss://' + url.substring(3);
        }
        // Fix URLs like ws:127.0.0.1 (missing //)
        else if (url.startsWith('ws:') && url.charAt(3) !== '/') {
            url = 'ws://' + url.substring(3);
        }
        // Fix URLs like wss:127.0.0.1 (missing //)
        else if (url.startsWith('wss:') && url.charAt(4) !== '/') {
            url = 'wss://' + url.substring(4);
        }
        // Fix URLs that start with ws but don't have ://
        else if (url.startsWith('ws') && !url.includes('://')) {
            url = 'ws://' + url.substring(2);
        }
        // Fix URLs that start with wss but don't have ://
        else if (url.startsWith('wss') && !url.includes('://')) {
            url = 'wss://' + url.substring(3);
        }
        
        return url;
    }
    
    /**
     * Create a WebSocket with proper error handling
     * @param {string} url - The WebSocket URL
     * @param {string|string[]} [protocols] - WebSocket protocols
     * @returns {WebSocket} - WebSocket instance
     */
    function createWebSocket(url, protocols) {
        // Fix the URL first
        const fixedUrl = fixWebSocketUrl(url);
        
        if (fixedUrl !== url) {
            console.log(`[WebSocket Helper] Fixed URL: ${url} → ${fixedUrl}`);
        }
        
        try {
            // Create a WebSocket with the fixed URL
            return new window.__originalWebSocket 
                ? new window.__originalWebSocket(fixedUrl, protocols)
                : new WebSocket(fixedUrl, protocols);
        } catch (error) {
            console.error('[WebSocket Helper] Error creating WebSocket:', error);
            throw error;
        }
    }
    
    /**
     * Check if a URL is a valid WebSocket URL
     * @param {string} url - The URL to check
     * @returns {boolean} - Whether the URL is a valid WebSocket URL
     */
    function isValidWebSocketUrl(url) {
        try {
            const fixedUrl = fixWebSocketUrl(url);
            return fixedUrl.startsWith('ws://') || fixedUrl.startsWith('wss://');
        } catch (e) {
            return false;
        }
    }
    
    // Expose utility functions globally
    window.WebSocketHelper = {
        fixUrl: fixWebSocketUrl,
        createWebSocket: createWebSocket,
        isValidUrl: isValidWebSocketUrl
    };
    
    console.log('[WebSocket Helper] WebSocket utility functions loaded');
})();
