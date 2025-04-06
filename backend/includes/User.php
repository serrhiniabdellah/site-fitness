<?php
/**
 * User management class
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function register($userData) {
        try {
            // Check if email already exists
            $existingUser = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE email = ?", [$userData['email']]);
            
            if ($existingUser) {
                return [
                    'success' => false,
                    'message' => 'Email already registered'
                ];
            }
            
            // Hash password
            $userData['mot_de_passe'] = password_hash($userData['password'], PASSWORD_DEFAULT);
            unset($userData['password']); // Remove plaintext password
            
            // Set default role if not provided
            if (!isset($userData['role'])) {
                $userData['role'] = 'user';
            }
            
            // Insert user
            $userId = $this->db->insert('utilisateurs', $userData);
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            
            // Prepare response data
            $userData['id_utilisateur'] = $userId;
            $userData['token'] = $token;
            unset($userData['mot_de_passe']); // Don't return password hash
            
            return [
                'success' => true,
                'message' => 'Registration successful',
                'user' => $userData,
                'token' => $token
            ];
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ];
        }
    }
    
    public function login($email, $password) {
        try {
            // Log attempt
            error_log("Login attempt for email: $email");
            
            $user = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE email = ?", [$email]);
            
            if (!$user) {
                error_log("Login failed: User not found for email: $email");
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }
            
            // In case the password is stored in plaintext during development
            $passwordVerified = false;
            if (isset($user['mot_de_passe'])) {
                if (password_verify($password, $user['mot_de_passe'])) {
                    $passwordVerified = true;
                } else if ($password === $user['mot_de_passe']) {
                    // Temporary fallback for plaintext passwords (remove in production)
                    $passwordVerified = true;
                    error_log("Warning: Using plaintext password comparison for user: $email");
                }
            }
            
            if (!$passwordVerified) {
                error_log("Login failed: Invalid password for email: $email");
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            
            // Prepare user data (exclude password)
            $userData = [
                'id_utilisateur' => $user['id_utilisateur'],
                'prenom' => $user['prenom'],
                'nom' => $user['nom'],
                'email' => $user['email'],
                'role' => $user['role'],
                'token' => $token
            ];
            
            error_log("Login successful for email: $email");
            
            return [
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => $userData
            ];
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ];
        }
    }
    
    public function updateProfile($userId, $userData) {
        try {
            // Don't allow updating sensitive fields
            unset($userData['id_utilisateur']);
            unset($userData['role']);
            unset($userData['mot_de_passe']);
            
            $this->db->update('utilisateurs', $userData, 'id_utilisateur = :id', ['id' => $userId]);
            
            // Get updated user data
            $updatedUser = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE id_utilisateur = ?", [$userId]);
            
            if (!$updatedUser) {
                return [
                    'success' => false,
                    'message' => 'Failed to retrieve updated user data'
                ];
            }
            
            // Remove sensitive data
            unset($updatedUser['mot_de_passe']);
            
            return [
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $updatedUser
            ];
        } catch (Exception $e) {
            error_log("Update profile error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ];
        }
    }
    
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            $user = $this->db->fetchOne("SELECT * FROM utilisateurs WHERE id_utilisateur = ?", [$userId]);
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }
            
            // Verify current password
            if (!password_verify($currentPassword, $user['mot_de_passe'])) {
                return [
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ];
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $this->db->update('utilisateurs', [
                'mot_de_passe' => $hashedPassword
            ], 'id_utilisateur = :id', ['id' => $userId]);
            
            return [
                'success' => true,
                'message' => 'Password updated successfully'
            ];
        } catch (Exception $e) {
            error_log("Change password error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to change password: ' . $e->getMessage()
            ];
        }
    }
}
?>