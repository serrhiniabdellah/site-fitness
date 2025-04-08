/**
 * Improved Script Loader
 * Ensures scripts are loaded in the correct order with proper dependencies
 */
(function() {
    console.log('Script loader initializing');
    
    // Add a way to track script loading status
    window.ScriptStatus = {};
    
    // List of scripts to load in order with correct paths
    const scripts = [
        { name: 'config', src: 'js/config.js', loaded: false },
        { name: 'auth', src: 'js/auth.js', depends: ['config'], loaded: false },
        { name: 'cart-service', src: 'js/cart-service.js', depends: ['config'], loaded: false },
        { name: 'global-cart', src: 'js/global-cart.js', depends: ['config', 'cart-service'], loaded: false }
    ];

    // Load a script with better error handling
    function loadScript(script) {
        return new Promise((resolve, reject) => {
            console.log(`Attempting to load script: ${script.name}`);
            
            // Check if all dependencies are loaded
            if (script.depends && script.depends.length > 0) {
                const unloadedDependencies = script.depends.filter(dep => !window.ScriptStatus[dep]);
                if (unloadedDependencies.length > 0) {
                    console.log(`Waiting for dependencies: ${unloadedDependencies.join(', ')}`);
                    
                    // Load dependencies first
                    Promise.all(unloadedDependencies.map(depName => {
                        const depScript = scripts.find(s => s.name === depName);
                        return depScript ? loadScript(depScript) : Promise.resolve();
                    }))
                    .then(() => loadScript(script))
                    .then(resolve)
                    .catch(reject);
                    return;
                }
            }
            
            // Skip if script is already loaded
            if (window.ScriptStatus[script.name]) {
                console.log(`Script ${script.name} already loaded`);
                resolve();
                return;
            }
            
            // Check if script element already exists on page
            const existingScript = document.querySelector(`script[src="${script.src}"]`);
            if (existingScript) {
                console.log(`Script ${script.name} found in DOM`);
                window.ScriptStatus[script.name] = true;
                resolve();
                return;
            }
            
            // Create and load the script
            console.log(`Loading script: ${script.name} from ${script.src}`);
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.onload = () => {
                window.ScriptStatus[script.name] = true;
                console.log(`Script loaded successfully: ${script.name}`);
                resolve();
            };
            scriptElement.onerror = (err) => {
                console.error(`Failed to load ${script.name}:`, err);
                reject(err);
            };
            document.head.appendChild(scriptElement);
        });
    }
    
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
        const allLoaded = scripts.every(script => window.ScriptStatus[script.name]);
        console.log('All scripts loaded:', allLoaded);
        
        if (allLoaded) {
            document.dispatchEvent(new CustomEvent('scripts:loaded'));
        }
    }
    
    // Start loading scripts
    loadAllScripts();
})();
