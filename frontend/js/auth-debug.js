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
