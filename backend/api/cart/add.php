<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Check if data is valid
if (!$data || !isset($data['product_id'])) {
    sendResponse(['success' => false, 'message' => 'Invalid request data'], 400);
    exit;
}

// Extract product data
$productId = (int) $data['product_id'];
$quantity = isset($data['quantity']) ? (int) $data['quantity'] : 1;
$variantId = isset($data['variant_id']) ? (int) $data['variant_id'] : null;

// Make sure quantity is at least 1
if ($quantity < 1) {
    $quantity = 1;
}

// Check if user is authenticated
$auth = new Auth($conn);
$userId = $auth->getUserId();

// If not authenticated, return error
if (!$userId) {
    sendResponse(['success' => false, 'message' => 'Authentication required'], 401);
    exit;
}

try {
    // Check if product exists
    $stmt = $conn->prepare("SELECT id_produit, prix FROM produits WHERE id_produit = ? AND est_actif = 1");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['success' => false, 'message' => 'Product not found'], 404);
        exit;
    }
    
    // Check if product is already in cart
    $stmt = $conn->prepare("SELECT id, quantity FROM cart WHERE id_utilisateur = ? AND id_produit = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))");
    $stmt->bind_param("iiii", $userId, $productId, $variantId, $variantId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing cart item
        $cartItem = $result->fetch_assoc();
        $newQuantity = $cartItem['quantity'] + $quantity;
        
        $stmt = $conn->prepare("UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("ii", $newQuantity, $cartItem['id']);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update cart: " . $stmt->error);
        }
        
        // Get the updated cart
        $cart = getCart($conn, $userId);
        
        sendResponse([
            'success' => true, 
            'message' => 'Cart updated', 
            'data' => $cart
        ]);
    } else {
        // Add new cart item - using proper AUTO_INCREMENT for primary key
        $stmt = $conn->prepare("INSERT INTO cart (id_utilisateur, id_produit, variant_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        $stmt->bind_param("iiis", $userId, $productId, $variantId, $quantity);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to add to cart: " . $stmt->error);
        }
        
        // Get the updated cart
        $cart = getCart($conn, $userId);
        
        sendResponse([
            'success' => true, 
            'message' => 'Product added to cart', 
            'data' => $cart
        ]);
    }
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error adding to cart: ' . $e->getMessage()], 500);
}

/**
 * Get user's cart
 * @param mysqli $conn Database connection
 * @param int $userId User ID
 * @return array Cart data
 */
function getCart($conn, $userId) {
    // Query to get all cart items with product details
    $query = "
        SELECT c.id, c.id_produit, c.variant_id, c.quantity,
               p.nom_produit, p.prix, p.image as image_url
        FROM cart c
        JOIN produits p ON c.id_produit = p.id_produit
        WHERE c.id_utilisateur = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = [];
    $total = 0;
    
    while ($row = $result->fetch_assoc()) {
        $subtotal = $row['prix'] * $row['quantity'];
        $total += $subtotal;
        
        $items[] = [
            'id_produit' => $row['id_produit'],
            'variant_id' => $row['variant_id'],
            'quantity' => $row['quantity'],
            'nom_produit' => $row['nom_produit'],
            'prix' => $row['prix'],
            'image_url' => $row['image_url'],
            'subtotal' => $subtotal
        ];
    }
    
    return [
        'items' => $items,
        'total' => $total
    ];
}
?>
