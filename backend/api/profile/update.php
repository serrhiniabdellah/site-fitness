<?php
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
require_once '../utils/input.php';

// Check authentication
$auth = new Auth($conn);
if (!$auth->validateToken()) {
    sendResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    exit;
}

// Get authenticated user ID
$authUserId = $auth->getUserId();

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Validate input data
if (!$data || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['user_id'])) {
    sendResponse(['success' => false, 'message' => 'Invalid request data'], 400);
    exit;
}

// Sanitize and extract data
$firstName = sanitizeInput($data['first_name']);
$lastName = sanitizeInput($data['last_name']);
$phone = isset($data['phone']) ? sanitizeInput($data['phone']) : null;
$userId = (int) $data['user_id'];

// Security check: Make sure user can only update their own profile unless they're an admin
if ($authUserId !== $userId && !$auth->isAdmin()) {
    sendResponse(['success' => false, 'message' => 'You can only update your own profile'], 403);
    exit;
}

try {
    // Update user profile in the database
    $stmt = $conn->prepare("UPDATE utilisateurs SET prenom = ?, nom = ?, telephone = ? WHERE id_utilisateur = ?");
    $stmt->bind_param("sssi", $firstName, $lastName, $phone, $userId);
    
    if ($stmt->execute()) {
        // Get updated user data
        $stmt = $conn->prepare("SELECT id_utilisateur, email, prenom, nom, telephone, est_admin FROM utilisateurs WHERE id_utilisateur = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        // Generate new token with updated data
        $token = bin2hex(random_bytes(32)); // Generate a new token
        
        sendResponse([
            'success' => true, 
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ]);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to update profile: ' . $stmt->error], 500);
    }
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
}
?>
