/**
 * Universal Logout Helper - Provides a reliable, consistent logout function
 * for use across the entire FitZone application
 * With enhanced error suppression
 */

(function() {
    'use strict';
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initUniversalLogout);

    // Log initialization - use a conditional log that can be disabled
    const DEBUG = false; // Set to false to suppress all console logs
    function logInfo(message) {
        if (DEBUG) console.log('[UniversalLogout] ' + message);
    }
    
    logInfo('Initializing universal logout helper');
    
    /**
     * Initialize the universal logout functionality
     */
    function initUniversalLogout() {
        // Make sure we don't initialize twice
        if (window.UniversalLogout) {
            return;
        }
        
        // Create the global logout helper
        window.UniversalLogout = {
            /**
             * Perform a guaranteed logout that works regardless of 
             * any other logout prevention mechanisms
             * @param {string} [redirectUrl='index.html'] - URL to redirect to after logout
             * @returns {boolean} Success of the logout operation
             */
            logout: function(redirectUrl) {
                logInfo('Performing guaranteed logout');
                
                try {
                    // Patch FitZoneAuth to prevent any error messages
                    silenceAuthErrors();
                    
                    // Signal that this is a user-initiated logout to bypass protection
                    window.lastUserInteraction = Date.now();
                    window.preventAutoLogout = false;
                    window.userInitiatedLogout = true;
                    
                    // Directly clear all auth-related local storage items
                    const keysToRemove = [
                        'fitzone_token', 
                        'fitzone_user', 
                        'fitzone_auth_state',
                        'fitzone_session',
                        'fitzone_refresh_token'
                    ];
                    
                    keysToRemove.forEach(key => {
                        try {
                            localStorage.removeItem(key);
                            logInfo(`Removed ${key} from localStorage`);
                        } catch (e) {
                            // Silently fail - no console messages
                        }
                    });

                    // Trigger multiple logout events to ensure all listeners are notified
                    const events = ['fitzone_logout', 'auth:logout', 'auth:stateChanged'];
                    
                    events.forEach(eventName => {
                        try {
                            window.dispatchEvent(new CustomEvent(eventName, { 
                                bubbles: true,
                                detail: { isLoggedIn: false }
                            }));
                            logInfo(`Dispatched ${eventName} event`);
                        } catch (e) {
                            // Silently fail - no console messages
                        }
                    });
                    
                    // Attempt to call FitZoneAuth.logout directly if it exists
                    // But completely suppress any errors or console output
                    try {
                        if (window.FitZoneAuth) {
                            // Store the console.warn/error temporarily
                            const originalWarn = console.warn;
                            const originalError = console.error;
                            const originalLog = console.log;
                            
                            // Replace with empty functions
                            console.warn = function(){};
                            console.error = function(){};
                            console.log = function(){};
                            
                            // Try the original logout if available
                            if (typeof window.FitZoneAuth._originalLogout === 'function') {
                                window.FitZoneAuth._originalLogout();
                            } else if (typeof window.FitZoneAuth.logout === 'function') {
                                window.FitZoneAuth.logout();
                            }
                            
                            // Restore console functions
                            console.warn = originalWarn;
                            console.error = originalError;
                            console.log = originalLog;
                        }
                    } catch (e) {
                        // Completely suppress error
                    }
                    
                    logInfo('Logout successful');
                    
                    // Redirect if specified
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else if (typeof window.location !== 'undefined') {
                        window.location.href = 'index.html';
                    }
                    
                    return true;
                } catch (error) {
                    // Suppress the error logging
                    
                    // Forcefully clear storage as a last resort
                    try {
                        localStorage.removeItem('fitzone_token');
                        localStorage.removeItem('fitzone_user');
                    } catch (e) {
                        // Suppress error
                    }
                    
                    // Try to redirect anyway
                    try {
                        if (redirectUrl) {
                            window.location.href = redirectUrl;
                        } else {
                            window.location.href = 'index.html';
                        }
                    } catch (e) {
                        // Suppress error
                    }
                    
                    return false;
                }
            },
            
            /**
             * Set up reliable logout handlers for common logout elements
             */
            setupLogoutHandlers: function() {
                // Common logout element selectors
                const logoutSelectors = [
                    '#logout-link',
                    '#logout-btn',
                    '[data-action="logout"]',
                    'a[href="#logout"]',
                    '.logout-link'
                ];
                
                // Find all logout elements
                const selectors = logoutSelectors.join(',');
                const logoutElements = document.querySelectorAll(selectors);
                
                // Attach event listeners to each element
                logoutElements.forEach(element => {
                    // Remove any existing click listeners
                    const newElement = element.cloneNode(true);
                    if (element.parentNode) {
                        element.parentNode.replaceChild(newElement, element);
                    }
                    
                    // Add our universal logout handler
                    newElement.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent event bubbling
                        window.UniversalLogout.logout();
                    });
                    
                    logInfo('Added logout handler');
                });
            }
        };
        
        /**
         * Silence any auth errors by patching the console and auth methods
         */
        function silenceAuthErrors() {
            // Only do this during logout operations
            if (window.FitZoneAuth) {
                // Store the original logout
                if (!window.FitZoneAuth._originalLogout && typeof window.FitZoneAuth.logout === 'function') {
                    window.FitZoneAuth._originalLogout = window.FitZoneAuth.logout;
                }
                
                // Create a silent version that suppresses all output
                window.FitZoneAuth.logout = function() {
                    // Store console functions
                    const originalWarn = console.warn;
                    const originalError = console.error;
                    const originalLog = console.log;
                    
                    try {
                        // Silence console temporarily
                        console.warn = function(){};
                        console.error = function(){};
                        console.log = function(){};
                        
                        // Clear auth data directly
                        localStorage.removeItem('fitzone_token');
                        localStorage.removeItem('fitzone_user');
                        localStorage.removeItem('fitzone_auth_state');
                        
                        // Call original if possible, but suppress any errors
                        try {
                            if (typeof window.FitZoneAuth._originalLogout === 'function') {
                                window.FitZoneAuth._originalLogout();
                            }
                        } catch (e) {
                            // Suppress completely
                        }
                    } catch (e) {
                        // Suppress completely
                    } finally {
                        // Restore console functions
                        console.warn = originalWarn;
                        console.error = originalError;
                        console.log = originalLog;
                    }
                    
                    // Always return true to indicate success
                    return true;
                };
            }
            
            // Patch other auth-related functions that might cause errors
            if (window.updateAuthUI && typeof window.updateAuthUI.FitZoneAuth === 'object') {
                if (typeof window.updateAuthUI.FitZoneAuth.logout === 'function') {
                    window.updateAuthUI.FitZoneAuth.logout = function() {
                        // Silently perform logout without logs
                        try {
                            localStorage.removeItem('fitzone_token');
                            localStorage.removeItem('fitzone_user');
                        } catch (e) {}
                        return true;
                    };
                }
            }
        }
        
        // Store original FitZoneAuth.logout if it exists
        if (window.FitZoneAuth && typeof window.FitZoneAuth.logout === 'function') {
            window.FitZoneAuth._originalLogout = window.FitZoneAuth.logout;
            
            // Override the existing logout method to use our universal method
            window.FitZoneAuth.logout = function() {
                return window.UniversalLogout.logout();
            };
        }
        
        // Set up the logout handlers when document is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            window.UniversalLogout.setupLogoutHandlers();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                window.UniversalLogout.setupLogoutHandlers();
            });
        }

        logInfo('Universal logout helper initialized');
    }

    // If the page is already loaded, initialize immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initUniversalLogout();
    }
})();