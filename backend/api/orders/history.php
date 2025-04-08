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

try {
    // Query to get all orders for the user
    $stmt = $conn->prepare("
        SELECT c.id_commande, c.date_commande, c.total, sc.nom_statut as status
        FROM commandes c
        LEFT JOIN statut_commande sc ON c.id_statut = sc.id_statut
        WHERE c.id_utilisateur = ?
        ORDER BY c.date_commande DESC
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            'id' => $row['id_commande'],
            'date' => $row['date_commande'],
            'total' => floatval($row['total']),
            'status' => $row['status']
        ];
    }
    
    // Return orders
    sendResponse([
        'success' => true,
        'data' => [
            'orders' => $orders
        ]
    ]);
    
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
?>
