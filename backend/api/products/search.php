<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept GET requests
Utils::validateMethod('GET');

// Get search query
$query = isset($_GET['q']) ? Utils::sanitizeInput($_GET['q']) : '';
$limit = isset($_GET['limit']) ? (int)Utils::sanitizeInput($_GET['limit']) : 5;

if (empty($query)) {
    Utils::sendResponse(false, 'Search query is required', ['results' => []]);
}

// Create database connection
$db = new Database();

// Search products
$db->query("SELECT p.*, c.nom_categorie 
            FROM produits p 
            LEFT JOIN categories c ON p.id_categorie = c.id_categorie 
            WHERE p.nom_produit LIKE :query OR p.description LIKE :query OR c.nom_categorie LIKE :query 
            LIMIT :limit");
$db->bind(':query', "%$query%");
$db->bind(':limit', $limit, PDO::PARAM_INT);

$results = $db->resultSetArray();

Utils::sendResponse(true, 'Search results', ['results' => $results]);
?>
