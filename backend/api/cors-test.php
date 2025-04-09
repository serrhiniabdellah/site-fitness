<?php
// Include CORS handler at the very top
require_once __DIR__ . '/cors-handler.php';

// Set content type to JSON
header('Content-Type: application/json');

// Return detailed information about the request
echo json_encode([
    'success' => true,
    'message' => 'CORS test successful',
    'cors_info' => [
        'request_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin header',
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'php_version' => phpversion(),
        'server' => $_SERVER['SERVER_SOFTWARE'],
        'request_headers' => getallheaders(),
        'time' => date('Y-m-d H:i:s')
    ],
    'note' => 'If you can see this response in your browser or fetch it successfully from JavaScript, your CORS setup is working!'
]);
?>