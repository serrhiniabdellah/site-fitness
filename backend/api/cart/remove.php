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

// Required files
require_once '../config/database.php';
require_once '../utils/auth.php';
require_once '../utils/response.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Invalid request method', 405);
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// Check for required fields
if (!isset($data['product_id'])) {
    sendErrorResponse('Product ID is required');
}

$productId = $data['product_id'];
$variantId = isset($data['variant_id']) ? $data['variant_id'] : null;
$userId = null;
$sessionId = null;

// Check if request is authenticated
$auth = new Auth($conn);
$isAuthenticated = $auth->validateToken();

// If authenticated, use user_id from token, otherwise use session_id
if ($isAuthenticated) {
    $userId = $auth->getUserId();
} else {
    // For guest users, require session_id
    if (isset($data['session_id']) && !empty($data['session_id'])) {
        $sessionId = $data['session_id'];
    } else {
        sendErrorResponse('Session ID is required for guest users');
    }
}

try {
    // Prepare delete statement based on authentication
    if ($userId) {
        if ($variantId === null) {
            $stmt = $conn->prepare("DELETE FROM cart WHERE id_utilisateur = ? AND id_produit = ? AND variant_id IS NULL");
            $stmt->bind_param("ii", $userId, $productId);
        } else {
            $stmt = $conn->prepare("DELETE FROM cart WHERE id_utilisateur = ? AND id_produit = ? AND variant_id = ?");
            $stmt->bind_param("iii", $userId, $productId, $variantId);
        }
    } else {
        if ($variantId === null) {
            $stmt = $conn->prepare("DELETE FROM cart WHERE session_id = ? AND id_produit = ? AND variant_id IS NULL");
            $stmt->bind_param("si", $sessionId, $productId);
        } else {
            $stmt = $conn->prepare("DELETE FROM cart WHERE session_id = ? AND id_produit = ? AND variant_id = ?");
            $stmt->bind_param("sii", $sessionId, $productId, $variantId);
        }
    }
    
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        sendResponse([
            'success' => true,
            'message' => 'Item removed from cart',
            'removed_rows' => $stmt->affected_rows
        ]);
    } else {
        sendErrorResponse('Item not found in cart');
    }
} catch (Exception $e) {
    sendErrorResponse('Error removing item from cart: ' . $e->getMessage());
}

$conn->close();
?>
