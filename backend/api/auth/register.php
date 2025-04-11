<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';
require_once '../../config.php';
require_once '../../utils.php';
require_once '../../db.php';

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::sendResponse(false, 'Invalid request method', null, 405);
}

// Get POST data
$data = Utils::getJsonData();

// Debug: Log received data
if(defined('CONFIG_DEBUG') && CONFIG_DEBUG) {
    error_log("Registration data received: " . json_encode($data));
}

// Check for empty request
if (empty($data) || !is_array($data)) {
    Utils::sendResponse(false, 'No registration data received', null, 400);
}

// Validate required fields with better error messages
$requiredFields = ['first_name', 'last_name', 'email', 'password'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        Utils::sendResponse(false, 'Missing required field: ' . $field, ['missing_field' => $field], 400);
    }
}

// Additional validation
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    Utils::sendResponse(false, 'Invalid email format', null, 400);
}

if (strlen($data['password']) < 8) {
    Utils::sendResponse(false, 'Password must be at least 8 characters', null, 400);
}

if (isset($data['confirm_password']) && $data['password'] !== $data['confirm_password']) {
    Utils::sendResponse(false, 'Passwords do not match', null, 400);
}

try {
    // Connect to database
    $db = new Database();
    
    // Check if user already exists
    $db->query("SELECT id_utilisateur FROM utilisateurs WHERE email = :email");
    $db->bind(':email', $data['email']);
    
    if ($db->single()) {
        Utils::sendResponse(false, 'Email already registered', null, 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Begin transaction
    $db->beginTransaction();
    
    // Insert user
    $db->query("INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, date_inscription) VALUES (:email, :password, :nom, :prenom, NOW())");
    $db->bind(':email', $data['email']);
    $db->bind(':password', $hashedPassword);
    $db->bind(':nom', $data['last_name']);
    $db->bind(':prenom', $data['first_name']);
    $db->execute();
    
    // Get inserted user ID
    $userId = $db->lastInsertId();
    
    // Commit transaction
    $db->endTransaction();
    
    // Generate JWT token
    $token = Utils::generateToken($userId);
    
    // Get user data for response
    $db->query("SELECT id_utilisateur, email, nom, prenom, est_admin FROM utilisateurs WHERE id_utilisateur = :id");
    $db->bind(':id', $userId);
    $user = $db->singleArray();
    
    // Return success response
    Utils::sendResponse(true, 'Registration successful', [
        'user' => $user,
        'token' => $token
    ]);
    
} catch (Exception $e) {
    // Rollback transaction if needed
    if (isset($db) && $db->inTransaction()) {
        $db->cancelTransaction();
    }
    
    Utils::sendResponse(false, 'Registration failed: ' . $e->getMessage(), null, 500);
}
?>
