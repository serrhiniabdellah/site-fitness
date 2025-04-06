<?php
/**
 * Cart Class
 * 
 * This class handles shopping cart operations
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';

class Cart {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    /**
     * Get user cart
     *
     * @param int $userId User ID
     * @return array Cart and cart items
     */
    public function getUserCart($userId) {
        // Get active cart for this user
        $cart = $this->db->getRow(
            "SELECT * FROM PANIER WHERE id_utilisateur = ? AND est_actif = 1",
            [$userId]
        );
        
        // If no active cart, create one
        if (!$cart) {
            $cartId = $this->db->insert(
                "INSERT INTO PANIER (id_utilisateur) VALUES (?)",
                [$userId]
            );
            
            $cart = [
                'id_panier' => $cartId,
                'id_utilisateur' => $userId,
                'date_creation' => date('Y-m-d H:i:s'),
                'est_actif' => 1
            ];
        }
        
        // Get cart items
        $cartItems = $this->db->getRows(
            "SELECT lp.*, p.nom_produit, p.prix, p.image 
            FROM LIGNE_PANIER lp 
            JOIN PRODUIT p ON lp.id_produit = p.id_produit 
            WHERE lp.id_panier = ?",
            [$cart['id_panier']]
        );
        
        // Calculate total
        $total = 0;
        foreach ($cartItems as $item) {
            $total += $item['prix'] * $item['quantite'];
        }
        
        return [
            'cart' => $cart,
            'items' => $cartItems,
            'total' => $total,
            'item_count' => count($cartItems)
        ];
    }
    
    /**
     * Add item to cart
     *
     * @param int $userId User ID
     * @param int $productId Product ID
     * @param int $quantity Quantity
     * @return bool Success status
     */
    public function addToCart($userId, $productId, $quantity = 1) {
        // Get user's active cart
        $cart = $this->db->getRow(
            "SELECT * FROM PANIER WHERE id_utilisateur = ? AND est_actif = 1",
            [$userId]
        );
        
        // If no active cart, create one
        if (!$cart) {
            $cartId = $this->db->insert(
                "INSERT INTO PANIER (id_utilisateur) VALUES (?)",
                [$userId]
            );
        } else {
            $cartId = $cart['id_panier'];
        }
        
        // Check if product already in cart
        $cartItem = $this->db->getRow(
            "SELECT * FROM LIGNE_PANIER WHERE id_panier = ? AND id_produit = ?",
            [$cartId, $productId]
        );
        
        if ($cartItem) {
            // Update quantity if product already in cart
            $updatedQuantity = $cartItem['quantite'] + $quantity;
            
            return $this->db->executeQuery(
                "UPDATE LIGNE_PANIER SET quantite = ? WHERE id_ligne_panier = ?",
                [$updatedQuantity, $cartItem['id_ligne_panier']]
            ) > 0;
        } else {
            // Add new product to cart
            return $this->db->insert(
                "INSERT INTO LIGNE_PANIER (id_panier, id_produit, quantite) VALUES (?, ?, ?)",
                [$cartId, $productId, $quantity]
            ) > 0;
        }
    }
    
    /**
     * Update cart item quantity
     *
     * @param int $userId User ID
     * @param int $cartItemId Cart item ID
     * @param int $quantity New quantity
     * @return bool Success status
     */
    public function updateCartItemQuantity($userId, $cartItemId, $quantity) {
        if ($quantity <= 0) {
            return $this->removeCartItem($userId, $cartItemId);
        }
        
        // Verify this cart item belongs to the user
        $cartItem = $this->db->getRow(
            "SELECT lp.* FROM LIGNE_PANIER lp 
            JOIN PANIER p ON lp.id_panier = p.id_panier 
            WHERE lp.id_ligne_panier = ? AND p.id_utilisateur = ? AND p.est_actif = 1",
            [$cartItemId, $userId]
        );
        
        if (!$cartItem) {
            return false;
        }
        
        return $this->db->executeQuery(
            "UPDATE LIGNE_PANIER SET quantite = ? WHERE id_ligne_panier = ?",
            [$quantity, $cartItemId]
        ) > 0;
    }
    
    /**
     * Remove item from cart
     *
     * @param int $userId User ID
     * @param int $cartItemId Cart item ID
     * @return bool Success status
     */
    public function removeCartItem($userId, $cartItemId) {
        // Verify this cart item belongs to the user
        $cartItem = $this->db->getRow(
            "SELECT lp.* FROM LIGNE_PANIER lp 
            JOIN PANIER p ON lp.id_panier = p.id_panier 
            WHERE lp.id_ligne_panier = ? AND p.id_utilisateur = ? AND p.est_actif = 1",
            [$cartItemId, $userId]
        );
        
        if (!$cartItem) {
            return false;
        }
        
        return $this->db->executeQuery(
            "DELETE FROM LIGNE_PANIER WHERE id_ligne_panier = ?",
            [$cartItemId]
        ) > 0;
    }
    
    /**
     * Clear cart
     *
     * @param int $userId User ID
     * @return bool Success status
     */
    public function clearCart($userId) {
        // Get user's active cart
        $cart = $this->db->getRow(
            "SELECT * FROM PANIER WHERE id_utilisateur = ? AND est_actif = 1",
            [$userId]
        );
        
        if (!$cart) {
            return false;
        }
        
        return $this->db->executeQuery(
            "DELETE FROM LIGNE_PANIER WHERE id_panier = ?",
            [$cart['id_panier']]
        ) > 0;
    }
    
    /**
     * Convert cart to order
     *
     * @param int $userId User ID
     * @param string $paymentMethod Payment method
     * @return int|null Order ID
     */
    public function checkoutCart($userId, $paymentMethod = 'carte') {
        // Get user's cart
        $cartData = $this->getUserCart($userId);
        
        if (empty($cartData['items'])) {
            return null;
        }
        
        // Begin a transaction
        $conn = $this->db->connect();
        $conn->beginTransaction();
        
        try {
            // Create order
            $orderId = $this->db->insert(
                "INSERT INTO COMMANDE (id_utilisateur, montant_total, methode_paiement) VALUES (?, ?, ?)",
                [$userId, $cartData['total'], $paymentMethod]
            );
            
            if (!$orderId) {
                throw new Exception("Failed to create order");
            }
            
            // Create order items
            foreach ($cartData['items'] as $item) {
                $success = $this->db->insert(
                    "INSERT INTO LIGNE_COMMANDE (id_commande, id_produit, quantite, prix_unitaire) VALUES (?, ?, ?, ?)",
                    [$orderId, $item['id_produit'], $item['quantite'], $item['prix']]
                );
                
                if (!$success) {
                    throw new Exception("Failed to create order item");
                }
                
                // Update product stock
                $this->db->executeQuery(
                    "UPDATE PRODUIT SET stock = stock - ? WHERE id_produit = ? AND stock >= ?",
                    [$item['quantite'], $item['id_produit'], $item['quantite']]
                );
            }
            
            // Deactivate the cart
            $this->db->executeQuery(
                "UPDATE PANIER SET est_actif = 0 WHERE id_panier = ?",
                [$cartData['cart']['id_panier']]
            );
            
            // Create a new active cart
            $this->db->insert(
                "INSERT INTO PANIER (id_utilisateur) VALUES (?)",
                [$userId]
            );
            
            // Commit transaction
            $conn->commit();
            
            return $orderId;
        } catch (Exception $e) {
            // Rollback on error
            $conn->rollBack();
            echo "Transaction failed: " . $e->getMessage();
            return null;
        }
    }
}