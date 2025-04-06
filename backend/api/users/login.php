<?php
/**
 * User Login API
 */
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to a file for debugging
ini_set('log_errors', 1);
ini_set('error_log', '../../error_log.txt');

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

// For debugging: log all incoming requests
error_log('Users/Login API called with method: ' . $_SERVER['REQUEST_METHOD']);

// Parse JSON input
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

// Validate input
if (!$data || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request. Email and password are required.'
    ]);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

try {
    // Check if required files exist before including them
    $configFile = '../../config/config.php';
    $dbFile = '../../includes/Database.php';
    
    if (!file_exists($configFile)) {
        throw new Exception("Config file not found: $configFile");
    }
    
    if (!file_exists($dbFile)) {
        throw new Exception("Database file not found: $dbFile");
    }
    
    require_once $configFile;
    require_once $dbFile;
    
    // Verify Database class exists
    if (!class_exists('Database')) {
        throw new Exception('Database class not found');
    }
    
    $db = Database::getInstance();
    
    // Basic debugging - can the database connect?
    if (!$db) {
        throw new Exception('Failed to get database instance');
    }
    
    // Find user by email
    $query = "SELECT * FROM utilisateurs WHERE email = ?";
    error_log("Executing query: $query with email: $email");
    
    $user = $db->fetchOne($query, [$email]);
    
    if (!$user) {
        http_response_code(401); // Unauthorized
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }
    
    error_log("User found: " . json_encode($user));
    
    // Verify password
    if (!password_verify($password, $user['mot_de_passe'])) {
        http_response_code(401); // Unauthorized
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }
    
    // Generate simple token (in production, use a proper JWT library)
    $token = bin2hex(random_bytes(32));
    
    // Prepare user data for response (exclude password)
    $userData = [
        'id_utilisateur' => $user['id_utilisateur'],
        'prenom' => $user['prenom'],
        'nom' => $user['nom'],
        'email' => $user['email'],
        'role' => $user['role'],
        'token' => $token
    ];
    
    // Return success with token and user data
    $response = [
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => $userData
    ];
    
    error_log("Sending response: " . json_encode($response));
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    error_log('Exception trace: ' . $e->getTraceAsString());
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'message' => 'Login failed: ' . $e->getMessage(),
        'debug_info' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
