<?php
require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check auth state
$auth = new Auth($conn);
$isAuthenticated = $auth->validateToken();
$userId = null;
$sessionId = null;

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// For authenticated users, use user_id from token
if ($isAuthenticated) {
    $userId = $auth->getUserId();
} else {
    // For guest users, use session_id if provided
    if (isset($data['session_id']) && !empty($data['session_id'])) {
        $sessionId = $data['session_id'];
    } else {
        // If neither user_id nor session_id is available, return empty cart
        sendResponse([
            'success' => true,
            'cart' => [
                'items' => [],
                'total' => 0
            ]
        ]);
    }
}

try {
    // Query to fetch cart items with product details
    if ($userId) {
        $stmt = $conn->prepare("
            SELECT c.id, c.id_produit, c.variant_id, c.quantity,
                  p.nom_produit, p.prix, p.image, 
                  v.nom AS variant_name
            FROM cart c
            JOIN produits p ON c.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
            WHERE c.id_utilisateur = ?
        ");
        $stmt->bind_param("i", $userId);
    } else {
        $stmt = $conn->prepare("
            SELECT c.id, c.id_produit, c.variant_id, c.quantity,
                  p.nom_produit, p.prix, p.image, 
                  v.nom AS variant_name
            FROM cart c
            JOIN produits p ON c.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
            WHERE c.session_id = ?
        ");
        $stmt->bind_param("s", $sessionId);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Process results
    $items = [];
    $total = 0;
    
    while ($row = $result->fetch_assoc()) {
        $price = $row['prix'];
        $subtotal = $price * $row['quantity'];
        $total += $subtotal;
        
        $items[] = [
            'id' => $row['id'],
            'id_produit' => $row['id_produit'],
            'variant_id' => $row['variant_id'],
            'nom_produit' => $row['nom_produit'],
            'prix' => $price,
            'image' => $row['image'],
            'variant_name' => $row['variant_name'],
            'quantity' => $row['quantity'],
            'subtotal' => $subtotal
        ];
    }
    
    // Send response
    sendResponse([
        'success' => true,
        'cart' => [
            'items' => $items,
            'total' => $total
        ]
    ]);
} catch (Exception $e) {
    sendErrorResponse('Error fetching cart: ' . $e->getMessage());
}

$conn->close();
?>
