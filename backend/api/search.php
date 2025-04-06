<?php
/**
 * Search API Endpoint
 * 
 * This endpoint handles product search queries
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

// Get query parameter
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

// Get limit parameter (default to 5)
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;

// Validate query
if (empty($query) || strlen($query) < 2) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'success' => false, 
        'message' => 'Search query must be at least 2 characters'
    ]);
    exit;
}

// Create product instance
$product = new Product();

// Search products
$results = $product->searchProducts($query, $limit);

echo json_encode([
    'success' => true,
    'query' => $query,
    'results' => $results,
    'count' => count($results)
]);