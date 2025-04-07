document.addEventListener('DOMContentLoaded', function() {
    // Get the product ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        // No product ID found, redirect to shop page
        window.location.href = 'shop.html';
        return;
    }
    
    // Get the product details
    const product = getProductById(productId);
    
    if (!product) {
        // Product not found, show error or redirect
        document.querySelector('#prodetails').innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>Sorry, we couldn't find the product you're looking for.</p>
                <a href="shop.html" class="normal">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    // Update page title with product name
    document.title = `${product.name} - Fitness Supplements & Equipment`;
    
    // Update product image
    document.getElementById('MainImg').src = product.image;
    document.getElementById('MainImg').alt = product.name;
    
    // Update product category path
    document.getElementById('product-category').textContent = `Home / ${capitalizeFirstLetter(product.category)}`;
    
    // Update product name
    document.getElementById('product-name').textContent = product.name;
    
    // Update product price
    document.getElementById('product-price').textContent = `$${product.price}`;
    
    // Update product description
    document.getElementById('product-description').textContent = product.description;
    
    // Update product features
    const featuresList = document.getElementById('product-features');
    featuresList.innerHTML = '';
    product.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
    });
    
    // Load related products (products in the same category)
    const relatedProducts = getProductsByCategory(product.category).filter(p => p.id !== product.id);
    const relatedContainer = document.getElementById('related-products');
    
    // Display up to 4 related products
    const productsToShow = relatedProducts.slice(0, 4);
    let relatedHTML = '';
    productsToShow.forEach(relatedProduct => {
        relatedHTML += renderProductCard(relatedProduct);
    });
    relatedContainer.innerHTML = relatedHTML;
    
    // Add event listener to "Add To Cart" button
    document.querySelector('#prodetails button.normal').addEventListener('click', function() {
        const quantity = parseInt(document.querySelector('#prodetails input[type="number"]').value);
        addToCart(product.id, quantity);
        alert(`Added ${quantity} of ${product.name} to your cart!`);
    });
});

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to add product to cart (placeholder - to be implemented)
function addToCart(productId, quantity) {
    // Get current cart from localStorage or initialize empty cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        // Update quantity if product already in cart
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new product to cart
        cart.push({
            id: productId,
            quantity: quantity
        });
    }
    
    // Save updated cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}
