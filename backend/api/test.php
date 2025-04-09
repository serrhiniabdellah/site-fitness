<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


require_once '../config.php';
require_once '../utils.php';

// Enable CORS for development
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple endpoint to test API connectivity
echo json_encode([
    'success' => true,
    'message' => 'API connection successful',
    'data' => [
        'timestamp' => time(),
        'server' => $_SERVER['SERVER_NAME'],
        'php_version' => phpversion()
    ]
]);
?>
