<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// This is a simple test file to check if your PHP environment works correctly

try {
    // Basic PHP version check
    $phpVersion = phpversion();
    if (version_compare($phpVersion, '7.0.0', '<')) {
        throw new Exception("PHP version $phpVersion is too old. Please use PHP 7.0 or higher.");
    }
    
    // Check required extensions
    $requiredExtensions = ['mysqli', 'pdo', 'pdo_mysql', 'json'];
    $missingExtensions = [];
    
    foreach ($requiredExtensions as $ext) {
        if (!extension_loaded($ext)) {
            $missingExtensions[] = $ext;
        }
    }
    
    if (!empty($missingExtensions)) {
        throw new Exception("Missing required PHP extensions: " . implode(', ', $missingExtensions));
    }
    
    // Try to find and load the config file
    $configFile = __DIR__ . '/config/config.php';
    if (!file_exists($configFile)) {
        throw new Exception("Config file not found: $configFile");
    }
    
    // Output success
    echo json_encode([
        'success' => true,
        'message' => 'PHP environment check passed!',
        'data' => [
            'php_version' => $phpVersion,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'extensions' => get_loaded_extensions(),
            'config_file' => $configFile,
            'config_file_exists' => file_exists($configFile),
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
            'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
            'current_dir' => __DIR__
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'PHP environment check failed!',
        'error' => $e->getMessage()
    ]);
}
?>
