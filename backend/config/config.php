<?php
/**
 * Database Configuration
 * 
 * This file contains the configuration parameters for connecting to the database
 */

// Database connection parameters - updated with confirmed working settings
define('DB_HOST', 'localhost');  // Using 127.0.0.1 instead of localhost to avoid socket issues
define('DB_PORT', 3307);        // Confirmed working port
define('DB_NAME', 'fitzone_db'); 
define('DB_USER', 'root');
define('DB_PASS', '');          // No password as shown in your connection string

// Application settings
define('BASE_URL', 'http://127.0.0.1:5500');
define('SITE_NAME', 'FitZone');

// Security settings
define('SECRET_KEY', 'your-secret-key-here');  // Used for token generation

// File upload settings
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('UPLOAD_URL', BASE_URL . '/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);  // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif']);

// Error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// API URL
define('API_URL', 'http://127.0.0.1:5500/backend/api');

// Set up error logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error_log.txt');

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}
?>