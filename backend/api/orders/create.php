<?php
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

require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Check authentication
$auth = new Auth($conn);
if (!$auth->validateToken()) {
    sendResponse(['success' => false, 'message' => 'Authentication required'], 401);
    exit;
}

// Get authenticated user ID
$userId = $auth->getUserId();

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Validate input data
if (!isset($data['shipping_info']) || !isset($data['cart']) || !isset($data['payment_method'])) {
    sendResponse(['success' => false, 'message' => 'Missing required order information'], 400);
    exit;
}

// Start transaction for database integrity
$conn->begin_transaction();

try {
    // 1. Create order record
    $subtotal = isset($data['cart']['total']) ? floatval($data['cart']['total']) : 0;
    $shippingCost = isset($data['shipping_cost']) ? floatval($data['shipping_cost']) : 0;
    $total = $subtotal + $shippingCost;
    
    // Get payment method
    $paymentMethod = $conn->real_escape_string($data['payment_method']);
    
    // Default status ID is 1 (pending)
    $statusId = 1;
    
    // Create order in database
    $stmt = $conn->prepare("
        INSERT INTO commandes 
            (id_utilisateur, id_statut, sous_total, frais_livraison, total, methode_paiement) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iiddds", $userId, $statusId, $subtotal, $shippingCost, $total, $paymentMethod);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create order: " . $stmt->error);
    }
    
    // Get the order ID
    $orderId = $conn->insert_id;
    
    // 2. Add shipping address
    $shipping = $data['shipping_info'];
    $firstname = $conn->real_escape_string($shipping['first_name']);
    $lastname = $conn->real_escape_string($shipping['last_name']);
    $phone = isset($shipping['phone']) ? $conn->real_escape_string($shipping['phone']) : '';
    $address = $conn->real_escape_string($shipping['address']);
    $city = $conn->real_escape_string($shipping['city']);
    $postalCode = $conn->real_escape_string($shipping['postal_code']);
    $country = $conn->real_escape_string($shipping['country']);
    $addressType = 'shipping';
    
    // Fix: Changed the binding to match parameter count and types
    $stmt = $conn->prepare("
        INSERT INTO adresses 
            (id_utilisateur, id_commande, type, prenom, nom, telephone, adresse, ville, code_postal, pays) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Fix: Added the type parameter to the binding
    $stmt->bind_param(
        "iissssssss", 
        $userId, 
        $orderId, 
        $addressType,
        $firstname, 
        $lastname, 
        $phone, 
        $address, 
        $city, 
        $postalCode, 
        $country
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to save shipping address: " . $stmt->error);
    }
    
    // 3. Add order items
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
            $stmt = $conn->prepare("
                INSERT INTO commande_items 
                    (id_commande, id_produit, id_variant, quantite, prix) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iiiid", $orderId, $productId, $variantId, $quantity, $price);
        } else {
            // Use NULL for variant_id by using direct query
            $stmt = $conn->prepare("
                INSERT INTO commande_items 
                    (id_commande, id_produit, id_variant, quantite, prix) 
                VALUES (?, ?, NULL, ?, ?)
            ");
            $stmt->bind_param("iiid", $orderId, $productId, $quantity, $price);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to add order item: " . $stmt->error);
        }
    }
    
    // 4. Clear user's cart if they have one in the database
    $stmt = $conn->prepare("DELETE FROM cart WHERE id_utilisateur = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    // If everything is successful, commit the transaction
    $conn->commit();
    
    // Return success response
    sendResponse([
        'success' => true,
        'message' => 'Order created successfully',
        'data' => [
            'order_id' => $orderId,
            'total' => $total
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    // Log the error for server-side debugging
    error_log('Order creation error: ' . $e->getMessage());
    
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
?>
