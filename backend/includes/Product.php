<?php
/**
 * Product Class
 * 
 * This class handles all product-related operations
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';

class Product {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    /**
     * Get all products
     *
     * @param array $filters Optional filters
     * @param string $sortBy Sort field
     * @param string $sortOrder Sort order (ASC or DESC)
     * @param int $limit Number of products to return
     * @param int $offset Offset for pagination
     * @return array List of products
     */
    public function getProducts($filters = [], $sortBy = 'id_produit', $sortOrder = 'ASC', $limit = 12, $offset = 0) {
        $query = "SELECT p.*, c.nom_categorie 
                  FROM PRODUIT p 
                  JOIN CATEGORIE c ON p.id_categorie = c.id_categorie 
                  WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters)) {
            if (isset($filters['category']) && $filters['category'] > 0) {
                $query .= " AND p.id_categorie = ?";
                $params[] = $filters['category'];
            }
            
            if (isset($filters['search']) && !empty($filters['search'])) {
                $query .= " AND (p.nom_produit LIKE ? OR p.description LIKE ?)";
                $searchTerm = "%{$filters['search']}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if (isset($filters['min_price']) && $filters['min_price'] > 0) {
                $query .= " AND p.prix >= ?";
                $params[] = $filters['min_price'];
            }
            
            if (isset($filters['max_price']) && $filters['max_price'] > 0) {
                $query .= " AND p.prix <= ?";
                $params[] = $filters['max_price'];
            }
            
            if (isset($filters['promotion']) && $filters['promotion']) {
                $query .= " AND p.est_promotion = 1";
            }
        }
        
        // Apply sorting
        $allowedSortFields = ['id_produit', 'nom_produit', 'prix', 'date_creation'];
        $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'id_produit';
        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'DESC' : 'ASC';
        
        $query .= " ORDER BY p.$sortBy $sortOrder";
        
        // Apply pagination
        if ($limit > 0) {
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }
        
        return $this->db->getRows($query, $params);
    }
    
    /**
     * Get total products count (for pagination)
     *
     * @param array $filters Optional filters
     * @return int Total products count
     */
    public function getProductsCount($filters = []) {
        $query = "SELECT COUNT(*) as count FROM PRODUIT p WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters)) {
            if (isset($filters['category']) && $filters['category'] > 0) {
                $query .= " AND p.id_categorie = ?";
                $params[] = $filters['category'];
            }
            
            if (isset($filters['search']) && !empty($filters['search'])) {
                $query .= " AND (p.nom_produit LIKE ? OR p.description LIKE ?)";
                $searchTerm = "%{$filters['search']}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if (isset($filters['min_price']) && $filters['min_price'] > 0) {
                $query .= " AND p.prix >= ?";
                $params[] = $filters['min_price'];
            }
            
            if (isset($filters['max_price']) && $filters['max_price'] > 0) {
                $query .= " AND p.prix <= ?";
                $params[] = $filters['max_price'];
            }
            
            if (isset($filters['promotion']) && $filters['promotion']) {
                $query .= " AND p.est_promotion = 1";
            }
        }
        
        $result = $this->db->getRow($query, $params);
        return $result ? intval($result['count']) : 0;
    }
    
    /**
     * Get a single product by ID
     *
     * @param int $id Product ID
     * @return array|null Product data
     */
    public function getProductById($id) {
        $product = $this->db->getRow(
            "SELECT p.*, c.nom_categorie 
            FROM PRODUIT p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie 
            WHERE p.id_produit = ?", 
            [$id]
        );
        
        if ($product) {
            // Get product reviews
            $reviews = $this->db->getRows(
                "SELECT a.*, u.nom, u.prenom 
                FROM AVIS a 
                JOIN UTILISATEUR u ON a.id_utilisateur = u.id_utilisateur 
                WHERE a.id_produit = ? 
                ORDER BY a.date_avis DESC",
                [$id]
            );
            
            $product['reviews'] = $reviews;
            
            // Calculate average rating
            $totalRating = 0;
            $reviewCount = count($reviews);
            
            foreach ($reviews as $review) {
                $totalRating += $review['note'];
            }
            
            $product['average_rating'] = $reviewCount > 0 ? round($totalRating / $reviewCount, 1) : 0;
            $product['review_count'] = $reviewCount;
        }
        
        return $product;
    }
    
    /**
     * Add a new product
     *
     * @param array $data Product data
     * @return int|null Inserted product ID
     */
    public function addProduct($data) {
        // Validate required fields
        if (empty($data['nom_produit']) || !isset($data['prix']) || empty($data['id_categorie'])) {
            return null;
        }
        
        return $this->db->insert(
            "INSERT INTO PRODUIT (nom_produit, description, prix, stock, id_categorie, image, est_promotion, pourcentage_promotion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['nom_produit'],
                $data['description'] ?? '',
                $data['prix'],
                $data['stock'] ?? 0,
                $data['id_categorie'],
                $data['image'] ?? '',
                isset($data['est_promotion']) ? ($data['est_promotion'] ? 1 : 0) : 0,
                $data['pourcentage_promotion'] ?? 0
            ]
        );
    }
    
    /**
     * Update an existing product
     *
     * @param int $id Product ID
     * @param array $data Product data to update
     * @return bool Success status
     */
    public function updateProduct($id, $data) {
        $setFields = [];
        $params = [];
        
        if (isset($data['nom_produit'])) {
            $setFields[] = "nom_produit = ?";
            $params[] = $data['nom_produit'];
        }
        
        if (isset($data['description'])) {
            $setFields[] = "description = ?";
            $params[] = $data['description'];
        }
        
        if (isset($data['prix'])) {
            $setFields[] = "prix = ?";
            $params[] = $data['prix'];
        }
        
        if (isset($data['stock'])) {
            $setFields[] = "stock = ?";
            $params[] = $data['stock'];
        }
        
        if (isset($data['id_categorie'])) {
            $setFields[] = "id_categorie = ?";
            $params[] = $data['id_categorie'];
        }
        
        if (isset($data['image'])) {
            $setFields[] = "image = ?";
            $params[] = $data['image'];
        }
        
        if (isset($data['est_promotion'])) {
            $setFields[] = "est_promotion = ?";
            $params[] = $data['est_promotion'] ? 1 : 0;
        }
        
        if (isset($data['pourcentage_promotion'])) {
            $setFields[] = "pourcentage_promotion = ?";
            $params[] = $data['pourcentage_promotion'];
        }
        
        if (empty($setFields)) {
            return false;
        }
        
        $params[] = $id;
        
        $rowsAffected = $this->db->executeQuery(
            "UPDATE PRODUIT SET " . implode(", ", $setFields) . " WHERE id_produit = ?",
            $params
        );
        
        return $rowsAffected > 0;
    }
    
    /**
     * Delete a product
     *
     * @param int $id Product ID
     * @return bool Success status
     */
    public function deleteProduct($id) {
        $rowsAffected = $this->db->executeQuery(
            "DELETE FROM PRODUIT WHERE id_produit = ?",
            [$id]
        );
        
        return $rowsAffected > 0;
    }
    
    /**
     * Get all categories
     *
     * @return array List of categories
     */
    public function getCategories() {
        return $this->db->getRows("SELECT * FROM CATEGORIE ORDER BY nom_categorie");
    }
    
    /**
     * Add a review for a product
     *
     * @param int $productId Product ID
     * @param int $userId User ID
     * @param int $rating Rating (1-5)
     * @param string $comment Review comment
     * @return int|null Inserted review ID
     */
    public function addReview($productId, $userId, $rating, $comment) {
        // Validate rating
        $rating = max(1, min(5, intval($rating)));
        
        return $this->db->insert(
            "INSERT INTO AVIS (id_produit, id_utilisateur, note, commentaire) VALUES (?, ?, ?, ?)",
            [$productId, $userId, $rating, $comment]
        );
    }
    
    /**
     * Get featured products
     *
     * @param int $limit Number of products to return
     * @return array List of featured products
     */
    public function getFeaturedProducts($limit = 8) {
        return $this->db->getRows(
            "SELECT p.*, c.nom_categorie 
            FROM PRODUIT p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie 
            WHERE p.est_promotion = 1 
            ORDER BY p.date_creation DESC 
            LIMIT ?",
            [$limit]
        );
    }
    
    /**
     * Get new arrivals
     *
     * @param int $limit Number of products to return
     * @return array List of new arrivals
     */
    public function getNewArrivals($limit = 8) {
        return $this->db->getRows(
            "SELECT p.*, c.nom_categorie 
            FROM PRODUIT p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie 
            ORDER BY p.date_creation DESC 
            LIMIT ?",
            [$limit]
        );
    }
    
    /**
     * Search products
     *
     * @param string $query Search query
     * @param int $limit Number of products to return
     * @return array List of matching products
     */
    public function searchProducts($query, $limit = 5) {
        $searchTerm = "%{$query}%";
        
        return $this->db->getRows(
            "SELECT p.*, c.nom_categorie 
            FROM PRODUIT p 
            JOIN CATEGORIE c ON p.id_categorie = c.id_categorie 
            WHERE p.nom_produit LIKE ? OR p.description LIKE ? OR c.nom_categorie LIKE ?
            ORDER BY 
                CASE 
                    WHEN p.nom_produit LIKE ? THEN 1
                    WHEN c.nom_categorie LIKE ? THEN 2
                    ELSE 3
                END
            LIMIT ?",
            [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]
        );
    }
}