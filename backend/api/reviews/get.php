<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


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
if (!isset($_GET['product_id']) || empty($_GET['product_id'])) {
    sendErrorResponse('Product ID is required');
}

$productId = $_GET['product_id'];

try {
    // Handle both numeric IDs and string identifiers
    if (is_numeric($productId)) {
        $stmt = $conn->prepare("
            SELECT a.*, u.prenom, u.nom
            FROM avis a 
            LEFT JOIN utilisateurs u ON a.id_utilisateur = u.id_utilisateur
            WHERE a.id_produit = ? AND a.est_approuve = 1
            ORDER BY a.date_avis DESC
        ");
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
                // First get the product ID
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
                
                if ($idResult->num_rows === 0) {
                    sendResponse(['success' => true, 'reviews' => []]);
                    exit;
                }
                
                $row = $idResult->fetch_assoc();
                $actualProductId = $row['id_produit'];
                
                // Then get reviews for that product ID
                $stmt = $conn->prepare("
                    SELECT a.*, u.prenom, u.nom
                    FROM avis a 
                    LEFT JOIN utilisateurs u ON a.id_utilisateur = u.id_utilisateur
                    WHERE a.id_produit = ? AND a.est_approuve = 1
                    ORDER BY a.date_avis DESC
                ");
                $stmt->bind_param("i", $actualProductId);
            } else {
                sendResponse(['success' => true, 'reviews' => []]);
                exit;
            }
        } else {
            sendResponse(['success' => true, 'reviews' => []]);
            exit;
        }
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reviews = [];
    while ($review = $result->fetch_assoc()) {
        $reviews[] = $review;
    }
    
    sendResponse(['success' => true, 'reviews' => $reviews]);
} catch (Exception $e) {
    sendErrorResponse('Error fetching reviews: ' . $e->getMessage());
}

$conn->close();

/**
 * Helper function to send error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

/**
 * Helper function to send success response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
?>
