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

// Get loaded extensions
$extensions = get_loaded_extensions();
$mysql_extensions = array_filter($extensions, function($ext) {
    return strpos($ext, 'mysql') !== false || strpos($ext, 'pdo') !== false;
});

// Check for required PHP extensions
if (!in_array('mysqli', $extensions) && !in_array('pdo_mysql', $extensions)) {
    echo json_encode([
        'success' => false,
        'message' => 'MySQL extensions not available',
        'error' => 'You need to enable mysqli or pdo_mysql extension in your PHP configuration.',
        'php_version' => PHP_VERSION,
        'loaded_extensions' => $extensions,
        'instructions' => [
            'windows' => [
                'step1' => 'Edit php.ini file (usually in C:\\xampp\\php\\php.ini or C:\\php\\php.ini)',
                'step2' => 'Uncomment the line extension=mysqli by removing the semicolon at the beginning',
                'step3' => 'Uncomment the line extension=pdo_mysql by removing the semicolon',
                'step4' => 'Save the file and restart your PHP server'
            ],
            'linux' => [
                'step1' => 'Install PHP MySQL extensions:',
                'step2' => 'sudo apt-get install php-mysql (for Ubuntu/Debian)',
                'step3' => 'sudo yum install php-mysql (for CentOS/RHEL)',
                'step4' => 'Restart your web server'
            ],
            'macos' => [
                'step1' => 'If using Homebrew:',
                'step2' => 'brew install php',
                'step3' => 'Edit php.ini to uncomment the MySQL extensions',
                'step4' => 'Restart PHP'
            ]
        ]
    ]);
    exit;
}

// Try connecting to the database
try {
    if (in_array('mysqli', $extensions)) {
        // Use mysqli
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int)DB_PORT);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $result = $conn->query("SELECT 1 AS test");
        $row = $result->fetch_assoc();
        $connection_type = 'mysqli';
        
    } elseif (in_array('pdo_mysql', $extensions)) {
        // Use PDO
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $conn = new PDO($dsn, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $conn->query("SELECT 1 AS test");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $connection_type = 'pdo_mysql';
    } else {
        throw new Exception('No MySQL extensions available.');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'connection_type' => $connection_type,
        'test_result' => $row
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
}
