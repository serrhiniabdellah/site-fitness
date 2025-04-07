<?php
/**
 * CORS handler for API requests
 */

// Prevent duplicate headers
if (!headers_sent()) {
    // Get the requesting origin
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // List of allowed origins
    $allowed_origins = [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost',
        // Add more when needed
    ];
    
    // Always set one, and only one, Access-Control-Allow-Origin header
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    // Set other CORS headers
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    
    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
?>
