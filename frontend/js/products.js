/**
 * Products Module
 * 
 * Handles product-related functionality on the frontend
 */

const FitZoneProducts = (function() {
    // Use the API_BASE_URL from config.js
    
    // Load products from API
    async function loadProducts() {
        try {
            const response = await makeApiCall('/products');
            
            if (response.success) {
                displayProducts(response.data);
            } else {
                showError('Failed to load products.');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            showError(CONFIG.DEFAULT_ERROR_MESSAGE);
        }
    }
    
    // Display products in the UI
    function displayProducts(products) {
        const productsContainer = document.getElementById('products-container');
        
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }
        
        // Clear existing content
        productsContainer.innerHTML = '';
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p>No products available.</p>';
            return;
        }
        
        // Create product cards
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
        });
    }
    
    // Create a product card element
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        
        card.innerHTML = `
            <img src="${CONFIG.UPLOAD_URL}/products/${product.image}" alt="${product.nom}">
            <h3>${product.nom}</h3>
            <p class="price">${product.prix} €</p>
            <p class="description">${product.description}</p>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        `;
        
        // Add event listener to Add to Cart button
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            addToCart(product.id);
        });
        
        return card;
    }
    
    // Add a product to the cart
    async function addToCart(productId) {
        try {
            // Add product to cart implementation
            // ...
        } catch (error) {
            console.error('Error adding product to cart:', error);
            showError(CONFIG.DEFAULT_ERROR_MESSAGE);
        }
    }
    
    // Show an error message
    function showError(message) {
        // Error display implementation
        // ...
    }
    
    // Public API
    return {
        init: function() {
            loadProducts();
            // Add other initialization code as needed
        }
    };
})();

// Initialize products on page load
document.addEventListener('DOMContentLoaded', function() {
    FitZoneProducts.init();
});
