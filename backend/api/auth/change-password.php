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

require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Check authentication
$auth = new Auth($conn);
if (!$auth->validateToken()) {
    sendResponse(['success' => false, 'message' => 'Authentication required'], 401);
    exit;
}

// Get authenticated user ID
$userId = $auth->getUserId();

// Validate input data
if (!isset($data['current_password']) || !isset($data['new_password']) || !isset($data['user_id'])) {
    sendResponse(['success' => false, 'message' => 'Missing required fields'], 400);
    exit;
}

// Check if the user is trying to change their own password or if they are an admin
if ($userId != $data['user_id'] && !$auth->isAdmin()) {
    sendResponse(['success' => false, 'message' => 'You can only change your own password'], 403);
    exit;
}

// Get current user from database
$stmt = $conn->prepare("SELECT mot_de_passe FROM utilisateurs WHERE id_utilisateur = ?");
$stmt->bind_param("i", $data['user_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendResponse(['success' => false, 'message' => 'User not found'], 404);
    exit;
}

$user = $result->fetch_assoc();

// Verify current password
if (!password_verify($data['current_password'], $user['mot_de_passe'])) {
    sendResponse(['success' => false, 'message' => 'Current password is incorrect'], 401);
    exit;
}

// Hash the new password
$hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);

// Update the password
$stmt = $conn->prepare("UPDATE utilisateurs SET mot_de_passe = ? WHERE id_utilisateur = ?");
$stmt->bind_param("si", $hashedPassword, $data['user_id']);

if ($stmt->execute()) {
    sendResponse(['success' => true, 'message' => 'Password changed successfully']);
} else {
    sendResponse(['success' => false, 'message' => 'Failed to change password: ' . $stmt->error], 500);
}
?>
