<?php
// Enable CORS for all origins during development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Get the requested file path
$requestedFile = $_SERVER['REQUEST_URI'];

// Check if it's an API request - pass it to the backend
if (strpos($requestedFile, '/api/') !== false) {
    $apiPath = __DIR__ . '/../backend' . $requestedFile;
    if (file_exists($apiPath)) {
        include($apiPath);
        exit;
    }
}

// Remove any query parameters
$requestedFile = strtok($requestedFile, '?');

// Security: Ensure the path doesn't try to access parent directories
$requestedFile = str_replace('../', '', $requestedFile);

// Map the root URL to index.html
if ($requestedFile === '/' || $requestedFile === '') {
    $requestedFile = '/index.html';
}

// Get the full file path
$filePath = __DIR__ . $requestedFile;

// Check if file exists
if (file_exists($filePath)) {
    // Set content type based on file extension
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    
    switch ($extension) {
        case 'html':
            header('Content-Type: text/html');
            break;
        case 'css':
            header('Content-Type: text/css');
            break;
        case 'js':
            header('Content-Type: application/javascript');
            break;
        case 'json':
            header('Content-Type: application/json');
            break;
        case 'png':
            header('Content-Type: image/png');
            break;
        case 'jpg':
        case 'jpeg':
            header('Content-Type: image/jpeg');
            break;
        case 'gif':
            header('Content-Type: image/gif');
            break;
        case 'svg':
            header('Content-Type: image/svg+xml');
            break;
        default:
            header('Content-Type: text/plain');
    }
    
    readfile($filePath);
} else {
    // File not found, return 404
    http_response_code(404);
    echo '404 - File Not Found';
}
?>