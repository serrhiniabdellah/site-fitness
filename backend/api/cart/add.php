<?php
/**
 * Add to Cart API Endpoint
 * 
 * This endpoint adds a product to the user's cart
 */

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include necessary files
require_once '../../config/config.php';
require_once '../../includes/Cart.php';
require_once '../../includes/User.php';

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get posted data
$data = json_decode(file_get_contents('php://input'), true);

// Check if required fields exist
if (!isset($data['product_id']) || !isset($data['token']) || !isset($data['user_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Validate token
$user = new User();
if (!$user->validateToken($data['token'], $data['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Invalid authentication']);
    exit;
}

// Get quantity (default to 1)
$quantity = isset($data['quantity']) && intval($data['quantity']) > 0 
    ? intval($data['quantity']) 
    : 1;

// Create cart instance
$cart = new Cart();

// Add product to cart
$success = $cart->addToCart($data['user_id'], $data['product_id'], $quantity);

if ($success) {
    // Get updated cart
    $cartData = $cart->getUserCart($data['user_id']);
    
    http_response_code(200); // OK
    echo json_encode([
        'success' => true, 
        'message' => 'Product added to cart',
        'cart' => $cartData
    ]);
} else {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Failed to add product to cart']);
}