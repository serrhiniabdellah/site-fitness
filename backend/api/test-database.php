<?php
/**
 * Database Connection Test
 */
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Include configuration
    $configFile = __DIR__ . '/../config/config.php';
    
    if (!file_exists($configFile)) {
        throw new Exception("Config file not found at: $configFile");
    }
    
    require_once $configFile;
    
    // Test direct MySQL connection
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($mysqli->connect_error) {
        throw new Exception("Direct MySQL connection failed: " . $mysqli->connect_error);
    }
    
    // Test a simple query
    $result = $mysqli->query("SELECT 'Database connection is working!' as message");
    $row = $result->fetch_assoc();
    $message = $row['message'];
    
    // Get database status info
    $dbInfo = [];
    $result = $mysqli->query("SHOW TABLES");
    $tables = [];
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    $dbInfo['tables'] = $tables;
    
    // Include Database class
    $dbClassFile = __DIR__ . '/../includes/Database.php';
    if (file_exists($dbClassFile)) {
        require_once $dbClassFile;
        
        if (class_exists('Database')) {
            try {
                $db = Database::getInstance();
                
                // Try to fetch users count
                $userCount = $db->fetchOne("SELECT COUNT(*) as count FROM utilisateurs");
                $dbInfo['user_count'] = $userCount['count'];
                
                $dbInfo['db_class_working'] = true;
            } catch (Exception $dbClassEx) {
                $dbInfo['db_class_error'] = $dbClassEx->getMessage();
                $dbInfo['db_class_working'] = false;
            }
        } else {
            $dbInfo['db_class_exists'] = false;
        }
    } else {
        $dbInfo['db_class_file_exists'] = false;
    }
    
    // Close connection
    $mysqli->close();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => $message,
        'database' => DB_NAME,
        'connection' => [
            'host' => DB_HOST,
            'user' => DB_USER,
            'database_name' => DB_NAME
        ],
        'php_version' => PHP_VERSION,
        'db_info' => $dbInfo,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection test failed',
        'error' => $e->getMessage(),
        'php_version' => PHP_VERSION,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
