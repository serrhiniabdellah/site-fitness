<?php
require_once '../../config.php';
require_once '../../db.php';
require_once '../../utils.php';

// Only accept GET requests
Utils::validateMethod('GET');

// Get product ID
$id = isset($_GET['id']) ? (int)Utils::sanitizeInput($_GET['id']) : 0;

if ($id <= 0) {
    Utils::sendResponse(false, 'Invalid product ID', null, 400);
}

// Create database connection
$db = new Database();

// Get product details
$db->query("SELECT p.*, c.nom_categorie 
            FROM produits p 
            LEFT JOIN categories c ON p.id_categorie = c.id_categorie 
            WHERE p.id_produit = :id");
$db->bind(':id', $id);

$product = $db->singleArray();

if (!$product) {
    Utils::sendResponse(false, 'Product not found', null, 404);
}

// Get product rating
$db->query("SELECT ROUND(AVG(note), 1) as average_rating, COUNT(*) as review_count 
            FROM avis 
            WHERE id_produit = :id");
$db->bind(':id', $id);
$rating = $db->singleArray();

$product['average_rating'] = $rating['average_rating'] ? (float)$rating['average_rating'] : 0;
$product['review_count'] = (int)$rating['review_count'];

// Get product images
$db->query("SELECT * FROM images_produit WHERE id_produit = :id");
$db->bind(':id', $id);
$images = $db->resultSetArray();

$product['images'] = $images;

// Get product variants
$db->query("SELECT * FROM variants_produit WHERE id_produit = :id");
$db->bind(':id', $id);
$variants = $db->resultSetArray();

$product['variants'] = $variants;

// Get related products (same category, excluding current product)
$db->query("SELECT p.*, c.nom_categorie 
            FROM produits p 
            LEFT JOIN categories c ON p.id_categorie = c.id_categorie 
            WHERE p.id_categorie = :category_id AND p.id_produit != :product_id 
            LIMIT 4");
$db->bind(':category_id', $product['id_categorie']);
$db->bind(':product_id', $id);
$related = $db->resultSetArray();

$product['related_products'] = $related;

Utils::sendResponse(true, 'Product retrieved successfully', ['product' => $product]);
?>
