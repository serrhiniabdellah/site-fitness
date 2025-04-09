<?php
// Disable any error reporting that might break the JSON output
error_reporting(0);
ini_set('display_errors', 0);

// Set basic headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple response
echo json_encode([
    'success' => true,
    'message' => 'Simple test successful',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);
?>