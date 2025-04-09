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

// Required files
require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Invalid request method', 405);
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);
$userId = null;
$sessionId = null;

// Check if request is authenticated
$auth = new Auth($conn);
$isAuthenticated = $auth->validateToken();

// If authenticated, use user_id from token, otherwise use session_id
if ($isAuthenticated) {
    $userId = $auth->getUserId();
} else {
    // For guest users, require session_id
    if (isset($data['session_id']) && !empty($data['session_id'])) {
        $sessionId = $data['session_id'];
    } else {
        sendErrorResponse('Session ID is required for guest users');
    }
}

try {
    // Prepare delete statement based on authentication
    if ($userId) {
        $stmt = $conn->prepare("DELETE FROM cart WHERE id_utilisateur = ?");
        $stmt->bind_param("i", $userId);
    } else {
        $stmt = $conn->prepare("DELETE FROM cart WHERE session_id = ?");
        $stmt->bind_param("s", $sessionId);
    }
    
    $stmt->execute();
    
    sendResponse([
        'success' => true,
        'message' => 'Cart cleared successfully',
        'removed_items' => $stmt->affected_rows
    ]);
} catch (Exception $e) {
    sendErrorResponse('Error clearing cart: ' . $e->getMessage());
}

$conn->close();
