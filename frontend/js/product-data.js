/**
 * Product Data Loader
 * Ensures product data is available across all pages for search functionality
 */

// Global product data storage
window.FitZone = window.FitZone || {};

// Initialize product data
(function() {
    'use strict';

    // Store products globally for use by search and other components
    window.FitZone.productData = {
        products: [],
        loaded: false,
        isLoading: false
    };

    // Load products on page load
    document.addEventListener('DOMContentLoaded', function() {
        loadProductData();
    });

    // Load products from existing source or fetch from API
    function loadProductData() {
        // Skip if already loaded or currently loading
        if (window.FitZone.productData.loaded || window.FitZone.productData.isLoading) {
            return;
        }

        window.FitZone.productData.isLoading = true;

        // Check if products are already available from products.js
        if (typeof getAllProducts === 'function') {
            window.FitZone.productData.products = getAllProducts();
            window.FitZone.productData.loaded = true;
            window.FitZone.productData.isLoading = false;
            
            // Dispatch event that products are loaded
            document.dispatchEvent(new CustomEvent('productsLoaded'));
            return;
        }

        // Otherwise look for global products array
        if (window.products && Array.isArray(window.products)) {
            window.FitZone.productData.products = window.products;
            window.FitZone.productData.loaded = true;
            window.FitZone.productData.isLoading = false;
            
            // Dispatch event that products are loaded
            document.dispatchEvent(new CustomEvent('productsLoaded'));
            return;
        }

        // Fallback to default products if no other source available
        // This ensures search always has some data to work with
        window.FitZone.productData.products = [
            {
                id: "mass1",
                category: "mass-gainers",
                brand: "MuscleCore",
                name: "Serious Mass Gainer - 5kg",
                price: 65,
                image: "img/products/massgainer.webp",
                stars: 5
            },
            {
                id: "protein1",
                category: "protein",
                brand: "Premium Nutrition",
                name: "Gold Standard Whey Protein",
                price: 60,
                image: "img/products/img6.png",
                stars: 5
            },
            {
                id: "equip1",
                category: "equipment",
                brand: "FitGear",
                name: "Pro Resistance Bands Set - 5 Levels",
                price: 29.99,
                image: "img/products/71.jpg",
                stars: 5
            },
            {
                id: "bcaa1",
                category: "bcaa",
                brand: "AminoFit",
                name: "Essential BCAA 2:1:1 - Berry Blast",
                price: 45,
                image: "img/products/img8.avif",
                stars: 5
            }
        ];
        
        window.FitZone.productData.loaded = true;
        window.FitZone.productData.isLoading = false;
        
        // Dispatch event that products are loaded
        document.dispatchEvent(new CustomEvent('productsLoaded'));
    }

    // Global interface for other scripts
    window.getAllProducts = function() {
        // Make sure data is loaded
        loadProductData();
        return window.FitZone.productData.products;
    };

    window.getProductById = function(id) {
        // Make sure data is loaded
        loadProductData();
        return window.FitZone.productData.products.find(product => product.id === id);
    };

    window.searchProducts = function(query) {
        // Make sure data is loaded
        loadProductData();
        
        query = query.toLowerCase();
        return window.FitZone.productData.products.filter(product => 
            product.name.toLowerCase().includes(query) || 
            (product.description && product.description.toLowerCase().includes(query)) ||
            (product.brand && product.brand.toLowerCase().includes(query)) ||
            (product.category && product.category.toLowerCase().includes(query))
        );
    };
})();