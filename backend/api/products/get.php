<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

require_once '../config/database.php';
require_once '../utils/response.php';

// Check if product ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    sendErrorResponse('Product ID is required');
}

$productId = $_GET['id']; // Get the product ID from request

try {
    // Handle both numeric IDs and string identifiers
    if (is_numeric($productId)) {
        $stmt = $conn->prepare("SELECT p.*, c.nom_categorie as category_name 
                                FROM produits p 
                                LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                                WHERE p.id_produit = ?");
        $stmt->bind_param("i", $productId);
    } else {
        // For string identifiers like 'equip1', extract category and id parts
        preg_match('/^([a-zA-Z]+)(\d+)$/', $productId, $matches);
        
        if (count($matches) === 3) {
            $category = $matches[1];
            $productNumber = intval($matches[2]); // Ensure it's an integer
            
            // Map category string to category ID
            $categoryMap = [
                'equip' => 4, // Equipment
                'protein' => 1, // Protein
                'mass' => 2, // Mass Gainers
                'bcaa' => 3  // BCAA & Amino Acids
            ];
            
            $categoryId = isset($categoryMap[$category]) ? $categoryMap[$category] : 0;
            
            // Find product by category and ranking
            if ($categoryId > 0) {
                // Fix: Use a subquery to select the nth product by ID in the category
                // This is more reliable than using LIMIT with an offset parameter
                if ($productNumber <= 1) {
                    // For first product in category, simple query is sufficient
                    $stmt = $conn->prepare("
                        SELECT p.*, c.nom_categorie as category_name 
                        FROM produits p 
                        LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                        WHERE p.id_categorie = ? 
                        ORDER BY p.id_produit ASC
                        LIMIT 1");
                    $stmt->bind_param("i", $categoryId);
                } else {
                    // For other positions, we need a more complex query to handle missing products
                    $productOffset = $productNumber - 1;
                    $stmt = $conn->prepare("
                        SELECT p.*, c.nom_categorie as category_name 
                        FROM produits p 
                        LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                        WHERE p.id_categorie = ?
                        ORDER BY p.id_produit ASC
                        LIMIT ?, 1");
                    $stmt->bind_param("ii", $categoryId, $productOffset);
                }
            } else {
                sendErrorResponse("Invalid product identifier - category not recognized");
                exit;
            }
        } else {
            sendErrorResponse("Invalid product identifier format - expected format like 'equip3'");
            exit;
        }
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse('Product not found');
        exit;
    }
    
    $product = $result->fetch_assoc();
    
    // Get product variants if any
    $variants = [];
    $variantsStmt = $conn->prepare("SELECT * FROM variants_produit WHERE id_produit = ?");
    $variantsStmt->bind_param("i", $product['id_produit']);
    $variantsStmt->execute();
    $variantsResult = $variantsStmt->get_result();
    
    while ($variant = $variantsResult->fetch_assoc()) {
        $variants[] = $variant;
    }
    
    $product['variants'] = $variants;
    
    // Get product images if any
    $images = [];
    $imagesStmt = $conn->prepare("SELECT * FROM images_produit WHERE id_produit = ? ORDER BY est_principale DESC, ordre ASC");
    $imagesStmt->bind_param("i", $product['id_produit']);
    $imagesStmt->execute();
    $imagesResult = $imagesStmt->get_result();
    
    while ($image = $imagesResult->fetch_assoc()) {
        $images[] = $image;
    }
    
    $product['images'] = $images;
    
    // Make sure ID is always available in a consistent format
    if (!isset($product['id']) && isset($product['id_produit'])) {
        $product['id'] = $product['id_produit'];
    }
    
    // Send successful response
    sendResponse(['success' => true, 'product' => $product]);
    
} catch (Exception $e) {
    sendErrorResponse('Error fetching product: ' . $e->getMessage());
}

$conn->close();
?>
