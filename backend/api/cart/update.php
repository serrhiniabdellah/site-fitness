<?php
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

// Required files
require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Invalid request method', 405);
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// Check for required fields
if (!isset($data['product_id'])) {
    sendErrorResponse('Product ID is required');
}

$productId = $data['product_id'];
$variantId = isset($data['variant_id']) ? $data['variant_id'] : null;
$quantity = isset($data['quantity']) ? max(1, intval($data['quantity'])) : 1;
$userId = null;
$sessionId = null;

// Check if user is authenticated
$auth = new Auth($conn);
$isAuthenticated = $auth->validateToken();

// If authenticated, use user_id from token, otherwise use session_id
if ($isAuthenticated) {
    $userId = $auth->getUserId();
} else {
    // For guest users, require session_id
    if (isset($data['session_id']) && !empty($data['session_id'])) {
        $sessionId = $data['session_id'];
    } else {
        sendErrorResponse('Session ID is required for guest users');
    }
}

// Check if product exists and has enough stock
$stmt = $conn->prepare("SELECT id_produit, prix, stock FROM produits WHERE id_produit = ? AND est_actif = 1");
$stmt->bind_param("i", $productId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendErrorResponse('Product not found or is inactive');
}

$product = $result->fetch_assoc();

// Check if enough stock is available
if ($product['stock'] < $quantity) {
    sendErrorResponse('Not enough stock available. Maximum: ' . $product['stock']);
}

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Prepare update statement based on authentication
    if ($userId) {
        $stmt = $conn->prepare("
            UPDATE cart 
            SET quantity = ? 
            WHERE id_utilisateur = ? AND id_produit = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
        ");
        $stmt->bind_param("iiiii", $quantity, $userId, $productId, $variantId, $variantId);
    } else {
        $stmt = $conn->prepare("
            UPDATE cart 
            SET quantity = ? 
            WHERE session_id = ? AND id_produit = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
        ");
        $stmt->bind_param("isiii", $quantity, $sessionId, $productId, $variantId, $variantId);
    }
    
    $stmt->execute();
    
    // If no rows were updated, the item doesn't exist in cart yet
    if ($stmt->affected_rows === 0) {
        // Item doesn't exist, so insert it
        if ($userId) {
            $stmt = $conn->prepare("INSERT INTO cart (id_utilisateur, id_produit, variant_id, quantity) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiii", $userId, $productId, $variantId, $quantity);
        } else {
            $stmt = $conn->prepare("INSERT INTO cart (session_id, id_produit, variant_id, quantity) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("siii", $sessionId, $productId, $variantId, $quantity);
        }
        
        $stmt->execute();
        
        $response = [
            'success' => true,
            'message' => 'Item added to cart',
            'item_id' => $conn->insert_id,
            'quantity' => $quantity,
            'operation' => 'insert'
        ];
    } else {
        $response = [
            'success' => true,
            'message' => 'Cart item updated',
            'quantity' => $quantity,
            'operation' => 'update'
        ];
    }
    
    // Commit transaction
    $conn->commit();
    
    sendResponse($response);
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    sendErrorResponse('Error updating cart: ' . $e->getMessage());
}

$conn->close();
?>
