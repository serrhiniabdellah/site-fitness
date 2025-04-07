/**
 * Consistently adds the required CSP and head elements across all pages
 * To use: include this script at the top of the <head> in each HTML page
 */

// Helper function to insert CSP meta tag if not present
function ensureCSPHeaders() {
    // Check if CSP meta tag already exists
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        cspMeta.setAttribute('content', 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://pro.fontawesome.com https://unpkg.com; " +
            "style-src 'self' 'unsafe-inline' https://pro.fontawesome.com https://unpkg.com https://fonts.googleapis.com; " +
            "font-src 'self' https://pro.fontawesome.com https://unpkg.com https://fonts.gstatic.com; " +
            "img-src 'self' data:; " +
            "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* ws://localhost:* wss://localhost:*;"
        );
        
        // Insert as first element in head
        const head = document.head || document.getElementsByTagName('head')[0];
        head.insertBefore(cspMeta, head.firstChild);
    }
}

// Call the function to ensure CSP is applied
ensureCSPHeaders();
