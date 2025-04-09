<?php
/**
 * Global Configuration File
 * This file holds all the configuration settings for the backend
 */

// Debug mode
define('CONFIG_DEBUG', true);

// Detect Docker environment
$is_docker = getenv('DB_HOST') === 'database';

// Database settings
define('DB_HOST', $is_docker ? getenv('DB_HOST') : 'localhost');
define('DB_NAME', $is_docker ? getenv('DB_NAME') : 'fitzone_db');
define('DB_USER', $is_docker ? getenv('DB_USER') : 'root');
define('DB_PASS', $is_docker ? getenv('DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');

// Application paths
define('ROOT_PATH', dirname(__FILE__));
define('API_PATH', ROOT_PATH . '/api');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');

// Allowed origins for CORS
$allowed_origins = array(
    'http://localhost',
    'http://localhost:80',
    'http://127.0.0.1',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'null' // For local development with file:// protocol
);
define('ALLOWED_ORIGINS', $allowed_origins);

// JWT Token secret
define('JWT_SECRET', 'your_secret_key_here_change_this_in_production');
define('JWT_EXPIRY', 3600); // 1 hour

// Logging
define('ENABLE_LOGGING', true);
define('LOG_FILE', ROOT_PATH . '/logs/app.log');

// Error reporting
if (CONFIG_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set('UTC');

// Check MySQL connection before defining database name
try {
    $testConn = new PDO("mysql:host=".DB_HOST, DB_USER, DB_PASS);
    $testConn = null; // Close connection
} catch (PDOException $e) {
    // Format error as JSON for API responses
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection error: ' . $e->getMessage(),
        'help' => 'Please check your MySQL credentials and ensure MySQL server is running.'
    ]);
    exit();
}

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

// Handle preflight OPTIONS request ONLY if cors-handler.php has not been loaded
// This is determined by checking if a specific flag is set
if (!defined('CORS_HANDLER_LOADED') && $_SERVER['REQUEST_METHOD'] == 'OPTIONS' && !headers_sent()) {
    // Get the requesting origin
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Set the correct Access-Control-Allow-Origin header
    if (in_array($origin, ALLOWED_ORIGINS) || $origin === 'null') {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
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
