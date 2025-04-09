<?php
// Include CORS handler at the top
require_once __DIR__ . '/cors-handler.php';

// Set appropriate content type
header('Content-Type: application/json');

// Return a status message for anyone accessing the backend root
echo json_encode([
    'status' => 'success',
    'message' => 'FitZone Backend API is running',
    'api_endpoint' => '/api',
    'documentation' => 'Access /api/ping.php or /api/test.php to test the API',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>