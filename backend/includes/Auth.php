<?php

require_once __DIR__ . '/Database.php';

class Auth {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Register a new user
     * 
     * @param string $nom User's last name
     * @param string $prenom User's first name
     * @param string $email User's email
     * @param string $password User's password
     * @return array|bool Array with user information on success, false on failure
     */
    public function register($nom, $prenom, $email, $password) {
        // Check if email already exists
        $existingUser = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE email = ?", [$email]);
        
        if ($existingUser) {
            return false; // Email already exists
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $sql = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)";
        $userId = $this->db->insert($sql, [$nom, $prenom, $email, $hashedPassword]);
        
        if ($userId) {
            // Return user data for session
            return [
                'id' => $userId,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'role' => 'user'
            ];
        }
        
        return false;
    }
    
    /**
     * Login a user
     * 
     * @param string $email User's email
     * @param string $password User's password
     * @return array|bool User data on success, false on failure
     */
    public function login($email, $password) {
        // Get user by email
        $user = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE email = ?", [$email]);
        
        if (!$user) {
            return false; // User not found
        }
        
        // Verify password
        if (password_verify($password, $user['mot_de_passe'])) {
            // Return user data for session (excluding password)
            return [
                'id' => $user['id_utilisateur'],
                'nom' => $user['nom'],
                'prenom' => $user['prenom'],
                'email' => $user['email'],
                'role' => $user['role']
            ];
        }
        
        return false; // Invalid password
    }
    
    /**
     * Create a new session for logged in user
     * 
     * @param array $userData User data to store in session
     */
    public function createSession($userData) {
        // Start session if not already started
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['user'] = $userData;
        $_SESSION['logged_in'] = true;
    }
    
    /**
     * Check if user is logged in
     * 
     * @return bool True if logged in, false otherwise
     */
    public function isLoggedIn() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    /**
     * Log out current user
     */
    public function logout() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        // Unset all session variables
        $_SESSION = [];
        
        // Destroy the session
        session_destroy();
    }
}
