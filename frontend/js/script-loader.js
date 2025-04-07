/**
 * Script Loader
 * Ensures scripts are loaded in the correct order with proper dependencies
 */
(function() {
    // Add a way to track script loading status
    window.ScriptStatus = {};
    
    // List of scripts to load in order with correct paths
    const scripts = [
        { name: 'config', src: 'js/config.js', loaded: false },
        { name: 'auth', src: 'js/auth.js', depends: ['config'], loaded: false },
        { name: 'cart-service', src: 'js/cart-service.js', depends: ['config'], loaded: false },
        { name: 'global-cart', src: 'js/global-cart.js', depends: ['config', 'cart-service'], loaded: false }
    ];

    // Load a script
    function loadScript(script) {
        return new Promise((resolve, reject) => {
            // Check if all dependencies are loaded
            if (script.depends && script.depends.length > 0) {
                for (const dependency of script.depends) {
                    if (!window.ScriptStatus[dependency]) {
                        // Find the dependency in the scripts array
                        const dependencyScript = scripts.find(s => s.name === dependency);
                        if (dependencyScript) {
                            // Load the dependency first, then retry this script
                            loadScript(dependencyScript)
                                .then(() => loadScript(script))
                                .then(resolve)
                                .catch(reject);
                            return;
                        }
                    }
                }
            }
            
            // Skip if script is already loaded
            if (window.ScriptStatus[script.name]) {
                resolve();
                return;
            }
            
            // Check if script element already exists on page
            const existingScript = document.querySelector(`script[src="${script.src}"]`);
            if (existingScript) {
                window.ScriptStatus[script.name] = true;
                resolve();
                return;
            }
            
            // Create and load the script
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.onload = () => {
                window.ScriptStatus[script.name] = true;
                console.log(`Script loaded: ${script.name}`);
                resolve();
            };
            scriptElement.onerror = (err) => {
                console.error(`Failed to load ${script.name}:`, err);
                reject(err);
            };
            document.head.appendChild(scriptElement);
        });
    }
    
    // Wait for scripts to be loaded (improved version)
    window.waitForScripts = function(scriptNames, callback) {
        const allReady = () => scriptNames.every(name => window.ScriptStatus[name]);
        
        if (allReady()) {
            callback();
            return;
        }
        
        const checkInterval = setInterval(() => {
            if (allReady()) {
                clearInterval(checkInterval);
                callback();
            }
        }, 100);
    };
    
    // Load all scripts in order
    async function loadAllScripts() {
        for (const script of scripts) {
            try {
                await loadScript(script);
            } catch (error) {
                console.error(`Failed to load ${script.name}:`, error);
            }
        }
        
        // Dispatch event when all scripts are loaded
        document.dispatchEvent(new CustomEvent('scripts:loaded'));
    }
    
    // Start loading scripts
    loadAllScripts();
})();
