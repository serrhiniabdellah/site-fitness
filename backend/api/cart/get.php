<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';
require_once '../cors.php';

// Set CORS headers for development
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set content type
header('Content-Type: application/json');

// Allow both GET and POST methods
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Please use GET or POST.',
    ]);
    exit;
}

// Get user ID from request (POST or GET)
$user_id = null;

// Check POST data
if (isset($_POST['user_id'])) {
    $user_id = intval($_POST['user_id']);
} 
// Check POST JSON data
else {
    $json = file_get_contents('php://input');
    if ($json) {
        $data = json_decode($json, true);
        if ($data && isset($data['user_id'])) {
            $user_id = intval($data['user_id']);
        }
    }
}

// Check GET parameters as a fallback
if (!$user_id && isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
}

// Check Authorization header as a last resort
if (!$user_id && isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
    if (strpos($auth_header, 'Bearer ') === 0) {
        // Mock user ID for testing
        $user_id = 12;
    }
}

// Validate required fields
if (!$user_id) {
    Utils::sendResponse(false, 'User ID is required', null, 400);
}

try {
    // Create database connection
    $db = new Database();

    // Get cart items
    $db->query("SELECT c.*, p.nom_produit, p.prix, p.image, p.stock,
                v.nom as variant_nom, v.prix as variant_prix
                FROM cart c
                JOIN produits p ON c.id_produit = p.id_produit
                LEFT JOIN variants_produit v ON c.variant_id = v.id_variant
                WHERE c.id_utilisateur = :user_id");
    $db->bind(':user_id', $user_id);

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
        'subtotal' => $subtotal,
        'total' => $subtotal // Add tax/shipping if needed
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Cart retrieved successfully',
        'data' => $cart
    ]);

} catch (Exception $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'data' => [
            'items' => [],
            'total' => 0
        ]
    ]);
}
?>
