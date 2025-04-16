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

// Product database
const products = [
    {
        id: "mass1",
        category: "mass-gainers",
        brand: "MuscleCore",
        name: "Serious Mass Gainer - 5kg",
        price: 65,
        image: "img/products/massgainer.webp",
        stars: 5,
        description: "High-quality mass gainer with added vitamins and minerals for optimal muscle growth.",
        features: ["50g protein per serving", "250g carbs per serving", "Added creatine", "Supports muscle recovery", "Promotes weight gain"]
    },
    {
        id: "mass2",
        category: "mass-gainers",
        brand: "BulkZone",
        name: "Ultra Mass Gainer 2500",
        price: 85,
        image: "img/products/massgainer1.avif",
        stars: 4.5,
        description: "Premium mass builder formula designed for hard gainers.",
        features: ["60g protein per serving", "High calorie formula", "Added digestive enzymes", "Zero added sugar", "Excellent mixability"]
    },
    {
        id: "mass3",
        category: "mass-gainers",
        brand: "MuscleMax",
        name: "HyperMass 5000 - Ultimate Weight Gainer",
        price: 89.99,
        image: "img/products/HYPERmass.avif",
        stars: 5,
        description: "The ultimate formula for maximum muscle and weight gain.",
        features: ["75g protein per serving", "Contains BCAAs and EAAs", "Added creatine monohydrate", "High-quality protein sources", "For serious athletes"]
    },
    {
        id: "mass4",
        category: "mass-gainers",
        brand: "NutriMass",
        name: "Max Gainer Pro Complex - Vanilla",
        price: 69.99,
        image: "img/products/mass2.png",
        stars: 4.5,
        description: "Complete mass gaining formula with complex carbohydrates.",
        features: ["45g protein per serving", "Low sugar formula", "Added glutamine", "Enhanced with vitamins", "Great taste"]
    },
    {
        id: "mass5",
        category: "mass-gainers",
        brand: "PowerBulk",
        name: "Massive Weight Gainer - 2.5kg",
        price: 78,
        image: "img/products/weight-gainer-massive-25kg.avif",
        stars: 5,
        description: "Advanced weight gainer with quality protein and carbs for maximum results.",
        features: ["55g protein per serving", "Contains MCT oils", "Enhanced with creatine", "Includes digestive enzymes", "Supports recovery"]
    },
    {
        id: "mass6",
        category: "mass-gainers",
        brand: "MuscleForce",
        name: "Elite Mass Gainer - Double Chocolate",
        price: 72,
        image: "img/products/masse.jpeg",
        stars: 4.5,
        description: "Premium mass builder with great chocolate taste and high-quality ingredients.",
        features: ["52g protein per serving", "Complex carb blend", "Added BCAAs", "Rich chocolate flavor", "Mixes easily"]
    },
    {
        id: "protein1",
        category: "protein",
        brand: "Premium Nutrition",
        name: "Gold Standard Whey Protein",
        price: 60,
        image: "img/products/img6.png",
        stars: 5,
        description: "Industry-leading whey protein with superior mixability and taste.",
        features: ["24g protein per serving", "Low in fat and carbs", "Fast-absorbing formula", "Supports muscle growth", "Multiple flavors available"]
    },
    {
        id: "protein2",
        category: "protein",
        brand: "FitZone",
        name: "Ultra Pure Protein Isolate - Vanilla",
        price: 64.99,
        image: "img/products/images1.jpg",
        stars: 4.5,
        description: "Ultra-filtered whey protein isolate for maximum purity and results.",
        features: ["27g protein per serving", "Less than 1g of carbs", "Lactose-free formula", "Enhanced with digestive enzymes", "Premium vanilla flavor"]
    },
    {
        id: "equip1",
        category: "equipment",
        brand: "FitGear",
        name: "Pro Resistance Bands Set - 5 Levels",
        price: 29.99,
        image: "img/products/71.jpg",
        stars: 5,
        description: "Complete resistance bands set for home workouts with varying resistance levels.",
        features: ["5 different resistance levels", "Durable latex material", "Includes door anchor", "Comfortable handles", "Carrying bag included"]
    },
    {
        id: "equip3",
        category: "equipment",
        brand: "PowerFit",
        name: "Adjustable Dumbbell Set - 2.5-25kg",
        price: 199.99,
        image: "img/products/img8.avif",
        stars: 5,
        description: "Space-saving adjustable dumbbells for comprehensive home workouts.",
        features: ["Adjustable from 2.5kg to 25kg", "Replaces multiple dumbbells", "Quick weight change mechanism", "Durable construction", "Compact storage"]
    }
];

// Add BCAA mock products with complete data
function getBcaaProducts() {
    return [
        {
            id: "bcaa1",
            id_produit: "bcaa1", 
            category: "bcaa",
            category_name: "BCAA Supplements",
            id_categorie: 3,
            brand: "AminoFit",
            name: "Essential BCAA 2:1:1 - Berry Blast",
            nom_produit: "Essential BCAA 2:1:1 - Berry Blast",
            price: 45,
            prix: 45,
            image: "img/products/Bcaa.jpeg",
            stars: 5,
            stock: 25,
            description: "Essential branched-chain amino acids in the scientifically proven 2:1:1 ratio.",
            features: ["Supports muscle recovery", "Prevents muscle breakdown", "Enhances protein synthesis", "Great berry taste", "No artificial colors"]
        },
        {
            id: "bcaa2",
            id_produit: "bcaa2",
            category: "bcaa",
            category_name: "BCAA Supplements",
            id_categorie: 3,
            brand: "PeakPerformance",
            name: "Advanced BCAA Recovery Formula",
            nom_produit: "Advanced BCAA Recovery Formula",
            price: 55,
            prix: 55,
            image: "img/products/Bcaa1.jpeg",
            stars: 4.5,
            stock: 18,
            description: "Enhanced BCAA formula with added electrolytes for improved recovery.",
            features: ["Fermented BCAAs", "Added electrolytes", "Contains glutamine", "Sugar-free formula", "Supports hydration"]
        },
        {
            id: "bcaa3",
            id_produit: "bcaa3",
            category: "bcaa",
            category_name: "BCAA Supplements",
            id_categorie: 3,
            brand: "FitZone",
            name: "Premium BCAA 4:1:1 - Tropical Punch",
            nom_produit: "Premium BCAA 4:1:1 - Tropical Punch",
            price: 48,
            prix: 48,
            image: "img/products/Bcaa2.jpg",
            stars: 5,
            stock: 22,
            description: "Advanced 4:1:1 ratio BCAA formula for enhanced muscle support. Our premium blend is designed to support optimal muscle recovery and growth during intense training periods. The higher leucine content helps stimulate protein synthesis more effectively than standard 2:1:1 formulas.",
            features: ["Higher leucine content", "Added citrulline", "Tropical punch flavor", "Supports endurance", "Anti-catabolic effects"]
        }
    ];
}

// Add sample reviews data for mock products
function getMockReviews(productId) {
    const allReviews = {
        'bcaa1': [
            {
                prenom: 'David Miller',
                date_avis: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                note: 5,
                commentaire: "Great product! I've been using this BCAA for 3 months and it's helped my recovery tremendously."
            },
            {
                prenom: 'Sarah Johnson',
                date_avis: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                note: 4.5,
                commentaire: "Love the taste and it mixes well. I feel less sore after my workouts."
            }
        ],
        'bcaa2': [
            {
                prenom: 'Michael Thompson',
                date_avis: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                note: 4,
                commentaire: "Good formula with electrolytes. Helps me stay hydrated during workouts."
            },
            {
                prenom: 'Jennifer Adams',
                date_avis: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                note: 5,
                commentaire: "Best recovery supplement I've tried! Will definitely purchase again."
            }
        ],
        'bcaa3': [
            {
                prenom: 'Robert Garcia',
                date_avis: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                note: 5,
                commentaire: "The tropical punch flavor is amazing! I look forward to drinking this after every workout."
            },
            {
                prenom: 'Emily Wilson',
                date_avis: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                note: 4.5,
                commentaire: "Great value for the quality. The 4:1:1 ratio seems to help with recovery better than other BCAAs I've tried."
            },
            {
                prenom: 'John Martinez',
                date_avis: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                note: 5,
                commentaire: "This has become a staple in my supplement routine. Highly recommended for serious athletes!"
            }
        ]
    };
    
    // Return product-specific reviews or default reviews if not found
    return allReviews[productId] || [
        {
            prenom: 'Default User',
            date_avis: new Date().toISOString(),
            note: 4.5,
            commentaire: "Good quality product. Meets expectations."
        }
    ];
}

// Get related products by category (returns products excluding the current one)
function getRelatedProductsByCategory(category, currentProductId) {
    // Find products from all arrays by category
    let relatedProducts = [];
    
    // Add BCAA products if category matches or if we need BCAA products specifically
    if (!category || category === 'bcaa' || category === '3') {
        relatedProducts = [...relatedProducts, ...getBcaaProducts()];
    }
    
    // Add main products array if it exists
    if (typeof products !== 'undefined' && Array.isArray(products)) {
        relatedProducts = [...relatedProducts, ...products];
    }
    
    // Filter out the current product and limit to related category if specified
    return relatedProducts
        .filter(p => p.id !== currentProductId && 
                    (!category || 
                     p.category === category || 
                     p.id_categorie === category ||
                     (category === 'bcaa' && p.category === 'bcaa') ||
                     (category === '3' && (p.category === 'bcaa' || p.id_categorie === 3))
                    ))
        .slice(0, 4); // Limit to 4 products
}

// Function to get all products
function getAllProducts() {
    return products;
}

// Function to get product by ID
function getProductById(id) {
    return products.find(product => product.id === id);
}

// Map numeric category IDs to category string values
function getCategoryStringFromId(categoryId) {
    // Map database category IDs to product.js category strings
    const categoryMapping = {
        '1': 'protein',
        '2': 'mass-gainers',
        '3': 'bcaa',
        '4': 'equipment'
    };
    
    return categoryMapping[categoryId] || '';
}

// Function to get products by category (supports both string categories and numeric IDs)
function getProductsByCategory(category) {
    // If it's a numeric ID, convert it to the corresponding string category
    if (!isNaN(category)) {
        const categoryString = getCategoryStringFromId(category);
        return products.filter(product => product.category === categoryString);
    }
    
    // Otherwise filter by the category string directly
    return products.filter(product => product.category === category);
}

// Function to get featured products (first 8)
function getFeaturedProducts() {
    return products.slice(0, 8);
}

// Function to get new arrivals (last 8)
function getNewArrivals() {
    return products.slice(-8);
}

// Function to search products by name, description or brand
function searchProducts(query) {
    query = query.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );
}

// Function to render product cards for shop page
function renderProductCards(productsToShow, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Create a single product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'pro';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    
    // Generate star HTML
    const starsHTML = generateStarRating(product.stars);
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="des">
            <span>${product.brand}</span>
            <h5>${product.name}</h5>
            <div class="star">
                ${starsHTML}
            </div>
            <h4>$${product.price}</h4>
        </div>
        <a href="sproduct.html?id=${product.id}"><i class="fal fa-shopping-cart cart"></i></a>
    `;
    
    // Make the whole card clickable
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on the cart icon
        if (!e.target.closest('a')) {
            window.location.href = `sproduct.html?id=${product.id}`;
        }
    });
    
    return card;
}

// Generate HTML for star rating
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Function to generate product HTML
function generateProductHTML(product) {
    // Ensure the product has a unique ID
    const productId = product.id || `product-${Math.random().toString(36).substr(2, 9)}`;
    const stars = generateStarRating(product.rating || 5);
    
    return `
        <div class="pro" data-category="${product.category || ''}" data-id="${productId}">
            <img src="${product.image}" alt="${product.name}">
            <div class="des">
                <span>${product.brand || 'Brand'}</span>
                <h5>${product.name}</h5>
                <div class="star">
                    ${stars}
                </div>
                <h4>$${product.price.toFixed(2)}</h4>
            </div>
            <a href="#" class="add-to-cart"><i class="fal fa-shopping-cart cart"></i></a>
        </div>
    `;
}
