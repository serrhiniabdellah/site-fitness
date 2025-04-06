<?php
/**
 * User Profile Update API
 */
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set up logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/error_log.txt');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Parse JSON input
$input = file_get_contents('php://input');
error_log('Profile update input: ' . $input);

$data = json_decode($input, true);

// Validate input
if (!$data || !isset($data['user_id']) || !isset($data['token'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required authentication data'
    ]);
    exit;
}

try {
    // Include required files
    require_once __DIR__ . '/../../config/config.php';
    require_once __DIR__ . '/../../includes/Database.php';
    require_once __DIR__ . '/../../includes/User.php';
    
    // Create User instance
    $user = new User();
    
    // Prepare update data
    $updateData = [];
    if (isset($data['first_name'])) $updateData['prenom'] = $data['first_name'];
    if (isset($data['last_name'])) $updateData['nom'] = $data['last_name'];
    if (isset($data['email'])) $updateData['email'] = $data['email'];
    if (isset($data['phone'])) $updateData['telephone'] = $data['phone'];
    
    // Update user profile
    $result = $user->updateProfile($data['user_id'], $updateData);
    
    // Return result
    if ($result['success']) {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Profile update error: ' . $e->getMessage());
    error_log('Exception trace: ' . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Profile update failed: ' . $e->getMessage()
    ]);
}
?>
