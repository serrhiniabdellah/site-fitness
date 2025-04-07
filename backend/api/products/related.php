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

$productId = $_GET['id'];
$categoryId = isset($_GET['category']) ? intval($_GET['category']) : 0;

try {
    $actualProductId = 0;
    
    // Handle both numeric IDs and string identifiers
    if (is_numeric($productId)) {
        $actualProductId = intval($productId);
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
            
            $categoryId = isset($categoryMap[$category]) ? $categoryMap[$category] : $categoryId;
            
            // Get actual product ID if needed
            $idStmt = $conn->prepare("
                SELECT p.id_produit 
                FROM produits p 
                WHERE p.id_categorie = ?
                ORDER BY p.id_produit ASC
                LIMIT ?, 1
            ");
            $productOffset = intval($productNumber) - 1;
            $idStmt->bind_param("ii", $categoryId, $productOffset);
            $idStmt->execute();
            $idResult = $idStmt->get_result();
            
            if ($idResult->num_rows > 0) {
                $row = $idResult->fetch_assoc();
                $actualProductId = $row['id_produit'];
            }
        }
    }
    
    // Get related products from same category
    if ($categoryId > 0) {
        $stmt = $conn->prepare("
            SELECT p.*, c.nom_categorie as category_name
            FROM produits p 
            JOIN categories c ON p.id_categorie = c.id_categorie
            WHERE p.id_categorie = ? AND p.id_produit != ? AND p.est_actif = 1
            ORDER BY p.featured DESC, p.date_creation DESC
            LIMIT 4
        ");
        $stmt->bind_param("ii", $categoryId, $actualProductId);
    } else {
        // Fallback to featured products
        $stmt = $conn->prepare("
            SELECT p.*, c.nom_categorie as category_name
            FROM produits p 
            JOIN categories c ON p.id_categorie = c.id_categorie
            WHERE p.featured = 1 AND p.id_produit != ? AND p.est_actif = 1
            ORDER BY p.date_creation DESC
            LIMIT 4
        ");
        $stmt->bind_param("i", $actualProductId);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $products = [];
    while ($product = $result->fetch_assoc()) {
        // Add any additional product information
        $products[] = $product;
    }
    
    sendResponse(['success' => true, 'products' => $products]);
} catch (Exception $e) {
    sendErrorResponse('Error fetching related products: ' . $e->getMessage());
}

$conn->close();
