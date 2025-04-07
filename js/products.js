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
        id: "bcaa1",
        category: "bcaa",
        brand: "AminoFit",
        name: "Essential BCAA 2:1:1 - Berry Blast",
        price: 45,
        image: "img/products/Bcaa.jpeg",
        stars: 5,
        description: "Essential branched-chain amino acids in the scientifically proven 2:1:1 ratio.",
        features: ["Supports muscle recovery", "Prevents muscle breakdown", "Enhances protein synthesis", "Great berry taste", "No artificial colors"]
    },
    {
        id: "bcaa2",
        category: "bcaa",
        brand: "PeakPerformance",
        name: "Advanced BCAA Recovery Formula",
        price: 55,
        image: "img/products/Bcaa1.jpeg",
        stars: 4.5,
        description: "Enhanced BCAA formula with added electrolytes for improved recovery.",
        features: ["Fermented BCAAs", "Added electrolytes", "Contains glutamine", "Sugar-free formula", "Supports hydration"]
    },
    {
        id: "bcaa3",
        category: "bcaa",
        brand: "FitZone",
        name: "Premium BCAA 4:1:1 - Tropical Punch",
        price: 48,
        image: "img/products/Bcaa2.jpg",
        stars: 5,
        description: "Advanced 4:1:1 ratio BCAA formula for enhanced muscle support.",
        features: ["Higher leucine content", "Added citrulline", "Tropical punch flavor", "Supports endurance", "Anti-catabolic effects"]
    },
    {
        id: "protein1",
        category: "protein",
        brand: "Premium Nutrition",
        name: "Gold Standard Whey Protein",
        price: 60,
        image: "img/products/pro1.jpeg",
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
        image: "img/products/img6.png",
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
        image: "img/products/img8.png",
        stars: 5,
        description: "Space-saving adjustable dumbbells for comprehensive home workouts.",
        features: ["Adjustable from 2.5kg to 25kg", "Replaces multiple dumbbells", "Quick weight change mechanism", "Durable construction", "Compact storage"]
    }
];

// Function to get all products
function getAllProducts() {
    return products;
}

// Function to get product by ID
function getProductById(id) {
    return products.find(product => product.id === id);
}

// Function to get products by category
function getProductsByCategory(category) {
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
