<?php
/**
 * User Registration API
 */
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set up logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/error_log.txt');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Log request
error_log('Registration request received');

// Parse JSON input
$input = file_get_contents('php://input');
error_log('Raw registration input: ' . $input);

$data = json_decode($input, true);

// Check for valid JSON
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON: ' . json_last_error_msg(),
        'input' => $input
    ]);
    exit;
}

// Validate input
if (!$data || !isset($data['prenom']) || !isset($data['nom']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields. Required: first_name/prenom, last_name/nom, email, password',
        'received_data' => array_keys($data)
    ]);
    exit;
}

try {
    // Check required files
    $configFile = __DIR__ . '/../../config/config.php';
    $userFile = __DIR__ . '/../../includes/User.php';
    $dbFile = __DIR__ . '/../../includes/Database.php';
    
    if (!file_exists($configFile)) {
        throw new Exception("Config file not found: $configFile");
    }
    
    if (!file_exists($userFile)) {
        throw new Exception("User class file not found: $userFile");
    }
    
    if (!file_exists($dbFile)) {
        throw new Exception("Database class file not found: $dbFile");
    }
    
    // Include required files
    require_once $configFile;
    require_once $dbFile;
    require_once $userFile;
    
    // Create User instance
    $user = new User();
    
    // Registration data
    $userData = [
        'prenom' => $data['prenom'],
        'nom' => $data['nom'],
        'email' => $data['email'],
        'password' => $data['password'],
        'role' => 'user' // Default role
    ];
    
    // Register the user
    $result = $user->register($userData);
    
    // Return result
    if ($result['success']) {
        http_response_code(201); // Created
    } else {
        http_response_code(400); // Bad Request
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    error_log('Exception trace: ' . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed: ' . $e->getMessage(),
        'debug_info' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
