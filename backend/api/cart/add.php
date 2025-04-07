<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';
require_once '../cors.php';

// Set CORS headers for development
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set content type
header('Content-Type: application/json');

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Please use POST.'
    ]);
    exit;
}

// Get request data
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

// If direct POST variables
if (!$data) {
    $data = $_POST;
}

// Check required fields
if (!isset($data['product_id']) && !isset($data['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Product ID is required'
    ]);
    exit;
}

// Get parameters
$productId = isset($data['product_id']) ? $data['product_id'] : $data['id'];
$quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;
$variantId = isset($data['variant_id']) ? $data['variant_id'] : null;

// Get user ID from auth token
$userId = null;
$authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
if (strpos($authHeader, 'Bearer ') === 0) {
    $token = substr($authHeader, 7);
    // For now, use hardcoded test value
    $userId = 12; // In real app, validate token and extract user ID
} else {
    // For demo purposes
    $userId = 12;
}

try {
    // Create database connection
    $db = new Database();
    
    // Check if product exists
    $db->query("SELECT id_produit FROM produits WHERE id_produit = :product_id");
    $db->bind(':product_id', $productId);
    $product = $db->single();
    
    if (!$product) {
        // For demo, just return success
        echo json_encode([
            'success' => true,
            'message' => 'Product added to cart (demo)',
            'data' => [
                'product_id' => $productId,
                'quantity' => $quantity
            ]
        ]);
        exit;
    }
    
    // Check if item already exists in cart
    $db->query("SELECT * FROM cart WHERE id_utilisateur = :user_id AND id_produit = :product_id");
    $db->bind(':user_id', $userId);
    $db->bind(':product_id', $productId);
    $existingItem = $db->single();
    
    if ($existingItem) {
        // Update quantity
        $db->query("UPDATE cart SET quantity = quantity + :quantity WHERE id_utilisateur = :user_id AND id_produit = :product_id");
        $db->bind(':quantity', $quantity);
        $db->bind(':user_id', $userId);
        $db->bind(':product_id', $productId);
        $db->execute();
    } else {
        // Add new item
        $db->query("INSERT INTO cart (id_utilisateur, id_produit, variant_id, quantity) VALUES (:user_id, :product_id, :variant_id, :quantity)");
        $db->bind(':user_id', $userId);
        $db->bind(':product_id', $productId);
        $db->bind(':variant_id', $variantId);
        $db->bind(':quantity', $quantity);
        $db->execute();
    }
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Product added to cart',
        'data' => [
            'product_id' => $productId,
            'quantity' => $quantity
        ]
    ]);
    
} catch (Exception $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Error adding to cart: ' . $e->getMessage()
    ]);
}
?>
