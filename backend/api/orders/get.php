<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept POST requests
Utils::validateMethod('POST');

// Get request data
$data = Utils::getJsonData();

// Validate required fields
if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['order_id'])) {
    Utils::sendResponse(false, 'Missing required fields', null, 400);
}

// Validate token
$tokenData = Utils::validateToken($data['token']);
if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
    Utils::sendResponse(false, 'Invalid or expired token', null, 401);
}

// Sanitize input
$userId = (int)Utils::sanitizeInput($data['user_id']);
$orderId = (int)Utils::sanitizeInput($data['order_id']);

// Create database connection
$db = new Database();

// Get order details
$db->query("SELECT * FROM commandes WHERE id_commande = :id AND id_utilisateur = :user_id");
$db->bind(':id', $orderId);
$db->bind(':user_id', $userId);

$order = $db->singleArray();

if (!$order) {
    Utils::sendResponse(false, 'Order not found or does not belong to this user', null, 404);
}

// Get order items
$db->query("SELECT oi.*, p.nom_produit, p.image, v.nom as variant_nom 
            FROM commande_items oi
            JOIN produits p ON oi.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON oi.id_variant = v.id_variant
            WHERE oi.id_commande = :id");
$db->bind(':id', $orderId);

$items = $db->resultSetArray();

// Get shipping address
$db->query("SELECT * FROM adresses WHERE id_commande = :id AND type = 'shipping'");
$db->bind(':id', $orderId);
$shippingAddress = $db->singleArray();

// Get billing address
$db->query("SELECT * FROM adresses WHERE id_commande = :id AND type = 'billing'");
$db->bind(':id', $orderId);
$billingAddress = $db->singleArray();

// Combine all order data
$orderData = [
    'order_id' => $orderId,
    'date_commande' => $order['date_commande'],
    'statut_commande' => $order['statut_commande'],
    'sous_total' => $order['sous_total'],
    'frais_livraison' => $order['frais_livraison'],
    'total' => $order['total'],
    'methode_paiement' => $order['methode_paiement'],
    'notes' => $order['notes'],
    'items' => $items,
    'shipping_address' => $shippingAddress,
    'billing_address' => $billingAddress
];

Utils::sendResponse(true, 'Order retrieved successfully', ['order' => $orderData]);
?>
