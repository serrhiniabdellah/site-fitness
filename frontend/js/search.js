/**
 * FitZone Search Functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const searchContainer = document.getElementById('search-container');

    // Add event listeners
    if (searchInput && searchButton) {
        // Search when button is clicked
        searchButton.addEventListener('click', function() {
            performSearch(searchInput.value);
        });

        // Search when Enter key is pressed
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });

        // Live search as user types (with debounce)
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            if (searchInput.value.length >= 2) {
                debounceTimer = setTimeout(function() {
                    performSearch(searchInput.value);
                }, 500); // Wait 500ms after user stops typing
            } else {
                searchResults.innerHTML = '';
                hideSearchResults();
            }
        });

        // Hide search results when clicking outside
        document.addEventListener('click', function(event) {
            if (!searchContainer.contains(event.target)) {
                hideSearchResults();
            }
        });
    }

    /**
     * Perform search and display results
     * @param {string} query - Search query
     */
    function performSearch(query) {
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Don't search if query is too short
        if (!query || query.length < 2) {
            hideSearchResults();
            return;
        }

        // Show loading indicator
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        showSearchResults();

        // Get API URL from config or use default
        const apiUrl = (window.CONFIG && window.CONFIG.API_URL) 
            ? window.CONFIG.API_URL 
            : 'http://localhost/site_fitness/backend/api';

        // Make API request
        fetch(`${apiUrl}/products/search.php?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                displaySearchResults(data, query);
            })
            .catch(error => {
                searchResults.innerHTML = `
                    <div class="search-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error searching products</p>
                    </div>
                `;
                console.error('Search error:', error);
            });
    }

    /**
     * Display search results
     * @param {Object} data - API response data
     * @param {string} query - Search query
     */
    function displaySearchResults(data, query) {
        // Clear previous results
        searchResults.innerHTML = '';
        
        if (data.success && data.data && data.data.products) {
            const products = data.data.products;
            
            if (products.length === 0) {
                searchResults.innerHTML = `
                    <div class="no-results">
                        <p>No products found for "${query}"</p>
                    </div>
                `;
                return;
            }

            // Create result list
            const resultList = document.createElement('ul');
            resultList.className = 'search-results-list';

            // Add each product to results
            products.forEach(product => {
                const listItem = document.createElement('li');
                listItem.className = 'search-result-item';

                // Format price
                const formattedPrice = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(product.price);

                // Create HTML for result item
                listItem.innerHTML = `
                    <a href="${product.url}" class="search-result-link">
                        <div class="search-result-image">
                            <img src="${product.image || 'img/products/default.jpg'}" alt="${product.name}">
                        </div>
                        <div class="search-result-details">
                            <h4 class="search-result-name">${product.name}</h4>
                            <p class="search-result-category">${product.category || 'Product'}</p>
                            <p class="search-result-price">${formattedPrice}</p>
                        </div>
                    </a>
                `;

                resultList.appendChild(listItem);
            });

            // Add view all results link
            const viewAllItem = document.createElement('li');
            viewAllItem.className = 'search-view-all';
            viewAllItem.innerHTML = `
                <a href="shop.html?search=${encodeURIComponent(query)}">
                    View all results for "${query}" <i class="fas fa-arrow-right"></i>
                </a>
            `;
            resultList.appendChild(viewAllItem);

            // Add results to container
            searchResults.appendChild(resultList);
            showSearchResults();
        } else {
            searchResults.innerHTML = `
                <div class="search-error">
                    <p>Error retrieving search results</p>
                </div>
            `;
        }
    }

    /**
     * Show search results container
     */
    function showSearchResults() {
        searchResults.style.display = 'block';
    }

    /**
     * Hide search results container
     */
    function hideSearchResults() {
        searchResults.style.display = 'none';
    }

    /**
     * Toggle search bar on mobile
     */
    window.toggleSearchBar = function() {
        if (searchContainer) {
            const isVisible = searchContainer.style.display === 'flex';
            searchContainer.style.display = isVisible ? 'none' : 'flex';
            
            if (!isVisible) {
                // Focus the search input when opening
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }
        }
    };
});