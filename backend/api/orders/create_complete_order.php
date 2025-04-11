<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Fix include paths - use the correct paths relative to the backend directory
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../utils.php';

// Get JSON data from request
$rawData = file_get_contents('php://input');
$jsonData = json_decode($rawData, true);

// Check authentication - extract token from Authorization header
$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    // Extract token from Bearer token format
    if (strpos($headers['Authorization'], 'Bearer ') === 0) {
        $token = substr($headers['Authorization'], 7);
    }
}

// If no token in header, check if it's in the JSON data
if (!$token && isset($jsonData['token'])) {
    $token = $jsonData['token'];
}

// Validate the token
if (!$token) {
    Utils::sendResponse(false, 'Authentication required: No token provided', null, 401);
    exit;
}

// Validate the token and get user data
$userData = Utils::validateToken($token);
if (!$userData) {
    Utils::sendResponse(false, 'Authentication required: Invalid token', null, 401);
    exit;
}

// Get authenticated user ID
$userId = $userData['sub'];

// Validate input data
if (!isset($jsonData['shipping_info']) || !isset($jsonData['cart']) || !isset($jsonData['payment_method'])) {
    Utils::sendResponse(false, 'Missing required order information', null, 400);
    exit;
}

// Use the validated JSON data
$data = $jsonData;

// Set MySQL mode to ensure proper AUTO_INCREMENT behavior
$db = new Database();
// Instead of getting the raw connection and using mysqli methods,
// use the Database class methods which are designed for PDO
$db->query("SET sql_mode = ''");
$db->execute();

// Start transaction for database integrity
$db->beginTransaction();

try {
    // 1. First, create the address to get an ID
    $shipping = $data['shipping_info'];
    // Use PDO parameter binding instead of real_escape_string
    $firstname = $shipping['first_name'];
    $lastname = $shipping['last_name'];
    $email = isset($shipping['email']) ? $shipping['email'] : '';
    $phone = isset($shipping['phone']) ? $shipping['phone'] : '';
    $address = $shipping['address'];
    $city = $shipping['city'];
    $postalCode = $shipping['postal_code'];
    $country = $shipping['country'];
    $addressType = 'shipping';
    
    // Create an address first - use the existing structure without email field
    $db->query("
        INSERT INTO adresses 
            (id_utilisateur, type, prenom, nom, telephone, adresse, ville, code_postal, pays) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $db->bind(1, $userId);
    $db->bind(2, $addressType);
    $db->bind(3, $firstname);
    $db->bind(4, $lastname);
    $db->bind(5, $phone);
    $db->bind(6, $address);
    $db->bind(7, $city);
    $db->bind(8, $postalCode);
    $db->bind(9, $country);
    
    if (!$db->execute()) {
        throw new Exception("Failed to create address");
    }
    
    // Get the address ID
    $addressId = $db->lastInsertId();
    
    // 2. Create order record with the address ID
    $subtotal = isset($data['cart']['total']) ? floatval($data['cart']['total']) : 0;
    $shippingCost = isset($data['shipping_cost']) ? floatval($data['shipping_cost']) : 0;
    $total = $subtotal + $shippingCost;
    
    // Get payment method
    $paymentMethod = $data['payment_method'];
    
    // Default status ID is 1 (pending)
    $statusId = 1;
    
    // Create order in database with the address ID
    $db->query("
        INSERT INTO commandes 
            (id_utilisateur, id_statut, sous_total, frais_livraison, total, methode_paiement) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $db->bind(1, $userId);
    $db->bind(2, $statusId);
    $db->bind(3, $subtotal);
    $db->bind(4, $shippingCost);
    $db->bind(5, $total);
    $db->bind(6, $paymentMethod);
    
    if (!$db->execute()) {
        throw new Exception("Failed to create order");
    }
    
    // Get the order ID
    $orderId = $db->lastInsertId();
    
    // 3. Update address with order ID for reference
    $db->query("UPDATE adresses SET id_commande = ? WHERE id_adresse = ?");
    $db->bind(1, $orderId);
    $db->bind(2, $addressId);
    
    if (!$db->execute()) {
        throw new Exception("Failed to update address with order ID");
    }
    
    // 4. Add order items
    if (!isset($data['cart']['items']) || !is_array($data['cart']['items']) || count($data['cart']['items']) === 0) {
        throw new Exception("Cart is empty");
    }
    
    foreach ($data['cart']['items'] as $item) {
        // Extract all possible product ID formats
        $productId = isset($item['id_produit']) ? intval($item['id_produit']) : 
                    (isset($item['id']) ? intval($item['id']) : 0);
                    
        // Handle variant ID - might be null
        $variantId = isset($item['variant_id']) ? intval($item['variant_id']) : null;
        
        // Get quantity, ensure it's a positive integer
        $quantity = max(1, intval($item['quantity'] ?? 1));
        
        // Get price, ensure it's a positive float
        $price = max(0, floatval($item['prix'] ?? $item['price'] ?? 0));
        
        // Skip invalid items
        if ($productId <= 0 || $price <= 0) {
            continue;
        }
        
        // Prepare statement with nullable variant_id
        if ($variantId) {
            $db->query("
                INSERT INTO commande_items 
                    (id_commande, id_produit, id_variant, quantite, prix) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $db->bind(1, $orderId);
            $db->bind(2, $productId);
            $db->bind(3, $variantId);
            $db->bind(4, $quantity);
            $db->bind(5, $price);
        } else {
            // Use NULL for variant_id
            $db->query("
                INSERT INTO commande_items 
                    (id_commande, id_produit, id_variant, quantite, prix) 
                VALUES (?, ?, NULL, ?, ?)
            ");
            $db->bind(1, $orderId);
            $db->bind(2, $productId);
            $db->bind(3, $quantity);
            $db->bind(4, $price);
        }
        
        if (!$db->execute()) {
            throw new Exception("Failed to add order item");
        }
    }
    
    // 5. Clear user's cart if they have one in the database
    $db->query("DELETE FROM cart WHERE id_utilisateur = ?");
    $db->bind(1, $userId);
    $db->execute();
    
    // If everything is successful, commit the transaction
    $db->endTransaction();
    
    // Return success response
    Utils::sendResponse(true, 'Order created successfully', [
        'order_id' => $orderId,
        'total' => $total
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $db->cancelTransaction();
    
    // Log the error for server-side debugging
    error_log('Order creation error: ' . $e->getMessage());
    
    Utils::sendResponse(false, $e->getMessage(), null, 500);
}
?>