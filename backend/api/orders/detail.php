<?php
// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// Get order ID from request
if (!isset($_GET['id'])) {
    sendResponse(['success' => false, 'message' => 'Order ID is required'], 400);
    exit;
}

$orderId = intval($_GET['id']);

try {
    // Get order details
    $stmt = $conn->prepare("
        SELECT c.*, sc.nom_statut as status
        FROM commandes c
        LEFT JOIN statut_commande sc ON c.id_statut = sc.id_statut
        WHERE c.id_commande = ? AND c.id_utilisateur = ?
    ");
    $stmt->bind_param("ii", $orderId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['success' => false, 'message' => 'Order not found'], 404);
        exit;
    }
    
    $orderData = $result->fetch_assoc();
    
    // Get order items
    $stmt = $conn->prepare("
        SELECT oi.*, p.nom_produit, p.image
        FROM commande_items oi
        JOIN produits p ON oi.id_produit = p.id_produit
        WHERE oi.id_commande = ?
    ");
    $stmt->bind_param("i", $orderId);
    $stmt->execute();
    $itemsResult = $stmt->get_result();
    
    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $items[] = [
            'id' => $item['id_item'],
            'product_id' => $item['id_produit'],
            'product_name' => $item['nom_produit'],
            'quantity' => $item['quantite'],
            'price' => floatval($item['prix']),
            'variant_id' => $item['id_variant'],
            'image' => $item['image']
        ];
    }
    
    // Get shipping address
    $stmt = $conn->prepare("
        SELECT * FROM adresses
        WHERE id_commande = ? AND type = 'shipping'
    ");
    $stmt->bind_param("i", $orderId);
    $stmt->execute();
    $addressResult = $stmt->get_result();
    $shippingAddress = $addressResult->fetch_assoc();
    
    // Format order data
    $order = [
        'id' => $orderData['id_commande'],
        'date' => $orderData['date_commande'],
        'status' => $orderData['status'],
        'subtotal' => floatval($orderData['sous_total']),
        'shipping' => floatval($orderData['frais_livraison']),
        'total' => floatval($orderData['total']),
        'payment_method' => $orderData['methode_paiement'],
        'items' => $items,
        'shipping_address' => $shippingAddress ? [
            'first_name' => $shippingAddress['prenom'],
            'last_name' => $shippingAddress['nom'],
            'phone' => $shippingAddress['telephone'],
            'address' => $shippingAddress['adresse'],
            'city' => $shippingAddress['ville'],
            'postal_code' => $shippingAddress['code_postal'],
            'country' => $shippingAddress['pays']
        ] : null
    ];
    
    // Return order details
    sendResponse([
        'success' => true,
        'data' => $order
    ]);
    
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
?>
