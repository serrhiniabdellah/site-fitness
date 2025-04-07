<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept POST requests
Utils::validateMethod('POST');

// Get request data
$data = Utils::getJsonData();

// Validate required fields
if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['product_id'])) {
    Utils::sendResponse(false, 'Missing required fields', null, 400);
}

// Sanitize input
$userId = (int)Utils::sanitizeInput($data['user_id']);
$productId = (int)Utils::sanitizeInput($data['product_id']);
$variantId = isset($data['variant_id']) ? (int)Utils::sanitizeInput($data['variant_id']) : null;

// Validate token
$tokenData = Utils::validateToken($data['token']);
if (!$tokenData || $tokenData['sub'] != $userId) {
    Utils::sendResponse(false, 'Invalid or expired token', null, 401);
}

// Create database connection
$db = new Database();

// Check if the item is in the cart
$db->query("SELECT * FROM cart WHERE id_utilisateur = :user_id AND id_produit = :product_id AND variant_id " . ($variantId ? "= :variant_id" : "IS NULL"));
$db->bind(':user_id', $userId);
$db->bind(':product_id', $productId);
if ($variantId) {
    $db->bind(':variant_id', $variantId);
}

$cartItem = $db->singleArray();

if (!$cartItem) {
    Utils::sendResponse(false, 'Item not found in cart', null, 404);
}

// Remove item from cart
$db->query("DELETE FROM cart WHERE id = :id");
$db->bind(':id', $cartItem['id']);

if (!$db->execute()) {
    Utils::sendResponse(false, 'Failed to remove item from cart', null, 500);
}

// Get updated cart
$db->query("SELECT c.*, p.nom_produit, p.prix, p.image, 
            v.nom as variant_nom, v.prix as variant_prix
            FROM cart c
            JOIN produits p ON c.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
            WHERE c.id_utilisateur = :user_id");
$db->bind(':user_id', $userId);

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

Utils::sendResponse(true, 'Item removed from cart successfully', ['cart' => $cart]);
?>
