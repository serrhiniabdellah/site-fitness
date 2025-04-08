<?php
/**
 * Auth utility class for handling user authentication
 */
class Auth {
    private $conn;
    private $token;
    private $userData;
    
    /**
     * Constructor
     * @param mixed $conn Database connection (mysqli or Database class instance)
     */
    public function __construct($conn) {
        // Handle either mysqli or Database class connection
        if (is_object($conn)) {
            // Check if it's a database class with getConnection method
            if (method_exists($conn, 'getConnection')) {
                $this->conn = $conn->getConnection();
            } else {
                // Assume it's already a mysqli object
                $this->conn = $conn;
            }
        } else {
            // Not an object - unexpected but set it anyway
            $this->conn = $conn;
        }
        
        $this->token = $this->getBearerToken();
    }
    
    /**
     * Get bearer token from Authorization header
     * @return string|null Bearer token or null if not found
     */
    private function getBearerToken() {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
    
    /**
     * Get Authorization header
     * @return string|null Authorization header or null if not found
     */
    private function getAuthorizationHeader() {
        $headers = null;
        
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } else if (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        return $headers;
    }
    
    /**
     * Validate token and user authentication
     * @return bool True if token is valid, false otherwise
     */
    public function validateToken() {
        if (!$this->token) {
            return false;
        }
        
        // Check if token exists in database
        $stmt = $this->conn->prepare("
            SELECT u.id_utilisateur, u.email, u.prenom, u.nom, u.telephone, u.est_admin
            FROM utilisateurs u
            WHERE u.est_actif = 1
        ");
        
        if ($stmt === false) {
            return false;
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false;
        }
        
        $this->userData = $result->fetch_assoc();
        return true;
    }
    
    /**
     * Get user ID from token
     * @return int|null User ID or null if token is invalid
     */
    public function getUserId() {
        if (!$this->userData) {
            $this->validateToken();
        }
        
        return $this->userData ? $this->userData['id_utilisateur'] : null;
    }
    
    /**
     * Check if user is admin
     * @return bool True if user is admin, false otherwise
     */
    public function isAdmin() {
        if (!$this->userData) {
            $this->validateToken();
        }
        
        return $this->userData && $this->userData['est_admin'] == 1;
    }
    
    /**
     * Get user data
     * @return array|null User data or null if token is invalid
     */
    public function getUserData() {
        if (!$this->userData) {
            $this->validateToken();
        }
        
        return $this->userData;
    }
}
