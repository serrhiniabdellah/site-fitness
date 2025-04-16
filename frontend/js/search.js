/**
 * FitZone Search Functionality
 * Enables product search across all pages with enhanced UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Global products data
    let allProducts = [];
    
    // Get product data if available
    if (typeof window.allProducts !== 'undefined') {
        allProducts = window.allProducts;
    } else if (typeof getAllProducts === 'function') {
        allProducts = getAllProducts();
    } else {
        // Default fallback products
        allProducts = [
            { id: '1', name: 'Whey Protein Premium', category: 'Protein', price: 49.99, image: 'img/products/img7.png' },
            { id: '2', name: 'Mass Gainer 5000', category: 'Mass Gainers', price: 59.99, image: 'img/products/MASS3.avif' },
            { id: 'equip1', name: 'Pro Resistance Bands Set - 5 Levels', category: 'Equipment', price: 29.99, image: 'img/products/img6.png' },
            { id: 'protein2', name: 'Ultra Pure Protein Isolate - Vanilla', category: 'Protein', price: 64.99, image: 'img/products/images1.jpg' }
        ];
        
        // Attempt to load products from JSON
        fetch('products.json')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    allProducts = data;
                    window.allProducts = data;
                    console.log('Products loaded:', allProducts.length);
                }
            })
            .catch(error => console.log('Products JSON not available, using defaults'));
    }
    
    // Select all search elements 
    const searchForms = document.querySelectorAll('#search-form, .search-form');
    const searchInputs = document.querySelectorAll('#search-input, .search-input');
    const searchResults = document.querySelectorAll('#search-results, .search-results');
    
    // Mobile search toggle functionality
    const mobileSearchIcon = document.querySelector('#mobile .fa-search');
    const searchContainer = document.getElementById('search-container');
    
    if (mobileSearchIcon && searchContainer) {
        window.toggleSearchBar = function() {
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                const mobileInput = searchContainer.querySelector('input');
                if (mobileInput) {
                    setTimeout(() => mobileInput.focus(), 300);
                }
            }
        };
        
        mobileSearchIcon.addEventListener('click', toggleSearchBar);
        
        // Close search when clicking outside
        document.addEventListener('click', function(e) {
            if (searchContainer.classList.contains('active') && 
                !searchContainer.contains(e.target) && 
                e.target !== mobileSearchIcon) {
                searchContainer.classList.remove('active');
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
                searchContainer.classList.remove('active');
            }
        });
    }
    
    // Initialize form submission handlers
    searchForms.forEach(form => {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = form.querySelector('input');
            const query = input?.value.trim() || '';
            
            if (query.length > 1) {
                // Redirect to shop page with search query
                window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
            }
        });
    });
    
    // Live search functionality for all search inputs
    searchInputs.forEach(input => {
        if (!input) return;
        
        // Find the related results container
        const container = input.closest('.search-container, #navbar, form');
        const resultsContainer = container?.querySelector('.search-results') || 
                                 container?.nextElementSibling;
        
        if (!resultsContainer) return;
        
        // Add input event with debouncing
        input.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.classList.remove('active');
                return;
            }
            
            // Show loading indicator
            resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
            resultsContainer.classList.add('active');
            
            // Filter products based on search query
            const matchedProducts = searchProducts(query, allProducts);
            
            // Short delay to simulate network request
            setTimeout(() => {
                displaySearchResults(matchedProducts, query, resultsContainer);
            }, 300);
        }, 300));
        
        // Focus event to show previous results
        input.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query.length >= 2 && resultsContainer.innerHTML) {
                resultsContainer.classList.add('active');
            }
        });
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#search-input, .search-input, #search-results, .search-results')) {
            document.querySelectorAll('.search-results').forEach(container => {
                container.classList.remove('active');
            });
        }
    });
    
    // Search products function
    window.searchProducts = function(query, products) {
        if (!query || !products || !products.length) return [];
        
        query = query.toLowerCase();
        
        return products.filter(product => {
            // Check if properties exist before searching
            const name = product.name?.toLowerCase() || '';
            const description = product.description?.toLowerCase() || '';
            const category = product.category?.toLowerCase() || '';
            
            return name.includes(query) || 
                   description.includes(query) || 
                   category.includes(query);
        });
    };
    
    // Display search results
    function displaySearchResults(products, query, resultsContainer) {
        if (!resultsContainer) return;
        
        if (products.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    No products found matching "${query}"
                </div>
            `;
            return;
        }
        
        // Create search results HTML
        let html = '<div class="search-results-list">';
        
        // Show up to 5 products
        const displayProducts = products.slice(0, 5);
        
        displayProducts.forEach(product => {
            const price = product.price ? parseFloat(product.price).toFixed(2) : '0.00';
            
            html += `
                <div class="search-result-item">
                    <a href="sproduct.html?id=${product.id}">
                        <div class="search-result-image">
                            <img src="${product.image || 'img/products/default.png'}" alt="${product.name}">
                        </div>
                        <div class="search-result-info">
                            <div class="search-result-title">${highlightMatch(product.name, query)}</div>
                            <div class="category">${product.category || 'Product'}</div>
                            <div class="price">$${price}</div>
                        </div>
                    </a>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add "View all" link if there are more results
        if (products.length > 5) {
            html += `
                <div class="search-view-all">
                    <a href="shop.html?search=${encodeURIComponent(query)}">
                        View all ${products.length} results
                    </a>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = html;
    }
    
    // Highlight matched text
    function highlightMatch(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Helper function to escape regex special characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Debounce function to limit rapid input
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Handle shop page URL parameters
    if (window.location.pathname.includes('shop.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery) {
            // Set search input values
            searchInputs.forEach(input => {
                if (input) input.value = searchQuery;
            });
            
            // Add search notice at the top of the page
            const productListContainer = document.querySelector('#product1');
            if (productListContainer) {
                const searchNotice = document.createElement('div');
                searchNotice.className = 'search-notice';
                searchNotice.innerHTML = `
                    <div class="search-notice-content">
                        <p>Showing results for: <strong>${searchQuery}</strong></p>
                    </div>
                    <button id="clear-search">Clear Search</button>
                `;
                
                productListContainer.insertBefore(searchNotice, productListContainer.firstChild);
                
                // Clear search button functionality
                document.getElementById('clear-search')?.addEventListener('click', function() {
                    window.location.href = 'shop.html';
                });
            }
        }
    }
});