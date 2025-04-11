<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


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
           s.nom_statut as statut_commande
           FROM commandes c 
           JOIN statut_commande s ON c.id_statut = s.id_statut
           WHERE c.id_utilisateur = :user_id 
           ORDER BY c.date_commande DESC");
$db->bind(':user_id', $userId);

$orders = $db->resultSetArray();

// Fetch items for each order
foreach ($orders as &$order) {
    // Get order items
    $db->query("SELECT i.*, p.nom_produit, p.image as image_url, v.nom as variant_nom 
                FROM commande_items i
                JOIN produits p ON i.id_produit = p.id_produit
                LEFT JOIN variants_produit v ON i.id_variant = v.id_variant
                WHERE i.id_commande = :order_id");
    $db->bind(':order_id', $order['id_commande']);
    $items = $db->resultSetArray();
    
    // Add items to order
    $order['items'] = $items;
}

Utils::sendResponse(true, 'User orders retrieved successfully', ['orders' => $orders]);
?>
