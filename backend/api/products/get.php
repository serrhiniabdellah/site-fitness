<?php
// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
            $productNumber = $matches[2];
            
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
                $stmt = $conn->prepare("SELECT p.*, c.nom_categorie as category_name 
                                       FROM produits p 
                                       LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                                       WHERE p.id_categorie = ?
                                       ORDER BY p.id_produit ASC
                                       LIMIT ?, 1");
                $productOffset = intval($productNumber) - 1;
                $stmt->bind_param("ii", $categoryId, $productOffset);
            } else {
                sendErrorResponse("Invalid product identifier");
                exit;
            }
        } else {
            sendErrorResponse("Invalid product identifier format");
            exit;
        }
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse('Product not found');
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
    
    // Send successful response
    sendResponse(['success' => true, 'product' => $product]);
    
} catch (Exception $e) {
    sendErrorResponse('Error fetching product: ' . $e->getMessage());
}

$conn->close();
?>
