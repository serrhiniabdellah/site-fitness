<?php
/**
 * Register API Endpoint
 * 
 * This endpoint handles user registration
 */

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include necessary files
require_once '../config/config.php';
require_once '../includes/User.php';

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get posted data
$data = json_decode(file_get_contents('php://input'), true);

// Check if required fields exist
if (!isset($data['email']) || !isset($data['password']) || 
    !isset($data['nom']) || !isset($data['prenom'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Validate email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate password (at least 8 characters)
if (strlen($data['password']) < 8) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long']);
    exit;
}

// Create user instance
$user = new User();

// Register user
$result = $user->register(
    $data['nom'],
    $data['prenom'],
    $data['email'],
    $data['password'],
    isset($data['newsletter']) ? $data['newsletter'] : false
);

if ($result['success']) {
    http_response_code(201); // Created
} else {
    http_response_code(400); // Bad Request
}

echo json_encode($result);