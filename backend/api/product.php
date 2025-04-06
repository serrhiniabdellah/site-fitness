<?php
/**
 * Single Product API Endpoint
 * 
 * This endpoint retrieves a single product by ID
 */

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include necessary files
require_once '../config/config.php';
require_once '../includes/Product.php';

// Check if it's a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get product ID parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid product ID']);
    exit;
}

// Create product instance
$product = new Product();

// Get product by ID
$productData = $product->getProductById($id);

if ($productData) {
    echo json_encode([
        'success' => true,
        'product' => $productData
    ]);
} else {
    http_response_code(404); // Not Found
    echo json_encode([
        'success' => false,
        'message' => 'Product not found'
    ]);
}