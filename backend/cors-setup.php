<?php
/**
 * CORS Headers Setup
 * Include this file at the top of all API PHP files
 */

// Allow requests from development server
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
// Allow credentials (cookies, authorization headers)
header("Access-Control-Allow-Credentials: true");
// Allow specific methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// Allow specific headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Just exit with 200 OK for preflight requests
    exit(0);
}

// Continue with the rest of your API logic below
?>
