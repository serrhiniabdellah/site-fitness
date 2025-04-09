<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


require_once '../../config.php';
require_once '../../utils.php';
require_once '../../db.php';

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::sendResponse(false, 'Invalid request method', null, 405);
}

try {
    // Get token from Authorization header or from request body
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') === 0) {
            $token = substr($auth, 7);
        }
    }
    
    // If no token in header, check request body
    if (!$token) {
        $data = Utils::getJsonData();
        if (isset($data['token'])) {
            $token = $data['token'];
        }
    }
    
    if (!$token) {
        Utils::sendResponse(false, 'No authentication token provided', null, 401);
    }
    
    // Validate token
    $tokenData = Utils::validateToken($token);
    if (!$tokenData) {
        Utils::sendResponse(false, 'Invalid or expired token', null, 401);
    }
    
    // Get user ID from token
    $userId = $tokenData['sub'];
    
    // Check if user exists and is active
    $db = new Database();
    $db->query("SELECT id_utilisateur, email, nom, prenom, telephone, est_admin, est_actif FROM utilisateurs WHERE id_utilisateur = :id");
    $db->bind(':id', $userId);
    $user = $db->singleArray();
    
    if (!$user) {
        Utils::sendResponse(false, 'User not found', null, 404);
    }
    
    if (!$user['est_actif']) {
        Utils::sendResponse(false, 'User account is inactive', null, 403);
    }
    
    // Update last login time
    $db->query("UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = :id");
    $db->bind(':id', $userId);
    $db->execute();
    
    // Return user data
    Utils::sendResponse(true, 'Session verified successfully', ['user' => $user]);
    
} catch (Exception $e) {
    Utils::sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
}
?>
