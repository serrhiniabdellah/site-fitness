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
    Utils::sendResponse(false, 'User ID and token are required', null, 400);
}

// Validate token
$tokenData = Utils::validateToken($data['token']);
if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
    Utils::sendResponse(false, 'Invalid or expired token', null, 401);
}

// Create database connection
$db = new Database();

// Get cart items
$db->query("SELECT c.*, p.nom_produit, p.prix, p.image, p.stock,
            v.nom as variant_nom, v.prix as variant_prix
            FROM cart c
            JOIN produits p ON c.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
            WHERE c.id_utilisateur = :user_id");
$db->bind(':user_id', $data['user_id']);

$items = $db->resultSetArray();

// Calculate cart totals
$itemCount = 0;
$subtotal = 0;

foreach ($items as &$item) {
    $itemCount += $item['quantity'];
    
    // Use variant price if available, otherwise use product price
    $price = $item['variant_prix'] ? $item['variant_prix'] : $item['prix'];
    $item['prix'] = $price;
    
    $subtotal += $price * $item['quantity'];
}

$cart = [
    'items' => $items,
    'item_count' => $itemCount,
    'subtotal' => $subtotal
];

Utils::sendResponse(true, 'Cart retrieved successfully', ['cart' => $cart]);
?>
