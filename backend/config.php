<?php
// Enable debug mode for development
define('CONFIG_DEBUG', true);

// Enable error handling that won't break JSON responses
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Database configuration - Updated with correct port number from my.cnf
define('DB_HOST', 'localhost:3307'); // Adding port 3307 as specified in your MySQL config
define('DB_USER', 'root'); // Replace with your database username
define('DB_PASS', ''); // If your MySQL root user has a password, add it here

// JWT Secret for authentication tokens - This must be defined for token generation
define('JWT_SECRET', 'fitzone_super_secure_secret_key_2025'); // Replace with a strong random string in production

// Check MySQL connection before defining database name
try {
    $testConn = new PDO("mysql:host=".DB_HOST, DB_USER, DB_PASS);
    $testConn = null; // Close connection
} catch (PDOException $e) {
    // Format error as JSON for API responses
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection error: ' . $e->getMessage(),
        'help' => 'Please check your MySQL credentials and ensure MySQL server is running on port 3307.'
    ]);
    exit();
}

define('DB_NAME', 'fitzone_db');

// Determine the site path more reliably
$documentRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
$scriptPath = str_replace('\\', '/', dirname($_SERVER['SCRIPT_FILENAME']));
$relPath = str_replace($documentRoot, '', $scriptPath);
$siteRoot = str_replace('/backend', '', $relPath);

// Site configuration
define('SITE_URL', 'http://localhost' . $siteRoot);
define('UPLOAD_DIR', $documentRoot . $siteRoot . '/uploads/');
define('UPLOAD_URL', 'http://localhost' . $siteRoot . '/uploads');

// Ensure uploads directory exists
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Session timeout (in seconds)
define('SESSION_TIMEOUT', 3600); // 1 hour

// CORS settings for Live Server
header('Access-Control-Allow-Origin: http://127.0.0.1:5500');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Custom error handler to ensure JSON output even on PHP errors
function jsonErrorHandler($errno, $errstr, $errfile, $errline) {
    $error = [
        'success' => false,
        'message' => 'PHP Error: ' . $errstr,
        'error_details' => [
            'file' => basename($errfile),
            'line' => $errline
        ]
    ];
    
    echo json_encode($error);
    exit;
}
set_error_handler('jsonErrorHandler', E_ALL & ~E_NOTICE & ~E_WARNING);

// Register shutdown function to catch fatal errors
function fatalErrorHandler() {
    $error = error_get_last();
    
    if ($error !== null && ($error['type'] === E_ERROR || $error['type'] === E_PARSE)) {
        header('Content-Type: application/json');
        $errorResponse = [
            'success' => false,
            'message' => 'Fatal PHP Error: ' . $error['message'],
            'error_details' => [
                'file' => basename($error['file']),
                'line' => $error['line']
            ]
        ];
        
        echo json_encode($errorResponse);
    }
}
register_shutdown_function('fatalErrorHandler');
?>
