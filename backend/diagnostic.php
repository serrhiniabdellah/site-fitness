<?php
/**
 * FitZone Backend Diagnostic Tool
 * 
 * This script checks critical components of the backend and reports status.
 * It will help identify connection issues between frontend and backend.
 */

// Allow this script to display errors for diagnostic purposes
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Define output format based on request
$isJson = isset($_GET['format']) && $_GET['format'] === 'json';
$results = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => array(),
    'environment' => array(
        'php_version' => phpversion(),
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
        'remote_addr' => $_SERVER['REMOTE_ADDR']
    )
);

// Helper function to report test results
function reportTest($name, $success, $message = '', $details = null) {
    global $results, $isJson;
    
    $results['tests'][$name] = array(
        'success' => $success,
        'message' => $message,
        'details' => $details
    );
    
    if (!$isJson) {
        $status = $success ? "✅ PASS" : "❌ FAIL";
        echo "<strong>$status - $name:</strong> $message<br>";
        if ($details) {
            echo "<pre>" . print_r($details, true) . "</pre>";
        }
        echo "<hr>";
    }
}

// Start HTML output if not JSON
if (!$isJson) {
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FitZone Backend Diagnostics</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1, h2 { color: #333; }
            .container { max-width: 1000px; margin: 0 auto; }
            hr { margin: 20px 0; border: 0; border-top: 1px solid #eee; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>FitZone Backend Diagnostics</h1>
            <p>Running diagnostics at ' . date('Y-m-d H:i:s') . '</p>
            <hr>
    ';
}

// Test 1: PHP Configuration
$phpModules = get_loaded_extensions();
$requiredModules = array('pdo', 'pdo_mysql', 'json', 'mbstring');
$missingModules = array_diff($requiredModules, $phpModules);

reportTest(
    'PHP Configuration', 
    count($missingModules) === 0,
    count($missingModules) === 0 
        ? "All required PHP modules are loaded" 
        : "Missing required PHP modules: " . implode(', ', $missingModules),
    array(
        'loaded_modules' => $phpModules
    )
);

// Test 2: Config File
$configFile = __DIR__ . '/config.php';
$configExists = file_exists($configFile);
reportTest(
    'Config File', 
    $configExists,
    $configExists ? "Config file found" : "Config file not found at: $configFile"
);

// Test 3: Database Connection
if ($configExists) {
    // Include config without executing all code
    try {
        // First attempt at a safer config inclusion
        $configContent = file_get_contents($configFile);
        preg_match_all('/define\s*\(\s*[\'"]([^\'"]*)[\'"]\s*,\s*(.*?)\s*\)\s*;/s', $configContent, $matches);
        
        $dbConfig = array();
        if (!empty($matches[1])) {
            for ($i = 0; $i < count($matches[1]); $i++) {
                $key = $matches[1][$i];
                $value = $matches[2][$i];
                if (in_array($key, ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'])) {
                    // Remove quotes if present
                    $value = trim($value);
                    if (substr($value, 0, 1) == "'" || substr($value, 0, 1) == '"') {
                        $value = substr($value, 1, -1);
                    }
                    $dbConfig[$key] = $value;
                }
            }
        }
        
        // If we couldn't extract, fallback to include
        if (count($dbConfig) < 3) {
            // Include config file but catch any errors
            include_once $configFile;
            $dbConfig = array(
                'DB_HOST' => defined('DB_HOST') ? DB_HOST : 'localhost',
                'DB_USER' => defined('DB_USER') ? DB_USER : 'root',
                'DB_PASS' => defined('DB_PASS') ? DB_PASS : '',
                'DB_NAME' => defined('DB_NAME') ? DB_NAME : 'fitzone_db'
            );
        }
        
        // Test connection without database first
        $dsn = "mysql:host=" . preg_replace('/:\d+$/', '', $dbConfig['DB_HOST']);
        if (strpos($dbConfig['DB_HOST'], ':') !== false) {
            list($host, $port) = explode(':', $dbConfig['DB_HOST']);
            $dsn .= ";port=$port";
        }
        
        // Connect to MySQL server (without specifying database)
        $conn = new PDO($dsn, $dbConfig['DB_USER'], $dbConfig['DB_PASS']);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        reportTest(
            'MySQL Server Connection', 
            true,
            "Successfully connected to MySQL server"
        );
        
        // Check database existence
        $stmt = $conn->query("SHOW DATABASES LIKE '" . $dbConfig['DB_NAME'] . "'");
        $dbExists = $stmt->rowCount() > 0;
        
        reportTest(
            'Database Existence',
            $dbExists,
            $dbExists ? "Database '{$dbConfig['DB_NAME']}' exists" : "Database '{$dbConfig['DB_NAME']}' does not exist"
        );
        
        // Test connection with database
        if ($dbExists) {
            try {
                $dsn .= ";dbname={$dbConfig['DB_NAME']}";
                $dbConn = new PDO($dsn, $dbConfig['DB_USER'], $dbConfig['DB_PASS']);
                $dbConn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Check tables
                $stmt = $dbConn->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Check essential tables
                $essentialTables = array('utilisateurs', 'produits', 'categories', 'commandes');
                $missingTables = array_diff($essentialTables, $tables);
                
                reportTest(
                    'Database Tables',
                    count($missingTables) === 0,
                    count($missingTables) === 0 
                        ? "All essential tables exist (" . count($tables) . " tables total)" 
                        : "Missing essential tables: " . implode(', ', $missingTables),
                    array('tables' => $tables)
                );
                
                // Check for test user
                if (in_array('utilisateurs', $tables)) {
                    $stmt = $dbConn->query("SELECT COUNT(*) FROM utilisateurs");
                    $userCount = $stmt->fetchColumn();
                    
                    reportTest(
                        'User Data',
                        $userCount > 0,
                        "Found $userCount users in database"
                    );
                }
                
            } catch (PDOException $e) {
                reportTest(
                    'Database Connection',
                    false,
                    "Failed to connect to database: " . $e->getMessage()
                );
            }
        }
        
    } catch (Exception $e) {
        reportTest(
            'Database Configuration',
            false,
            "Error processing database configuration: " . $e->getMessage()
        );
    }
}

// Test 4: File Permissions
$uploadDir = __DIR__ . '/../uploads';
$hasUploadsDir = file_exists($uploadDir) || mkdir($uploadDir, 0755, true);
$isWritable = $hasUploadsDir && is_writable($uploadDir);

reportTest(
    'File Permissions',
    $isWritable,
    $isWritable 
        ? "Upload directory is writable" 
        : "Upload directory doesn't exist or is not writable: $uploadDir"
);

// Test 5: CORS Configuration
$corsHandler = __DIR__ . '/api/cors-handler.php';
$hasCorsHandler = file_exists($corsHandler);

reportTest(
    'CORS Configuration',
    $hasCorsHandler,
    $hasCorsHandler 
        ? "CORS handler found" 
        : "CORS handler not found at: $corsHandler"
);

// Test 6: API Endpoints
$apiEndpoints = array(
    'Main API' => '/api/index.php',
    'Authentication' => '/api/auth/login.php',
    'Products' => '/api/products/index.php',
);

foreach ($apiEndpoints as $name => $endpoint) {
    $file = __DIR__ . $endpoint;
    $endpointExists = file_exists($file);
    
    reportTest(
        "API Endpoint: $name",
        $endpointExists,
        $endpointExists 
            ? "Endpoint file exists: $endpoint" 
            : "Endpoint file missing: $file"
    );
}

// Output full diagnostics in JSON format if requested
if ($isJson) {
    header('Content-Type: application/json');
    echo json_encode($results, JSON_PRETTY_PRINT);
} else {
    // Finish HTML output
    echo '
            <h2>Summary</h2>
            <p>Total tests: ' . count($results['tests']) . '</p>
            <p>Passed: ' . count(array_filter($results['tests'], function($test) { return $test['success']; })) . '</p>
            <p>Failed: ' . count(array_filter($results['tests'], function($test) { return !$test['success']; })) . '</p>
            
            <h2>Environment Information</h2>
            <pre>' . print_r($results['environment'], true) . '</pre>
            
            <p><a href="?format=json">View as JSON</a></p>
        </div>
    </body>
    </html>';
}
?>