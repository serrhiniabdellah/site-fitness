<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    // Handle GET request with URL parameters
    $user_id = isset($_GET['user_id']) ? (int)Utils::sanitizeInput($_GET['user_id']) : null;
    $token = isset($_GET['token']) ? Utils::sanitizeInput($_GET['token']) : null;
    $order_id = isset($_GET['order_id']) ? (int)Utils::sanitizeInput($_GET['order_id']) : null;
} else {
    // Handle POST request with JSON body
    $data = Utils::getJsonData();
    $user_id = isset($data['user_id']) ? (int)Utils::sanitizeInput($data['user_id']) : null;
    $token = isset($data['token']) ? Utils::sanitizeInput($data['token']) : null;
    $order_id = isset($data['order_id']) ? (int)Utils::sanitizeInput($data['order_id']) : null;
}

// Validate required fields
if (!$user_id || !$token || !$order_id) {
    Utils::sendResponse(false, 'Missing required fields', null, 400);
    exit;
}

// Validate token
try {
    $tokenData = Utils::validateToken($token);
    if (!$tokenData) {
        Utils::sendResponse(false, 'Invalid token', null, 401);
        exit;
    }
    
    // Handle both object and array formats for tokenData
    $tokenUserId = null;
    if (is_object($tokenData) && isset($tokenData->sub)) {
        $tokenUserId = $tokenData->sub;
    } elseif (is_array($tokenData) && isset($tokenData['sub'])) {
        $tokenUserId = $tokenData['sub'];
    }
    
    if (!$tokenUserId || $tokenUserId != $user_id) {
        Utils::sendResponse(false, 'Invalid user in token', null, 401);
        exit;
    }
} catch (Exception $e) {
    Utils::sendResponse(false, 'Token validation error: ' . $e->getMessage(), null, 401);
    exit;
}

// Create database connection
$db = new Database();

// Get order details
$db->query("SELECT c.*, 
           s.nom_statut as statut_commande
           FROM commandes c 
           JOIN statut_commande s ON c.id_statut = s.id_statut
           WHERE c.id_commande = :order_id AND c.id_utilisateur = :user_id
           LIMIT 1");
$db->bind(':order_id', $order_id);
$db->bind(':user_id', $user_id);

$order = $db->singleArray();

if (!$order) {
    Utils::sendResponse(false, 'Order not found', null, 404);
    exit;
}

// Format order data
$orderData = array(
    'order_id' => $order['id_commande'],
    'date_commande' => $order['date_commande'],
    'methode_paiement' => $order['methode_paiement'],
    'statut_commande' => $order['statut_commande'],
    'sous_total' => $order['sous_total'],
    'frais_livraison' => $order['frais_livraison'],
    'total' => $order['total'],
    'notes' => $order['notes'],
    'id_transaction' => $order['id_transaction'],
    'date_paiement' => $order['date_paiement'],
    'date_expedition' => $order['date_expedition'],
    'date_livraison' => $order['date_livraison']
);

// Get order items
$db->query("SELECT i.*, p.nom_produit, p.image, v.nom as variant_nom 
            FROM commande_items i
            JOIN produits p ON i.id_produit = p.id_produit
            LEFT JOIN variants_produit v ON i.id_variant = v.id_variant
            WHERE i.id_commande = :order_id");
$db->bind(':order_id', $order_id);
$items = $db->resultSetArray();

// Add items to order data
$orderData['items'] = $items;

// Get customer information
$db->query("SELECT prenom, nom, email, telephone 
            FROM utilisateurs 
            WHERE id_utilisateur = :user_id 
            LIMIT 1");
$db->bind(':user_id', $user_id);
$customer = $db->singleArray();

// Get shipping/billing addresses
// For this example, we'll use placeholder addresses since the schema may not have them
// In a real system, you'd fetch these from your database
$orderData['shipping_address'] = array(
    'first_name' => $customer['prenom'],
    'last_name' => $customer['nom'],
    'address' => '123 Shipping Street',
    'address2' => 'Apt 4',
    'city' => 'Paris',
    'postal_code' => '75000',
    'country' => 'France'
);

$orderData['billing_address'] = array(
    'first_name' => $customer['prenom'],
    'last_name' => $customer['nom'],
    'address' => '123 Billing Street',
    'address2' => 'Apt 4',
    'city' => 'Paris',
    'postal_code' => '75000',
    'country' => 'France'
);

// Return the order data
Utils::sendResponse(true, 'Order details retrieved successfully', ['order' => $orderData]);
?>
