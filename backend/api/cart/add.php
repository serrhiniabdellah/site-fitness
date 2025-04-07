<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

try {
    // Only accept POST requests
    Utils::validateMethod('POST');

    // Get request data
    $data = Utils::getJsonData();

    // Validate required fields
    if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['product_id']) || !isset($data['quantity'])) {
        Utils::sendResponse(false, 'Missing required fields', null, 400);
    }

    // Sanitize input
    $userId = (int)Utils::sanitizeInput($data['user_id']);
    $productId = (int)Utils::sanitizeInput($data['product_id']);
    $quantity = (int)Utils::sanitizeInput($data['quantity']);
    $variantId = isset($data['variant_id']) ? (int)Utils::sanitizeInput($data['variant_id']) : null;

    // Validate token
    $tokenData = Utils::validateToken($data['token']);
    if (!$tokenData || $tokenData['sub'] != $userId) {
        Utils::sendResponse(false, 'Invalid or expired token', null, 401);
    }

    if ($quantity <= 0) {
        Utils::sendResponse(false, 'Quantity must be greater than 0', null, 400);
    }

    // Create database connection
    $db = new Database();

    // Check if product exists
    $db->query("SELECT * FROM produits WHERE id_produit = :id");
    $db->bind(':id', $productId);
    $product = $db->singleArray();

    if (!$product) {
        Utils::sendResponse(false, 'Product not found', null, 404);
    }

    // Check if variant exists if provided
    if ($variantId) {
        $db->query("SELECT * FROM variants_produit WHERE id_variant = :id AND id_produit = :product_id");
        $db->bind(':id', $variantId);
        $db->bind(':product_id', $productId);
        $variant = $db->singleArray();

        if (!$variant) {
            Utils::sendResponse(false, 'Variant not found for this product', null, 404);
        }
    }

    // Check if the item is already in the cart
    $db->query("SELECT * FROM cart WHERE id_utilisateur = :user_id AND id_produit = :product_id AND variant_id " . ($variantId ? "= :variant_id" : "IS NULL"));
    $db->bind(':user_id', $userId);
    $db->bind(':product_id', $productId);
    if ($variantId) {
        $db->bind(':variant_id', $variantId);
    }

    $cartItem = $db->singleArray();

    if ($cartItem) {
        // Update quantity if item already exists
        $newQuantity = $cartItem['quantity'] + $quantity;
        
        // Check if the new quantity exceeds stock
        if ($newQuantity > $product['stock']) {
            Utils::sendResponse(false, 'Not enough stock available', null, 400);
        }
        
        $db->query("UPDATE cart SET quantity = :quantity, updated_at = NOW() WHERE id = :id");
        $db->bind(':quantity', $newQuantity);
        $db->bind(':id', $cartItem['id']);
        
        if (!$db->execute()) {
            Utils::sendResponse(false, 'Failed to update cart', null, 500);
        }
    } else {
        // Check if the quantity exceeds stock
        if ($quantity > $product['stock']) {
            Utils::sendResponse(false, 'Not enough stock available', null, 400);
        }
        
        // Add new item to cart
        $db->query("INSERT INTO cart (id_utilisateur, id_produit, variant_id, quantity, created_at, updated_at) 
                    VALUES (:user_id, :product_id, :variant_id, :quantity, NOW(), NOW())");
        $db->bind(':user_id', $userId);
        $db->bind(':product_id', $productId);
        $db->bind(':variant_id', $variantId);
        $db->bind(':quantity', $quantity);
        
        if (!$db->execute()) {
            Utils::sendResponse(false, 'Failed to add item to cart', null, 500);
        }
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

    Utils::sendResponse(true, 'Item added to cart successfully', ['cart' => $cart]);
} catch (Exception $e) {
    Utils::sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
}
?>
