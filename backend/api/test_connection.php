<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

/**
 * API Connection Test Endpoint
 * Sends a simple response to verify backend connectivity
 */

// Allow CORS to ensure this endpoint can be called from any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database test mode
$dbTest = isset($_GET['db']) && $_GET['db'] === '1';

// If DB test requested, try a database connection
if ($dbTest) {
    try {
        require_once '../../config.php';
        
        $testResult = array(
            'success' => true,
            'message' => 'Backend connection successful',
            'timestamp' => date('Y-m-d H:i:s'),
            'database' => array(
                'connected' => false,
                'message' => ''
            )
        );
        
        // Only test DB if constants exist
        if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASS') && defined('DB_NAME')) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                
                // Simple query to verify connection
                $stmt = $pdo->query("SELECT 'Connected to MySQL' as connection_status");
                $result = $stmt->fetch();
                
                $testResult['database'] = array(
                    'connected' => true,
                    'message' => $result['connection_status'],
                    'host' => DB_HOST,
                    'dbname' => DB_NAME
                );
            } catch (PDOException $e) {
                $testResult['database'] = array(
                    'connected' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage(),
                    'host' => DB_HOST,
                    'dbname' => DB_NAME
                );
            }
        } else {
            $testResult['database'] = array(
                'connected' => false,
                'message' => 'Database configuration not defined'
            );
        }
        
        echo json_encode($testResult);
    } catch (Exception $e) {
        $errorResponse = array(
            'success' => false,
            'message' => 'Error: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        );
        
        echo json_encode($errorResponse);
    }
} else {
    // Simple response without DB test
    $response = array(
        'success' => true,
        'message' => 'Backend connection successful',
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'php_version' => phpversion(),
        'extensions' => get_loaded_extensions(),
        'note' => 'Add ?db=1 to test database connection'
    );
    
    echo json_encode($response);
}
?>
