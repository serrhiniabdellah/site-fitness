<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Handle both GET and POST methods
$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$userId = null;
$token = null;

// Extract authentication data from request
if ($method === 'GET') {
    // Check for Authorization header
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
} elseif ($method === 'POST') {
    // Get JSON data for POST requests
    $data = Utils::getJsonData();
    if (isset($data['user_id'])) {
        $userId = (int)Utils::sanitizeInput($data['user_id']);
    }
    if (isset($data['token'])) {
        $token = Utils::sanitizeInput($data['token']);
    }
}

// If token is available in Authorization header but no user_id, try to get it from token
if ($token && !$userId) {
    try {
        $tokenData = Utils::validateToken($token);
        if ($tokenData) {
            // Handle different token formats (object vs array)
            if (is_object($tokenData) && isset($tokenData->sub)) {
                $userId = $tokenData->sub;
            } elseif (is_array($tokenData) && isset($tokenData['sub'])) {
                $userId = $tokenData['sub'];
            }
        }
    } catch (Exception $e) {
        Utils::sendResponse(false, 'Token validation error: ' . $e->getMessage(), null, 401);
        exit;
    }
}

// Validate required data
if (!$userId || !$token) {
    Utils::sendResponse(false, 'Missing required authentication data', null, 400);
    exit;
}

// Validate token
try {
    $tokenData = Utils::validateToken($token);
    if (!$tokenData) {
        Utils::sendResponse(false, 'Invalid token', null, 401);
        exit;
    }
    
    // Get user ID from token if needed and validate it matches
    $tokenUserId = null;
    if (is_object($tokenData) && isset($tokenData->sub)) {
        $tokenUserId = $tokenData->sub;
    } elseif (is_array($tokenData) && isset($tokenData['sub'])) {
        $tokenUserId = $tokenData['sub'];
    }
    
    if (!$tokenUserId || $tokenUserId != $userId) {
        Utils::sendResponse(false, 'User ID mismatch with token', null, 401);
        exit;
    }
} catch (Exception $e) {
    Utils::sendResponse(false, 'Token validation error: ' . $e->getMessage(), null, 401);
    exit;
}

// Get orders from database
$db = new Database();

// Query to get user's orders
$db->query("SELECT c.*, 
           s.nom_statut as statut_commande
           FROM commandes c 
           JOIN statut_commande s ON c.id_statut = s.id_statut
           WHERE c.id_utilisateur = :user_id 
           ORDER BY c.date_commande DESC
           LIMIT 10"); // Limit to the 10 most recent orders for performance
$db->bind(':user_id', $userId);

$orders = $db->resultSetArray();

if (empty($orders)) {
    Utils::sendResponse(true, 'No orders found for this user', ['orders' => []]);
    exit;
}

// Get items for each order
foreach ($orders as &$order) {
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

// Return the orders
Utils::sendResponse(true, 'Order history retrieved successfully', ['orders' => $orders]);
?>
