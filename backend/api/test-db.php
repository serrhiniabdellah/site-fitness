<?php
/**
 * Simple Database Connection Check
 */
header('Content-Type: application/json');

// Display all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include configuration file
require_once '../config/config.php';

try {
    // Display available extensions
    $extensions = get_loaded_extensions();
    $mysql_extensions = array_filter($extensions, function($ext) {
        return strpos($ext, 'mysql') !== false || strpos($ext, 'pdo') !== false;
    });
    
    // Check if any MySQL extension is available
    if (in_array('mysqli', $extensions)) {
        // Use mysqli
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int)DB_PORT);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $result = $conn->query("SELECT 1 AS test");
        $row = $result->fetch_assoc();
        $connection_type = 'mysqli';
        $conn->close();
    } elseif (in_array('pdo_mysql', $extensions)) {
        // Use PDO
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $conn = new PDO($dsn, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $conn->query("SELECT 1 AS test");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $connection_type = 'pdo_mysql';
        $conn = null;
    } else {
        throw new Exception('No MySQL extensions available. Please enable mysqli or PDO MySQL extension in your PHP configuration.');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'connection_type' => $connection_type,
        'test_result' => $row,
        'available_extensions' => $extensions,
        'mysql_extensions' => $mysql_extensions
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $e->getMessage(),
        'php_version' => PHP_VERSION,
        'loaded_extensions' => get_loaded_extensions(),
        'connection_details' => [
            'host' => DB_HOST,
            'port' => DB_PORT,
            'database' => DB_NAME
        ]
    ]);
}
