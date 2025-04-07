<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept POST requests
Utils::validateMethod('POST');

// Get request data
$data = Utils::getJsonData();

// Validate required fields
if (!isset($data['user_id']) || !isset($data['token']) || !isset($data['first_name']) || 
    !isset($data['last_name']) || !isset($data['email']) || !isset($data['address']) || 
    !isset($data['city']) || !isset($data['postal_code']) || !isset($data['country']) || 
    !isset($data['payment_method'])) {
    Utils::sendResponse(false, 'Missing required fields', null, 400);
}

// Validate token
$tokenData = Utils::validateToken($data['token']);
if (!$tokenData || $tokenData['sub'] != $data['user_id']) {
    Utils::sendResponse(false, 'Invalid or expired token', null, 401);
}

// Sanitize input
$userId = (int)Utils::sanitizeInput($data['user_id']);
$firstName = Utils::sanitizeInput($data['first_name']);
$lastName = Utils::sanitizeInput($data['last_name']);
$email = Utils::sanitizeInput($data['email']);
$phone = isset($data['phone']) ? Utils::sanitizeInput($data['phone']) : null;
$address = Utils::sanitizeInput($data['address']);
$address2 = isset($data['address2']) ? Utils::sanitizeInput($data['address2']) : null;
$city = Utils::sanitizeInput($data['city']);
$postalCode = Utils::sanitizeInput($data['postal_code']);
$country = Utils::sanitizeInput($data['country']);
$orderNotes = isset($data['order_notes']) ? Utils::sanitizeInput($data['order_notes']) : null;
$paymentMethod = Utils::sanitizeInput($data['payment_method']);

// Create database connection
$db = new Database();

// Start transaction
$db->beginTransaction();

try {
    // Get cart items
    $db->query("SELECT c.*, p.nom_produit, p.prix, p.stock, 
                v.nom as variant_nom, v.prix as variant_prix, v.stock as variant_stock
                FROM cart c
                JOIN produits p ON c.id_produit = p.id_produit
                LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
                WHERE c.id_utilisateur = :user_id");
    $db->bind(':user_id', $userId);

    $cartItems = $db->resultSetArray();

    if (empty($cartItems)) {
        Utils::sendResponse(false, 'Cart is empty', null, 400);
    }

    // Calculate order totals
    $subtotal = 0;
    $shippingCost = 0; // Free shipping for now
    
    foreach ($cartItems as $item) {
        // Use variant price if available, otherwise use product price
        $price = $item['variant_prix'] ? $item['variant_prix'] : $item['prix'];
        $subtotal += $price * $item['quantity'];
        
        // Check stock availability
        $stockToCheck = $item['variant_id'] ? $item['variant_stock'] : $item['stock'];
        
        if ($item['quantity'] > $stockToCheck) {
            $db->cancelTransaction();
            Utils::sendResponse(false, "Not enough stock available for {$item['nom_produit']}", null, 400);
        }
    }
    
    $total = $subtotal + $shippingCost;

    // Create order
    $db->query("INSERT INTO commandes (id_utilisateur, statut_commande, sous_total, frais_livraison, total, 
               methode_paiement, notes, date_commande) 
               VALUES (:user_id, 'pending', :subtotal, :shipping, :total, :payment_method, :notes, NOW())");
    $db->bind(':user_id', $userId);
    $db->bind(':subtotal', $subtotal);
    $db->bind(':shipping', $shippingCost);
    $db->bind(':total', $total);
    $db->bind(':payment_method', $paymentMethod);
    $db->bind(':notes', $orderNotes);
    
    if (!$db->execute()) {
        $db->cancelTransaction();
        Utils::sendResponse(false, 'Failed to create order', null, 500);
    }
    
    $orderId = $db->lastInsertId();

    // Create shipping address
    $db->query("INSERT INTO adresses (id_commande, type, prenom, nom, telephone, adresse, adresse2, ville, 
               code_postal, pays) 
               VALUES (:order_id, 'shipping', :first_name, :last_name, :phone, :address, :address2, :city, 
               :postal_code, :country)");
    $db->bind(':order_id', $orderId);
    $db->bind(':first_name', $firstName);
    $db->bind(':last_name', $lastName);
    $db->bind(':phone', $phone);
    $db->bind(':address', $address);
    $db->bind(':address2', $address2);
    $db->bind(':city', $city);
    $db->bind(':postal_code', $postalCode);
    $db->bind(':country', $country);
    
    if (!$db->execute()) {
        $db->cancelTransaction();
        Utils::sendResponse(false, 'Failed to create shipping address', null, 500);
    }

    // Create billing address (same as shipping for now)
    $db->query("INSERT INTO adresses (id_commande, type, prenom, nom, telephone, adresse, adresse2, ville, 
               code_postal, pays) 
               VALUES (:order_id, 'billing', :first_name, :last_name, :phone, :address, :address2, :city, 
               :postal_code, :country)");
    $db->bind(':order_id', $orderId);
    $db->bind(':first_name', $firstName);
    $db->bind(':last_name', $lastName);
    $db->bind(':phone', $phone);
    $db->bind(':address', $address);
    $db->bind(':address2', $address2);
    $db->bind(':city', $city);
    $db->bind(':postal_code', $postalCode);
    $db->bind(':country', $country);
    
    if (!$db->execute()) {
        $db->cancelTransaction();
        Utils::sendResponse(false, 'Failed to create billing address', null, 500);
    }

    // Add order items and update stock
    foreach ($cartItems as $item) {
        // Use variant price if available, otherwise use product price
        $price = $item['variant_prix'] ? $item['variant_prix'] : $item['prix'];
        
        $db->query("INSERT INTO commande_items (id_commande, id_produit, id_variant, quantite, prix) 
                   VALUES (:order_id, :product_id, :variant_id, :quantity, :price)");
        $db->bind(':order_id', $orderId);
        $db->bind(':product_id', $item['id_produit']);
        $db->bind(':variant_id', $item['variant_id']);
        $db->bind(':quantity', $item['quantity']);
        $db->bind(':price', $price);
        
        if (!$db->execute()) {
            $db->cancelTransaction();
            Utils::sendResponse(false, 'Failed to create order item', null, 500);
        }
        
        // Update stock
        if ($item['variant_id']) {
            $db->query("UPDATE variants_produit SET stock = stock - :quantity WHERE id_variant = :id");
            $db->bind(':quantity', $item['quantity']);
            $db->bind(':id', $item['variant_id']);
        } else {
            $db->query("UPDATE produits SET stock = stock - :quantity WHERE id_produit = :id");
            $db->bind(':quantity', $item['quantity']);
            $db->bind(':id', $item['id_produit']);
        }
        
        if (!$db->execute()) {
            $db->cancelTransaction();
            Utils::sendResponse(false, 'Failed to update stock', null, 500);
        }
    }

    // Clear user's cart
    $db->query("DELETE FROM cart WHERE id_utilisateur = :user_id");
    $db->bind(':user_id', $userId);
    $db->execute();

    // Commit transaction
    $db->endTransaction();

    Utils::sendResponse(true, 'Order created successfully', ['order_id' => $orderId]);
    
} catch (Exception $e) {
    $db->cancelTransaction();
    Utils::sendResponse(false, 'Error processing order: ' . $e->getMessage(), null, 500);
}
?>
