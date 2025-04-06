<?php
/**
 * Products API Endpoint
 * 
 * Handles product-related requests (GET, POST, PUT, DELETE)
 */

// Include necessary files
require_once '../config/config.php';
require_once '../includes/Database.php';

// Set content type to JSON
header('Content-Type: application/json');
// Allow cross-origin requests during development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get HTTP method
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance();
    
    switch ($method) {
        case 'GET':
            // Get query parameters for filtering and sorting
            $category = isset($_GET['category']) ? (int)$_GET['category'] : null;
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $sort = isset($_GET['sort']) ? $_GET['sort'] : 'id_produit';
            $order = isset($_GET['order']) ? $_GET['order'] : 'ASC';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $promotion = isset($_GET['promotion']) ? (bool)$_GET['promotion'] : null;
            
            // Validate sort and order parameters
            $valid_sort_columns = ['id_produit', 'nom_produit', 'prix', 'date_creation'];
            $valid_order_values = ['ASC', 'DESC'];
            
            if (!in_array($sort, $valid_sort_columns)) {
                $sort = 'id_produit';
            }
            
            if (!in_array(strtoupper($order), $valid_order_values)) {
                $order = 'ASC';
            }
            
            // Get all products or a specific product
            if (isset($_GET['id'])) {
                // Get specific product with category information
                $sql = "SELECT p.*, c.nom_categorie FROM produits p 
                        LEFT JOIN categories c ON p.id_categorie = c.id_categorie
                        WHERE p.id_produit = ?";
                $result = $db->fetchOne($sql, [$_GET['id']]);
            } else {
                // Build query for filtered products with category information
                $sql = "SELECT p.*, c.nom_categorie FROM produits p 
                        LEFT JOIN categories c ON p.id_categorie = c.id_categorie";
                
                $where_clauses = [];
                $params = [];
                
                // Add filters
                if ($category) {
                    $where_clauses[] = "p.id_categorie = ?";
                    $params[] = $category;
                }
                
                if ($search) {
                    $where_clauses[] = "(p.nom_produit LIKE ? OR p.description LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                
                if ($promotion !== null) {
                    $where_clauses[] = "p.est_promotion = ?";
                    $params[] = $promotion ? 1 : 0;
                }
                
                // Add WHERE clause if needed
                if (!empty($where_clauses)) {
                    $sql .= " WHERE " . implode(" AND ", $where_clauses);
                }
                
                // Add sorting
                $sql .= " ORDER BY p.$sort $order";
                
                // Add limit if specified
                if ($limit) {
                    $sql .= " LIMIT ?";
                    $params[] = $limit;
                }
                
                $result = $db->fetchAll($sql, $params);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);
            break;
            
        case 'POST':
            // Create a new product
            // ... implementation for POST method ...
            break;
            
        case 'PUT':
            // Update a product
            // ... implementation for PUT method ...
            break;
            
        case 'DELETE':
            // Delete a product
            // ... implementation for DELETE method ...
            break;
            
        default:
            // Method not allowed
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}