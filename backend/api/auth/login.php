<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept POST requests
Utils::validateMethod('POST');

try {
    // Get the request data
    $data = Utils::getJsonData();
    
    // Validate required fields
    if (!isset($data['email']) || !isset($data['password'])) {
        Utils::sendResponse(false, 'Email and password are required', null, 400);
    }
    
    // Sanitize input
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $password = htmlspecialchars($data['password']);
    
    // Create database connection
    $db = new Database();
    
    // Get user by email
    $db->query("SELECT * FROM utilisateurs WHERE email = :email");
    $db->bind(':email', $email);
    $user = $db->singleArray();
    
    if (!$user) {
        Utils::sendResponse(false, 'Invalid email or password', null, 401);
    }
    
    // Verify password
    if (!password_verify($password, $user['mot_de_passe'])) {
        Utils::sendResponse(false, 'Invalid email or password', null, 401);
    }
    
    // Generate token
    $token = Utils::generateToken($user['id_utilisateur']);
    
    // Update last login timestamp
    $db->query("UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = :id");
    $db->bind(':id', $user['id_utilisateur']);
    $db->execute();
    
    // Return user data without password
    unset($user['mot_de_passe']);
    $user['token'] = $token;
    
    Utils::sendResponse(true, 'Login successful', ['user' => $user]);
} catch (Exception $e) {
    Utils::sendResponse(false, 'Login failed: ' . $e->getMessage(), null, 500);
}
?>
