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
    if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['current_password']) || !isset($data['new_password'])) {
        Utils::sendResponse(false, 'Missing required fields', null, 400);
    }
    
    // Validate token
    $tokenData = Utils::validateToken($data['token']);
    if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
        Utils::sendResponse(false, 'Invalid or expired token', null, 401);
    }
    
    // Create database connection
    $db = new Database();
    
    // Get user's current password
    $db->query("SELECT mot_de_passe FROM utilisateurs WHERE id_utilisateur = :id");
    $db->bind(':id', (int)$data['user_id']);
    $user = $db->singleArray();
    
    if (!$user) {
        Utils::sendResponse(false, 'User not found', null, 404);
    }
    
    // Verify current password
    if (!password_verify($data['current_password'], $user['mot_de_passe'])) {
        Utils::sendResponse(false, 'Current password is incorrect', null, 401);
    }
    
    // Hash new password
    $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
    
    // Update password
    $db->query("UPDATE utilisateurs SET mot_de_passe = :password WHERE id_utilisateur = :id");
    $db->bind(':password', $hashedPassword);
    $db->bind(':id', (int)$data['user_id']);
    
    $success = $db->execute();
    
    if (!$success) {
        Utils::sendResponse(false, 'Failed to update password', null, 500);
    }
    
    Utils::sendResponse(true, 'Password updated successfully');
} catch (Exception $e) {
    Utils::sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
}
?>
