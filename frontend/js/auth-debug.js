/**
 * Auth Debug Tool
 * Helps diagnose authentication state issues across pages
 */
(function() {
    // Only run in debug mode
    if (!window.CONFIG || !window.CONFIG.DEBUG_MODE) return;
    
    console.log('Auth Debug Tool initialized');
    
    // Create debug panel
    function createDebugPanel() {
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div id="auth-debug" style="position:fixed; bottom:10px; right:10px; background:rgba(0,0,0,0.8); color:white; padding:10px; border-radius:5px; font-size:12px; z-index:9999; max-width:300px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>Auth Debug</strong>
                    <span id="auth-debug-close" style="cursor:pointer;">×</span>
                </div>
                <div id="auth-debug-content" style="max-height:200px; overflow-y:auto;">
                    <div>Logged in: <span id="auth-debug-status">Checking...</span></div>
                    <div>Token: <span id="auth-debug-token">Checking...</span></div>
                    <div>User: <span id="auth-debug-user">Checking...</span></div>
                    <div>Last refresh: <span id="auth-debug-timestamp">Checking...</span></div>
                </div>
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <button id="auth-debug-refresh" style="padding:3px 8px; background:#088178; color:white; border:none; border-radius:3px; cursor:pointer;">Refresh</button>
                    <button id="auth-debug-fix" style="padding:3px 8px; background:#2980b9; color:white; border:none; border-radius:3px; cursor:pointer;">Fix Auth</button>
                    <button id="auth-debug-clear" style="padding:3px 8px; background:#e74c3c; color:white; border:none; border-radius:3px; cursor:pointer;">Clear Auth</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('auth-debug-close').addEventListener('click', function() {
            document.getElementById('auth-debug').style.display = 'none';
        });
        
        document.getElementById('auth-debug-refresh').addEventListener('click', updateDebugInfo);
        
        document.getElementById('auth-debug-fix').addEventListener('click', function() {
            // Try to fix common auth issues
            const user = localStorage.getItem('fitzone_user');
            const token = localStorage.getItem('fitzone_token');
            
            if (user && token) {
                // Force refresh auth state
                if (typeof FitZoneAuth !== 'undefined') {
                    FitZoneAuth.refreshAuthState();
                    document.body.classList.add('logged-in');
                    updateDebugInfo();
                    alert('Auth state refreshed!');
                }
            } else {
                alert('No auth data to fix. Try logging in again.');
            }
        });
        
        document.getElementById('auth-debug-clear').addEventListener('click', function() {
            localStorage.removeItem('fitzone_user');
            localStorage.removeItem('fitzone_token');
            localStorage.removeItem('fitzone_login_timestamp');
            
            if (typeof FitZoneAuth !== 'undefined') {
                FitZoneAuth.refreshAuthState();
            }
            
            document.body.classList.remove('logged-in');
            updateDebugInfo();
            alert('Auth data cleared!');
        });
    }
    
    // Update debug info
    function updateDebugInfo() {
        // Check if auth module is available
        if (typeof FitZoneAuth === 'undefined') {
            document.getElementById('auth-debug-status').textContent = 'ERROR: Auth module not loaded';
            document.getElementById('auth-debug-token').textContent = 'N/A';
            document.getElementById('auth-debug-user').textContent = 'N/A';
            document.getElementById('auth-debug-timestamp').textContent = 'N/A';
            return;
        }
        
        // Get auth state
        const isLoggedIn = FitZoneAuth.isLoggedIn();
        const token = FitZoneAuth.getToken();
        const user = FitZoneAuth.getCurrentUser();
        const timestamp = localStorage.getItem('fitzone_login_timestamp');
        
        // Update panel
        document.getElementById('auth-debug-status').textContent = isLoggedIn ? 'Yes' : 'No';
        document.getElementById('auth-debug-status').style.color = isLoggedIn ? '#2ecc71' : '#e74c3c';
        
        document.getElementById('auth-debug-token').textContent = token ? `${token.substring(0, 8)}...` : 'None';
        document.getElementById('auth-debug-token').style.color = token ? '#2ecc71' : '#e74c3c';
        
        document.getElementById('auth-debug-user').textContent = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'None';
        document.getElementById('auth-debug-user').style.color = user ? '#2ecc71' : '#e74c3c';
        
        if (timestamp) {
            const date = new Date(parseInt(timestamp));
            document.getElementById('auth-debug-timestamp').textContent = date.toLocaleString();
        } else {
            document.getElementById('auth-debug-timestamp').textContent = 'Never';
            document.getElementById('auth-debug-timestamp').style.color = '#e74c3c';
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        createDebugPanel();
        updateDebugInfo();
        
        // Update when auth state changes
        window.addEventListener('user:login', updateDebugInfo);
        window.addEventListener('user:logout', updateDebugInfo);
        document.addEventListener('auth:storageChange', updateDebugInfo);
    });
})();

/**
 * Auth debugging tool to help troubleshoot authentication issues
 */
(function() {
    // Create a global debug object
    window.AuthDebug = {
        /**
         * Check authentication state and log details
         */
        checkState: function() {
            console.group('Auth State Check');
            
            // Check localStorage data
            const token = localStorage.getItem('fitzone_token');
            const userData = localStorage.getItem('fitzone_user');
            const timestamp = localStorage.getItem('fitzone_login_timestamp');
            
            console.log('Token exists:', !!token);
            console.log('User data exists:', !!userData);
            console.log('Timestamp exists:', !!timestamp);
            
            if (token) {
                console.log('Token length:', token.length);
                console.log('Token preview:', token.substring(0, 10) + '...');
            }
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    console.log('User data valid JSON:', true);
                    console.log('User ID:', user.id_utilisateur);
                    console.log('User email:', user.email);
                    console.log('User name:', user.prenom + ' ' + user.nom);
                } catch (e) {
                    console.error('User data is not valid JSON:', e);
                }
            }
            
            if (timestamp) {
                const loginTime = new Date(parseInt(timestamp));
                const now = new Date();
                const elapsedMs = now.getTime() - loginTime.getTime();
                const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
                
                console.log('Login time:', loginTime.toLocaleString());
                console.log('Current time:', now.toLocaleString());
                console.log('Minutes since login:', elapsedMinutes);
            }
            
            // Check if FitZoneAuth is loaded
            if (typeof FitZoneAuth !== 'undefined') {
                console.log('FitZoneAuth is loaded');
                console.log('isLoggedIn() returns:', FitZoneAuth.isLoggedIn());
            } else {
                console.warn('FitZoneAuth is not loaded');
            }
            
            console.log('URL parameters:', window.location.search);
            console.log('Current URL:', window.location.href);
            
            console.groupEnd();
        },
        
        /**
         * Clear auth data and reset redirects
         */
        reset: function() {
            localStorage.removeItem('fitzone_token');
            localStorage.removeItem('fitzone_user');
            localStorage.removeItem('fitzone_login_timestamp');
            localStorage.removeItem('redirect_count');
            console.log('Auth state reset complete');
        },
        
        /**
         * Force inject auth data (for testing)
         */
        mockLogin: function(userData = {}) {
            const mockUser = {
                id_utilisateur: 999,
                email: 'test@example.com',
                prenom: 'Test',
                nom: 'User',
                ...userData
            };
            
            localStorage.setItem('fitzone_token', 'mock_token_for_testing');
            localStorage.setItem('fitzone_user', JSON.stringify(mockUser));
            localStorage.setItem('fitzone_login_timestamp', Date.now().toString());
            console.log('Mock login data injected');
        }
    };
    
    // Auto-run check if URL includes auth-debug=true
    if (window.location.search.includes('auth-debug=true')) {
        setTimeout(window.AuthDebug.checkState, 500);
    }
})();
