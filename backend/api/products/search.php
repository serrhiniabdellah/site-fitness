<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Get search query
$query = isset($_GET['q']) ? Utils::sanitizeInput($_GET['q']) : '';

// Validate query
if (empty($query)) {
    Utils::sendResponse(false, 'Search query is required', null, 400);
    exit;
}

try {
    // Create database connection
    $db = new Database();
    
    // Perform search (search in product name, description, and category)
    $searchTerm = "%$query%";
    $db->query("SELECT p.*, c.nom_categorie as category_name 
                FROM produits p
                LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                WHERE p.nom_produit LIKE :query 
                OR p.description LIKE :query 
                OR c.nom_categorie LIKE :query
                LIMIT 10");
    $db->bind(':query', $searchTerm);
    
    $results = $db->resultSetArray();
    
    // Process results
    $products = [];
    foreach ($results as $product) {
        $products[] = [
            'id' => $product['id_produit'],
            'name' => $product['nom_produit'],
            'price' => $product['prix'],
            'image' => $product['image'],
            'category' => $product['category_name'],
            'url' => "sproduct.html?id=" . $product['id_produit']
        ];
    }
    
    // Return results
    Utils::sendResponse(true, 'Search results', ['products' => $products]);
} catch (Exception $e) {
    Utils::sendResponse(false, 'Error searching products: ' . $e->getMessage(), null, 500);
}
?>
