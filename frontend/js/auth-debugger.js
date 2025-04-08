/**
 * AuthDebugger - Comprehensive solution for authentication issues
 * This tool provides debugging and fixes for authentication loops
 */

(function() {
    // Create global debugger object
    window.AuthDebugger = {
        // Configuration
        config: {
            logEnabled: true,
            fixRedirectLoop: true,
            maxRedirects: 3,
            redirectCountKey: 'auth_redirect_count',
            forceTokenValidation: true
        },
        
        // Initialize the debugger
        init: function() {
            this.log('AuthDebugger initialized');
            this.checkRedirectLoop();
            this.validateLocalStorage();
            
            // Track page visits to detect loops
            this.trackPageVisit();
            
            // Apply fixes
            if (this.config.fixRedirectLoop) {
                this.applyRedirectLoopFix();
            }
            
            return this;
        },
        
        // Log function with toggle
        log: function(message, data) {
            if (!this.config.logEnabled) return;
            
            if (data) {
                console.log(`[AuthDebugger] ${message}`, data);
            } else {
                console.log(`[AuthDebugger] ${message}`);
            }
        },
        
        // Check for redirect loops
        checkRedirectLoop: function() {
            const count = parseInt(localStorage.getItem(this.config.redirectCountKey) || '0');
            const currentPage = window.location.pathname.split('/').pop();
            
            this.log(`Current page: ${currentPage}, Redirect count: ${count}`);
            
            // Handle checkout redirect loop specifically
            if (currentPage === 'checkout.html' || currentPage === 'login.html') {
                localStorage.setItem(this.config.redirectCountKey, (count + 1).toString());
                
                if (count >= this.config.maxRedirects) {
                    this.log('Redirect loop detected!');
                    this.handleRedirectLoop();
                    return true;
                }
            } else {
                // Reset counter for other pages
                localStorage.removeItem(this.config.redirectCountKey);
            }
            
            return false;
        },
        
        // Handle detected redirect loop
        handleRedirectLoop: function() {
            this.log('Handling redirect loop');
            
            // Reset counter
            localStorage.removeItem(this.config.redirectCountKey);
            
            // Clear potentially corrupted auth data
            localStorage.removeItem('fitzone_token');
            localStorage.removeItem('fitzone_user');
            
            // Display error message if on checkout page
            if (window.location.pathname.includes('checkout.html')) {
                document.body.innerHTML = `
                    <div style="max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; background: #fff; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2>Authentication Error</h2>
                        <p>There was a problem with your login session. Please log in again to continue.</p>
                        <div style="margin-top: 20px;">
                            <a href="login.html?redirect=checkout.html&fixed=true" 
                               style="display: inline-block; padding: 10px 20px; background: #088178; color: white; text-decoration: none; border-radius: 4px;">
                               Log In
                            </a>
                            <a href="index.html" 
                               style="display: inline-block; padding: 10px 20px; background: #f8f9fa; color: #333; text-decoration: none; border-radius: 4px; margin-left: 10px;">
                               Return to Home
                            </a>
                        </div>
                    </div>
                `;
            } 
            // Redirect to index if on login page
            else if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html?auth_error=true';
            }
        },
        
        // Apply fix to prevent redirect loops
        applyRedirectLoopFix: function() {
            this.log('Applying redirect loop fixes');
            
            // Force checkout page to check local storage directly
            if (window.location.pathname.includes('checkout.html')) {
                this.log('Applying checkout page fix');
                this.applyCheckoutFix();
            }
            
            // Fix login redirect handling
            if (window.location.pathname.includes('login.html')) {
                this.log('Applying login page fix');
                this.applyLoginFix();
            }
        },
        
        // Direct localStorage check for auth
        checkAuthStorage: function() {
            const token = localStorage.getItem('fitzone_token');
            const userStr = localStorage.getItem('fitzone_user');
            
            if (!token || !userStr) {
                this.log('Missing token or user data');
                return false;
            }
            
            try {
                // Try parsing the user data as JSON
                const user = JSON.parse(userStr);
                if (!user || !user.id_utilisateur) {
                    this.log('Invalid user data format');
                    return false;
                }
                return true;
            } catch (e) {
                this.log('Failed to parse user data', e);
                return false;
            }
        },
        
        // Check and clean localStorage data
        validateLocalStorage: function() {
            const token = localStorage.getItem('fitzone_token');
            const userStr = localStorage.getItem('fitzone_user');
            
            this.log('Validating localStorage data');
            this.log('Token exists:', !!token);
            this.log('User data exists:', !!userStr);
            
            if (userStr) {
                try {
                    JSON.parse(userStr);
                    this.log('User data is valid JSON');
                } catch (e) {
                    this.log('User data is not valid JSON, clearing it');
                    localStorage.removeItem('fitzone_user');
                    localStorage.removeItem('fitzone_token');
                }
            }
        },
        
        // Track page visits to detect loops
        trackPageVisit: function() {
            const currentPage = window.location.pathname.split('/').pop();
            const visitLog = JSON.parse(localStorage.getItem('auth_page_visits') || '[]');
            
            // Add current page to the log
            visitLog.push({
                page: currentPage,
                time: Date.now(),
                params: window.location.search
            });
            
            // Keep only last 10 visits
            if (visitLog.length > 10) {
                visitLog.shift();
            }
            
            localStorage.setItem('auth_page_visits', JSON.stringify(visitLog));
        },
        
        // Apply checkout page fix
        applyCheckoutFix: function() {
            // Add this code immediately to the page
            const script = document.createElement('script');
            script.textContent = `
                // Direct auth check without waiting for other scripts
                (function() {
                    console.log('Running direct auth check on checkout page');
                    
                    // Check auth directly from localStorage
                    function isAuthenticated() {
                        const token = localStorage.getItem('fitzone_token');
                        const userStr = localStorage.getItem('fitzone_user');
                        
                        if (!token || !userStr) {
                            console.log('Direct check: Missing token or user data');
                            return false;
                        }
                        
                        try {
                            const user = JSON.parse(userStr);
                            return !!user && !!user.id_utilisateur;
                        } catch (e) {
                            console.log('Direct check: Invalid user data', e);
                            return false;
                        }
                    }
                    
                    // Handle auth check result
                    if (!isAuthenticated()) {
                        console.log('Not authenticated, redirecting to login');
                        // Use forward slash to explicitly get the root URL
                        window.location.href = 'login.html?redirect=checkout.html&direct=true';
                    } else {
                        console.log('Authentication confirmed via direct check');
                        // Reset redirect counter on successful auth
                        localStorage.removeItem('auth_redirect_count');
                    }
                })();
            `;
            
            // Add script to page immediately
            document.head.appendChild(script);
        },
        
        // Apply login page fix
        applyLoginFix: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'index.html';
            
            // If we have valid auth data, redirect immediately
            if (this.checkAuthStorage()) {
                this.log(`Already logged in, redirecting to: ${redirectUrl}`);
                window.location.href = redirectUrl;
            }
        },
        
        // Display debug info in console
        showDebugInfo: function() {
            console.group('AuthDebugger Info');
            
            // Auth state
            console.log('Is authenticated (direct check):', this.checkAuthStorage());
            if (typeof FitZoneAuth !== 'undefined') {
                console.log('Is authenticated (FitZoneAuth):', FitZoneAuth.isLoggedIn());
            } else {
                console.log('FitZoneAuth not loaded');
            }
            
            // Local storage data
            console.log('Token:', localStorage.getItem('fitzone_token') ? 'exists' : 'missing');
            console.log('User data:', localStorage.getItem('fitzone_user') ? 'exists' : 'missing');
            
            // Visit history
            const visitLog = JSON.parse(localStorage.getItem('auth_page_visits') || '[]');
            console.log('Recent page visits:', visitLog);
            
            // URL parameters
            console.log('Current URL parameters:', window.location.search);
            
            console.groupEnd();
        }
    };
    
    // Auto-initialize
    window.AuthDebugger.init();
    
    // Show debug info in console
    setTimeout(() => {
        window.AuthDebugger.showDebugInfo();
    }, 500);
})();
