// Function to render a single product card
function renderProductCard(product) {
    // Create the star elements based on the product's star rating
    let starsHTML = '';
    const fullStars = Math.floor(product.stars);
    const hasHalfStar = product.stars % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Calculate empty stars (5 - fullStars - hasHalfStar)
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    // Create the product card HTML
    const productCard = `
        <div class="pro" data-category="${product.category}" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="des">
                <span>${product.brand}</span>
                <h5>${product.name}</h5>
                <div class="star">
                    ${starsHTML}
                </div>
                <h4>$${product.price}</h4>
            </div>
            <a href="product.html?id=${product.id}"><i class="fal fa-shopping-cart cart"></i></a>
        </div>
    `;
    
    return productCard;
}

// Function to render multiple product cards in a container
function renderProducts(productList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let productsHTML = '';
    productList.forEach(product => {
        productsHTML += renderProductCard(product);
    });
    
    container.innerHTML = productsHTML;
}

// Function to initialize product displays on the page
function initProductDisplays() {
    // For featured products section
    const featuredContainer = document.querySelector('#featured .pro-container');
    if (featuredContainer) {
        const featuredProducts = getFeaturedProducts();
        let featuredHTML = '';
        featuredProducts.forEach(product => {
            featuredHTML += renderProductCard(product);
        });
        featuredContainer.innerHTML = featuredHTML;
    }
    
    // For new arrivals section
    const newArrivalsContainer = document.querySelector('#product1 .pro-container');
    if (newArrivalsContainer) {
        const newArrivals = getNewArrivals();
        let newArrivalsHTML = '';
        newArrivals.forEach(product => {
            newArrivalsHTML += renderProductCard(product);
        });
        newArrivalsContainer.innerHTML = newArrivalsHTML;
    }
    
    // Add click handlers for product cards
    document.querySelectorAll('.pro').forEach(card => {
        card.addEventListener('click', function(e) {
            // Only navigate if the click wasn't on the shopping cart icon
            if (!e.target.classList.contains('cart') && !e.target.closest('a')) {
                const productId = this.dataset.id;
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initProductDisplays();
});
