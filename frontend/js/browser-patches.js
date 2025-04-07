/**
 * Browser Patches
 * Fixes WebSocket URL and authentication issues
 */
(function() {
    console.log('Browser patches initialized');
    
    // Fix WebSocket URL format issues
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        if (typeof url === 'string') {
            // Fix the specific case causing errors in Chrome extension
            if (url.match(/^ws[0-9]/)) {
                url = url.replace(/^ws/, 'ws://');
                console.log('Fixed critical WebSocket URL format (ws + digits):', url);
            }
            
            // Force scheme for any 'ws' or 'wss' missing '://'
            url = url.replace(/^((ws|wss))([^:])/, '$1://$3');
            // Fix common URL format errors
            if (typeof url === 'string') {
                // Case 1: Missing '://' after 'ws' or 'wss'
                if (url.startsWith('ws') && !url.includes('://')) {
                    url = url.replace(/^ws/, 'ws://');
                    console.log('Corrected WebSocket URL (added "://"):', url);
                }
                // Case 2: URL starts without 'ws://' or 'wss://'
                else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
                    url = 'ws://' + url;
                    console.log('Corrected WebSocket URL (added "ws://"):', url);
                }
                // Case 3: Ensure proper formatting for localhost or 127.0.0.1
                if (url.startsWith('ws://127.0.0.1') || url.startsWith('ws://localhost')) {
                    console.log('Using WebSocket URL:', url);
                } else {
                    console.warn('Unexpected WebSocket URL format:', url);
                }
            } else {
                console.error('Invalid WebSocket URL type:', typeof url, url);
            }
            console.log('WebSocket URL after regex fix:', url);
        }

        try {
            return new OriginalWebSocket(url, protocols);
        } catch (error) {
            console.error('WebSocket creation error:', error, 'URL:', url);
            return {
                readyState: 3, // CLOSED
                send: function() {},
                close: function() {},
                addEventListener: function() {},
                removeEventListener: function() {}
            };
        }
    };

    // Copy prototype and static properties
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    Object.getOwnPropertyNames(OriginalWebSocket).forEach(prop => {
        if (prop !== 'prototype') {
            window.WebSocket[prop] = OriginalWebSocket[prop];
        }
    });

    // Fix for localStorage event propagation (helps with auth state)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Call original implementation
        originalSetItem.call(localStorage, key, value);
        
        // Dispatch a custom event for auth-related keys
        if (key === 'fitzone_token' || key === 'fitzone_user') {
            // Create and dispatch a synthetic storage event
            const storageEvent = new CustomEvent('auth:storageChange', {
                detail: { key, value }
            });
            document.dispatchEvent(storageEvent);
        }
    };

    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
        const hadValue = localStorage.getItem(key) !== null;
        
        // Call original implementation
        originalRemoveItem.call(localStorage, key);
        
        // Dispatch a custom event for auth-related keys
        if ((key === 'fitzone_token' || key === 'fitzone_user') && hadValue) {
            // Create and dispatch a synthetic storage event
            const storageEvent = new CustomEvent('auth:storageChange', {
                detail: { key, value: null }
            });
            document.dispatchEvent(storageEvent);
        }
    };

    // Enhanced session management
    window.SessionManager = {
        init: function() {
            document.addEventListener('DOMContentLoaded', this.checkSession.bind(this));
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.checkSession();
                }
            });
        },

        checkSession: function() {
            if (typeof FitZoneAuth === 'undefined') {
                console.warn('Auth module not loaded yet');
                return;
            }

            const isLoggedIn = FitZoneAuth.isLoggedIn();
            console.log('Session check - logged in:', isLoggedIn);

            if (isLoggedIn) {
                document.body.classList.add('logged-in');
                
                // Force localStorage consistency
                const user = FitZoneAuth.getCurrentUser();
                const token = FitZoneAuth.getToken();
                if (user && token) {
                    // Ensure localStorage has the most recent data
                    localStorage.setItem('fitzone_user', JSON.stringify(user));
                    localStorage.setItem('fitzone_token', token);
                    localStorage.setItem('fitzone_login_timestamp', Date.now().toString());
                }
                
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI();
                }
            } else {
                document.body.classList.remove('logged-in');
            }
        }
    };

    // Initialize session management
    window.SessionManager.init();
})();
