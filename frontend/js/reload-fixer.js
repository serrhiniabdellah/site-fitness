/**
 * Reload Fixer
 * Fixes WebSocket URL issues in reload.js and other livereload scripts
 */
(function() {
    console.log('Reload fixer initialized');
    
    // Patch Chrome extension WebSocket errors
    window.addEventListener('error', function(event) {
        // Check if it's a WebSocket URL error
        if (event.message && event.message.includes("Failed to construct 'WebSocket'") &&
            event.message.includes("URL's scheme must be")) {
            
            console.log('Intercepted WebSocket error:', event.message);
            event.preventDefault();
            
            // Extract the malformed URL from error
            const urlMatch = event.message.match(/'([^']+)'/);
            if (urlMatch && urlMatch[1]) {
                let badUrl = urlMatch[1];
                
                // Fix the URL
                let fixedUrl = badUrl;
                if (badUrl.startsWith('ws') && !badUrl.includes('://')) {
                    if (badUrl.match(/^ws[0-9]/)) {
                        fixedUrl = badUrl.replace(/^ws/, 'ws://');
                    } else {
                        fixedUrl = 'ws://' + badUrl.substring(2);
                    }
                    
                    console.log(`URL fixed: ${badUrl} → ${fixedUrl}`);
                    
                    // Try to reconnect with fixed URL
                    try {
                        const socket = new WebSocket(fixedUrl);
                        console.log('Successfully created WebSocket with fixed URL');
                        return true;
                    } catch (e) {
                        console.error('Still failed to create WebSocket:', e);
                    }
                }
            }
        }
    }, true);
})();
