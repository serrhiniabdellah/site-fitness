/**
 * FitZone Search Functionality
 * Enables product search across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all search elements (desktop and mobile)
    const searchForms = document.querySelectorAll('#search-form');
    const searchInputs = document.querySelectorAll('#search-input');
    const searchResults = document.querySelectorAll('#search-results');
    const searchButtons = document.querySelectorAll('#search-button');
    
    // Mobile search toggle functionality
    const mobileSearchIcon = document.querySelector('#mobile .fa-search');
    const searchContainer = document.getElementById('search-container');
    
    if (mobileSearchIcon && searchContainer) {
        window.toggleSearchBar = function() {
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                searchContainer.querySelector('input').focus();
            }
        };
        
        mobileSearchIcon.addEventListener('click', toggleSearchBar);
        
        // Close search when clicking outside
        document.addEventListener('click', function(e) {
            if (searchContainer && searchContainer.classList.contains('active') && 
                !searchContainer.contains(e.target) && e.target !== mobileSearchIcon) {
                searchContainer.classList.remove('active');
            }
        });
    }
    
    // Initialize search functionality for all search forms
    searchForms.forEach((form, index) => {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = searchInputs[index];
            if (!searchInput) return;
            
            const query = searchInput.value.trim();
            if (query.length > 1) {
                // Redirect to shop page with search query
                window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
            }
        });
    });
    
    // Live search functionality 
    searchInputs.forEach((input, index) => {
        if (!input) return;
        
        input.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            const resultsContainer = searchResults[index];
            
            if (!resultsContainer) return;
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }
            
            // Get products (either from global variable or from function)
            let products = [];
            if (typeof getAllProducts === 'function') {
                products = getAllProducts();
            } else if (window.allProducts && Array.isArray(window.allProducts)) {
                products = window.allProducts;
            } else {
                // Default products if no source is available
                products = [
                    { id: '1', name: 'Whey Protein Premium', category: 'Protein', price: 49.99, image: 'img/products/img7.png' },
                    { id: '2', name: 'Mass Gainer 5000', category: 'Mass Gainers', price: 59.99, image: 'img/products/MASS3.avif' },
                    { id: 'equip1', name: 'Pro Resistance Bands Set - 5 Levels', category: 'Equipment', price: 29.99, image: 'img/products/img6.png' },
                    { id: 'protein2', name: 'Ultra Pure Protein Isolate - Vanilla', category: 'Protein', price: 64.99, image: 'img/products/images1.jpg' }
                ];
            }
            
            // Filter products based on search query
            const matchedProducts = searchProducts(query, products);
            
            // Display results
            displaySearchResults(matchedProducts, query, resultsContainer);
        }, 300));
        
        // Close results when clicking outside
        document.addEventListener('click', function(e) {
            const resultsContainer = searchResults[index];
            if (resultsContainer && !resultsContainer.contains(e.target) && e.target !== input) {
                resultsContainer.style.display = 'none';
            }
        });
        
        // Focus on search input shows results again if there are any
        input.addEventListener('focus', function() {
            const resultsContainer = searchResults[index];
            if (resultsContainer && resultsContainer.innerHTML !== '') {
                resultsContainer.style.display = 'block';
            }
        });
    });
    
    // Helper function to search products
    window.searchProducts = function(query, productsToSearch) {
        // Default to global products if not provided
        const products = productsToSearch || (typeof getAllProducts === 'function' ? getAllProducts() : []);
        
        if (!products || products.length === 0) return [];
        
        query = query.toLowerCase();
        
        return products.filter(product => {
            // Check if the product properties exist before searching
            const name = product.name ? product.name.toLowerCase() : '';
            const description = product.description ? product.description.toLowerCase() : '';
            const category = product.category ? product.category.toLowerCase() : '';
            
            return name.includes(query) || 
                  description.includes(query) || 
                  category.includes(query);
        });
    }
    
    // Display search results in the dropdown
    function displaySearchResults(products, query, resultsContainer) {
        if (!resultsContainer) return;
        
        if (products.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No products found matching "${query}"</p>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }
        
        let html = '';
        
        // Limit to max 5 results in dropdown
        const displayProducts = products.slice(0, 5);
        
        displayProducts.forEach(product => {
            html += `
                <div class="search-result-item">
                    <a href="sproduct.html?id=${product.id}">
                        <div class="search-result-image">
                            <img src="${product.image || 'img/products/default.png'}" alt="${product.name}">
                        </div>
                        <div class="search-result-info">
                            <h4>${highlightMatch(product.name, query)}</h4>
                            <p class="category">${product.category || 'Product'}</p>
                            <p class="price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                        </div>
                    </a>
                </div>
            `;
        });
        
        // Add "See all results" link if there are more results
        if (products.length > 5) {
            html += `
                <div class="see-all-results">
                    <a href="shop.html?search=${encodeURIComponent(query)}">
                        See all ${products.length} results for "${query}"
                    </a>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }
    
    // Highlight matched text in search results
    function highlightMatch(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Helper function to escape special characters in regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // If we're on the shop page and there's a search parameter, run search
    if (window.location.pathname.includes('shop.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search')) {
            const searchQuery = urlParams.get('search');
            if (searchQuery && document.querySelector('#search-input')) {
                document.querySelector('#search-input').value = searchQuery;
            }
        }
    }
});

// Create CSS for search functionality
if (!document.getElementById('search-styles')) {
    const style = document.createElement('style');
    style.id = 'search-styles';
    style.textContent = `
        /* Search container */
        .search-container {
            position: relative;
        }
        
        #search-form {
            display: flex;
            align-items: center;
        }
        
        #search-input {
            padding: 8px 12px;
            border: 1px solid #e1e1e1;
            border-radius: 4px 0 0 4px;
            outline: none;
            min-width: 200px;
            font-size: 14px;
        }
        
        #search-button {
            background: #088178;
            color: white;
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 0 4px 4px 0;
            transition: background-color 0.3s;
        }
        
        #search-button:hover {
            background: #065f58;
        }
        
        /* Search results dropdown */
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            width: 350px;
            max-height: 400px;
            overflow-y: auto;
            background: white;
            border: 1px solid #e1e1e1;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 100;
            display: none;
        }
        
        .search-result-item {
            border-bottom: 1px solid #f1f1f1;
        }
        
        .search-result-item:last-child {
            border-bottom: none;
        }
        
        .search-result-item a {
            display: flex;
            padding: 12px;
            text-decoration: none;
            color: inherit;
            transition: background-color 0.2s;
        }
        
        .search-result-item a:hover {
            background-color: #f9f9f9;
        }
        
        .search-result-image {
            width: 60px;
            height: 60px;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .search-result-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .search-result-info {
            flex: 1;
        }
        
        .search-result-info h4 {
            margin: 0 0 5px;
            font-size: 14px;
            color: #1a1a1a;
        }
        
        .search-result-info .category {
            margin: 0 0 5px;
            font-size: 12px;
            color: #666;
        }
        
        .search-result-info .price {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #088178;
        }
        
        .see-all-results {
            padding: 12px;
            text-align: center;
            background: #f5f5f5;
        }
        
        .see-all-results a {
            color: #088178;
            text-decoration: none;
            font-weight: 500;
        }
        
        .see-all-results a:hover {
            text-decoration: underline;
        }
        
        .no-results {
            padding: 20px;
            text-align: center;
            color: #666;
        }
        
        mark {
            background-color: #fff3cd;
            padding: 0 3px;
        }
        
        /* Mobile search */
        #search-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 80px;
            z-index: 1001;
            visibility: hidden;
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        #search-container.active {
            visibility: visible;
            opacity: 1;
        }
        
        .search-wrapper {
            width: 80%;
            max-width: 600px;
            position: relative;
        }
        
        /* Media Queries */
        @media (max-width: 799px) {
            #search-input {
                min-width: 150px;
            }
            
            .search-results {
                width: 100%;
                left: 0;
            }
        }
        
        @media (max-width: 477px) {
            .search-container {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
}