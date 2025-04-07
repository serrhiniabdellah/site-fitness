<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Validate request method
Utils::validateMethod('POST');

try {
    // Get request data
    $data = Utils::getJsonData();
    
    // Validate required fields
    if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['first_name']) || !isset($data['last_name'])) {
        Utils::sendResponse(false, 'Missing required fields', null, 400);
    }
    
    // Validate token
    $tokenData = Utils::validateToken($data['token']);
    if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
        Utils::sendResponse(false, 'Invalid or expired token', null, 401);
    }
    
    // Sanitize input
    $userId = (int)$data['user_id'];
    $firstName = Utils::sanitizeInput($data['first_name']);
    $lastName = Utils::sanitizeInput($data['last_name']);
    $phone = isset($data['phone']) ? Utils::sanitizeInput($data['phone']) : null;
    
    // Create database connection
    $db = new Database();
    
    // Update user profile
    $db->query("UPDATE utilisateurs SET 
                prenom = :prenom, 
                nom = :nom, 
                telephone = :telephone 
                WHERE id_utilisateur = :id_utilisateur");
    
    $db->bind(':prenom', $firstName);
    $db->bind(':nom', $lastName);
    $db->bind(':telephone', $phone);
    $db->bind(':id_utilisateur', $userId);
    
    $success = $db->execute();
    
    if (!$success) {
        Utils::sendResponse(false, 'Failed to update profile', null, 500);
    }
    
    // Get updated user data
    $db->query("SELECT id_utilisateur, email, nom, prenom, telephone, est_admin FROM utilisateurs WHERE id_utilisateur = :id");
    $db->bind(':id', $userId);
    $user = $db->singleArray();
    
    if (!$user) {
        Utils::sendResponse(false, 'User not found', null, 404);
    }
    
    Utils::sendResponse(true, 'Profile updated successfully', ['user' => $user]);
} catch (Exception $e) {
    Utils::sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
}
?>
