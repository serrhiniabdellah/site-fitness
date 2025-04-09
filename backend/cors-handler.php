<?php
/**
 * Centralized CORS Handler
 * 
 * This file manages CORS headers for all API requests
 * Include this file at the top of all PHP API files
 */

// Set a flag to prevent duplicate headers
define('CORS_HANDLER_LOADED', true);

// Get the requesting origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Define allowed origins (match your frontend sources)
$allowed_origins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost',
    'http://localhost:80',
    'null' // For local file testing
];

// Set CORS headers if they haven't already been sent
if (!headers_sent()) {
    // Set appropriate Access-Control-Allow-Origin header
    if (in_array($origin, $allowed_origins) || substr($origin, 0, 16) === 'http://localhost') {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Credentials: true");
    } else {
        // For public resources, allow any origin
        header("Access-Control-Allow-Origin: *");
    }

    // Set other CORS headers
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Access-Control-Allow-Headers, Origin, Accept");
    header("Access-Control-Max-Age: 3600"); // Cache preflight for 1 hour
}

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0); // Stop processing for OPTIONS requests
}

// Continue with the rest of the script for non-OPTIONS requests
?>