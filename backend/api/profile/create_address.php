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

// Validate required data
if (!isset($data['address']) || !isset($data['city']) || 
    !isset($data['postal_code']) || !isset($data['country'])) {
    sendResponse(['success' => false, 'message' => 'Missing required address information'], 400);
    exit;
}

try {
    // Create an address entry
    $firstName = isset($data['first_name']) ? $conn->real_escape_string($data['first_name']) : '';
    $lastName = isset($data['last_name']) ? $conn->real_escape_string($data['last_name']) : '';
    $phone = isset($data['phone']) ? $conn->real_escape_string($data['phone']) : '';
    $address = $conn->real_escape_string($data['address']);
    $city = $conn->real_escape_string($data['city']);
    $postalCode = $conn->real_escape_string($data['postal_code']);
    $country = $conn->real_escape_string($data['country']);
    $type = 'shipping';
    
    // Create address in database
    $stmt = $conn->prepare("
        INSERT INTO adresses 
            (id_utilisateur, type, prenom, nom, telephone, adresse, ville, code_postal, pays) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        "issssssss", 
        $userId, 
        $type,
        $firstName, 
        $lastName, 
        $phone, 
        $address, 
        $city, 
        $postalCode, 
        $country
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create address: " . $stmt->error);
    }
    
    // Get the address ID
    $addressId = $conn->insert_id;
    
    // Return success response with the address ID
    sendResponse([
        'success' => true,
        'message' => 'Address created successfully',
        'address_id' => $addressId
    ]);
    
} catch (Exception $e) {
    error_log('Address creation error: ' . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
?>