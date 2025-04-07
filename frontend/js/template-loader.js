/**
 * Template Loader
 * Loads HTML templates dynamically to ensure consistency across pages
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        loadTemplates();
    });
    
    /**
     * Load all templates marked with data-template attribute
     */
    async function loadTemplates() {
        const templateElements = document.querySelectorAll('[data-template]');
        
        if (templateElements.length === 0) return;
        
        for (const element of templateElements) {
            const templatePath = element.getAttribute('data-template');
            await loadTemplate(element, templatePath);
        }
    }
    
    /**
     * Load single template into element
     */
    async function loadTemplate(element, templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error(`Failed to load template: ${response.status}`);
            
            const html = await response.text();
            element.innerHTML = html;
            
            // Execute any scripts in the template
            const scripts = element.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                script.parentNode.replaceChild(newScript, script);
            });
            
            return true;
        } catch (error) {
            console.error('Error loading template:', error);
            return false;
        }
    }
})();
