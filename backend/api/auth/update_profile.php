<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include required files
require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';
require_once '../utils/input.php'; // Include input sanitization utilities

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Check if data is valid
if (!$data || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['user_id'])) {
    sendResponse(['success' => false, 'message' => 'Invalid request data'], 400);
    exit;
}

// Sanitize input data
$firstName = sanitizeInput($data['first_name']);
$lastName = sanitizeInput($data['last_name']);
$phone = isset($data['phone']) ? sanitizeInput($data['phone']) : null;
$userId = (int) $data['user_id'];

// Check if user is authenticated
$auth = new Auth($conn);
if (!$auth->validateToken()) {
    sendResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    exit;
}

// Verify user ID matches authenticated user
$authenticatedUserId = $auth->getUserId();
if ($authenticatedUserId !== $userId && !$auth->isAdmin()) {
    sendResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    exit;
}

try {
    // Update user profile
    $stmt = $conn->prepare("UPDATE utilisateurs SET prenom = ?, nom = ?, telephone = ? WHERE id_utilisateur = ?");
    $stmt->bind_param("sssi", $firstName, $lastName, $phone, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true, 'message' => 'Profile updated successfully']);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to update profile']);
    }
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
}
?>
