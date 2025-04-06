<?php
/**
 * Login API Endpoint
 * 
 * This endpoint handles user authentication
 */
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to a file for debugging
ini_set('log_errors', 1);
ini_set('error_log', '../error_log.txt');

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// For debugging: log all incoming requests
error_log('Login API called with method: ' . $_SERVER['REQUEST_METHOD']);

// Get posted data
$input = file_get_contents('php://input');
error_log('Received input: ' . $input);

$data = json_decode($input, true);

// Check if JSON decoding failed
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON: ' . json_last_error_msg(),
        'input' => $input
    ]);
    exit;
}

// Check if required fields exist
if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

try {
    // Check if required files exist before including them
    $configFile = '../config/config.php';
    $userFile = '../includes/User.php';
    
    if (!file_exists($configFile)) {
        throw new Exception("Config file not found: $configFile");
    }
    
    if (!file_exists($userFile)) {
        throw new Exception("User class file not found: $userFile");
    }
    
    require_once $configFile;
    require_once $userFile;
    
    // Verify User class exists
    if (!class_exists('User')) {
        throw new Exception('User class not found');
    }
    
    // Create user instance
    $user = new User();
    
    // Basic debugging - is User class working properly?
    if (!$user) {
        throw new Exception('Failed to create User instance');
    }
    
    // Attempt to login
    error_log("Attempting login for email: " . $data['email']);
    $result = $user->login($data['email'], $data['password']);
    
    error_log("Login result: " . json_encode($result));

    if ($result['success']) {
        http_response_code(200); // OK
    } else {
        http_response_code(401); // Unauthorized
    }
    
    echo json_encode($result);
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    error_log('Exception trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'debug_info' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>