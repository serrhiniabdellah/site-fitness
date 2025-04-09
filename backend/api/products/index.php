<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept GET requests
Utils::validateMethod('GET');

// Create database connection
$db = new Database();

// Get filter parameters
$category = isset($_GET['category']) ? Utils::sanitizeInput($_GET['category']) : null;
$minPrice = isset($_GET['min_price']) ? Utils::sanitizeInput($_GET['min_price']) : null;
$maxPrice = isset($_GET['max_price']) ? Utils::sanitizeInput($_GET['max_price']) : null;
$promotion = isset($_GET['promotion']) ? Utils::sanitizeInput($_GET['promotion']) : null;
$search = isset($_GET['search']) ? Utils::sanitizeInput($_GET['search']) : null;

// Get pagination parameters
$page = isset($_GET['page']) ? (int)Utils::sanitizeInput($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? (int)Utils::sanitizeInput($_GET['limit']) : 12;
$offset = ($page - 1) * $limit;

// Get sort parameters
$sortBy = isset($_GET['sort_by']) ? Utils::sanitizeInput($_GET['sort_by']) : 'id_produit';
$sortOrder = isset($_GET['sort_order']) ? Utils::sanitizeInput($_GET['sort_order']) : 'ASC';

// Valid sort fields to prevent SQL injection
$validSortFields = [
    'id_produit', 'nom_produit', 'prix', 'date_creation', 'stock'
];

if (!in_array($sortBy, $validSortFields)) {
    $sortBy = 'id_produit';
}

if (!in_array(strtoupper($sortOrder), ['ASC', 'DESC'])) {
    $sortOrder = 'ASC';
}

// Build query
$query = "SELECT p.*, c.nom_categorie, 
          (SELECT ROUND(AVG(note), 1) FROM avis WHERE id_produit = p.id_produit) as average_rating
          FROM produits p 
          LEFT JOIN categories c ON p.id_categorie = c.id_categorie 
          WHERE 1=1";

$countQuery = "SELECT COUNT(*) as total FROM produits p WHERE 1=1";

$params = [];

// Add filters to query if provided
if ($category) {
    $query .= " AND p.id_categorie = :category";
    $countQuery .= " AND p.id_categorie = :category";
    $params[':category'] = $category;
}

if ($minPrice) {
    $query .= " AND p.prix >= :min_price";
    $countQuery .= " AND p.prix >= :min_price";
    $params[':min_price'] = $minPrice;
}

if ($maxPrice) {
    $query .= " AND p.prix <= :max_price";
    $countQuery .= " AND p.prix <= :max_price";
    $params[':max_price'] = $maxPrice;
}

if ($promotion) {
    $query .= " AND p.est_promotion = :promotion";
    $countQuery .= " AND p.est_promotion = :promotion";
    $params[':promotion'] = $promotion;
}

if ($search) {
    $query .= " AND (p.nom_produit LIKE :search OR p.description LIKE :search OR c.nom_categorie LIKE :search)";
    $countQuery .= " AND (p.nom_produit LIKE :search OR p.description LIKE :search)";
    $params[':search'] = "%$search%";
}

// Add sorting and pagination
$query .= " ORDER BY $sortBy $sortOrder LIMIT :offset, :limit";

// Execute count query for pagination
$db->query($countQuery);
foreach ($params as $param => $value) {
    $db->bind($param, $value);
}
$countResult = $db->singleArray();
$totalItems = $countResult['total'];

// Execute main query
$db->query($query);
foreach ($params as $param => $value) {
    $db->bind($param, $value);
}
$db->bind(':offset', $offset, PDO::PARAM_INT);
$db->bind(':limit', $limit, PDO::PARAM_INT);

$products = $db->resultSetArray();

// Generate pagination data
$pagination = Utils::getPaginationData($page, $totalItems, $limit);

// Send response
Utils::sendResponse(true, 'Products retrieved successfully', [
    'products' => $products,
    'pagination' => $pagination
]);
?>
