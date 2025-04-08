/**
 * Pre-authentication check script
 * This runs before any other scripts to validate auth status and prevent redirect loops
 */
(function() {
    // Check for redirect loop
    const redirectCount = parseInt(localStorage.getItem('checkout_redirect_count') || '0');
    
    // If we've tried redirecting too many times, stop the loop
    if (redirectCount >= 2) {
        console.error('Redirect loop detected - breaking the cycle');
        localStorage.removeItem('checkout_redirect_count');
        
        // Display error message if this is checkout page
        if (window.location.pathname.endsWith('checkout.html')) {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.innerHTML = `
                    <div style="text-align:center; padding:50px; max-width:600px; margin:40px auto; background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color:#dc3545;">Authentication Error</h2>
                        <p>We're experiencing an issue with your login session. Please try these steps:</p>
                        <ol style="text-align:left; margin:20px auto; max-width:400px;">
                            <li>Clear your browser data (cookies & local storage)</li>
                            <li>Log in again at the <a href="login.html">login page</a></li>
                            <li>If the problem persists, try using a different browser</li>
                        </ol>
                        <div style="margin-top:20px;">
                            <a href="index.html" style="display:inline-block; padding:10px 20px; background:#088178; color:white; text-decoration:none; border-radius:4px;">
                                Return to Home
                            </a>
                        </div>
                    </div>
                `;
            });
        }
        return;
    }
    
    // Only run this check on checkout page
    if (!window.location.pathname.endsWith('checkout.html')) {
        return;
    }
    
    // Simple auth check using localStorage directly
    const hasToken = !!localStorage.getItem('fitzone_token');
    const hasUser = !!localStorage.getItem('fitzone_user');
    const isAuthenticated = hasToken && hasUser;
    
    console.log('Early auth check:', {hasToken, hasUser, isAuthenticated});
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        // Increment the redirect counter
        localStorage.setItem('checkout_redirect_count', (redirectCount + 1).toString());
        
        // Redirect to login
        console.log('Not authenticated, redirecting to login');
        window.location.replace('login.html?redirect=checkout.html&src=pre-check');
    } else {
        // Reset counter on success
        localStorage.removeItem('checkout_redirect_count');
    }
})();
