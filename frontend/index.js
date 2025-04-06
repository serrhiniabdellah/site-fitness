const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if(bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if(close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

// Search functionality
function toggleSearchBar() {
    const searchContainer = document.getElementById('search-container');
    searchContainer.classList.toggle('active');
}

// Handle search input
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchButton = document.getElementById('search-button');

    if(searchInput && searchResults && searchButton) {
        searchInput.addEventListener('input', function() {
            if(this.value.length > 2) {
                // Here we would normally fetch results from the backend
                // For now, we'll just show some sample results
                showSampleResults();
                searchResults.classList.add('show');
            } else {
                searchResults.classList.remove('show');
            }
        });

        searchButton.addEventListener('click', function() {
            if(searchInput.value.length > 2) {
                // Here we would process the search
                console.log('Search for:', searchInput.value);
                // For demo, show sample results
                showSampleResults();
                searchResults.classList.add('show');
            }
        });
    }
});

function showSampleResults() {
    const searchResults = document.getElementById('search-results');
    if(!searchResults) return;
    
    // This is just for demonstration
    searchResults.innerHTML = `
        <div class="search-item">
            <img src="img/products/pro1.jpeg" alt="Protein">
            <div class="search-item-details">
                <div class="search-item-name">Gold Standard Whey Protein - Chocolate</div>
                <div class="search-item-category">Proteins</div>
                <div class="search-item-price">$59.99</div>
            </div>
        </div>
        <div class="search-item">
            <img src="img/products/massgainer.webp" alt="Mass Gainer">
            <div class="search-item-details">
                <div class="search-item-name">Serious Mass Gainer - 5kg Chocolate</div>
                <div class="search-item-category">Mass Gainers</div>
                <div class="search-item-price">$79.99</div>
            </div>
        </div>
    `;
}
