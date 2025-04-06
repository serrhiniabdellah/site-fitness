<?php
/**
 * Get Cart API Endpoint
 * 
 * This endpoint retrieves the user's cart contents
 */

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include necessary files
require_once '../../config/config.php';
require_once '../../includes/Cart.php';
require_once '../../includes/User.php';

// Get request data (support both GET and POST)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $token = isset($_GET['token']) ? $_GET['token'] : '';
} else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $token = isset($data['token']) ? $data['token'] : '';
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Validate required parameters
if (!$userId || empty($token)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing user ID or token']);
    exit;
}

// Validate token
$user = new User();
if (!$user->validateToken($token, $userId)) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Invalid authentication']);
    exit;
}

// Create cart instance
$cart = new Cart();

// Get cart contents
$cartData = $cart->getUserCart($userId);

// Return cart data
echo json_encode([
    'success' => true,
    'cart' => $cartData
]);