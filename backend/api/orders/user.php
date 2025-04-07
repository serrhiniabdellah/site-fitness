<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept POST requests
Utils::validateMethod('POST');

// Get request data
$data = Utils::getJsonData();

// Validate required fields
if (!isset($data['user_id']) || !isset($data['token'])) {
    Utils::sendResponse(false, 'Missing required fields', null, 400);
}

// Validate token
$tokenData = Utils::validateToken($data['token']);
if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
    Utils::sendResponse(false, 'Invalid or expired token', null, 401);
}

// Sanitize input
$userId = (int)Utils::sanitizeInput($data['user_id']);

// Create database connection
$db = new Database();

// Get user orders
$db->query("SELECT c.*, 
           (SELECT COUNT(*) FROM commande_items WHERE id_commande = c.id_commande) as item_count 
           FROM commandes c 
           WHERE c.id_utilisateur = :user_id 
           ORDER BY c.date_commande DESC");
$db->bind(':user_id', $userId);

$orders = $db->resultSetArray();

Utils::sendResponse(true, 'User orders retrieved successfully', ['orders' => $orders]);
?>
