<?php
require_once 'config.php';

/**
 * Utility functions for the API
 */
class Utils {
    /**
     * Send a JSON response with appropriate headers
     */
    public static function sendResponse($success, $message, $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = [
            'success' => $success,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }
    
    /**
     * Get JSON data from request body
     */
    public static function getJsonData() {
        $json = file_get_contents('php://input');
        return json_decode($json, true);
    }
    
    /**
     * Validate a JWT token
     */
    public static function validateToken($token) {
        if (!defined('JWT_SECRET')) {
            throw new Exception('JWT_SECRET not defined');
        }
        
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        $header = base64_decode($tokenParts[0]);
        $payload = base64_decode($tokenParts[1]);
        $signature = $tokenParts[2];
        
        // Verify signature
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        $expectedSignature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", JWT_SECRET, true);
        $expectedSignature = self::base64UrlEncode($expectedSignature);
        
        if ($signature !== $expectedSignature) {
            return false;
        }
        
        $data = json_decode($payload, true);
        
        // Check token expiration
        if (isset($data['exp']) && $data['exp'] < time()) {
            return false;
        }
        
        return $data;
    }
    
    /**
     * Create a JWT token
     */
    public static function createToken($userId, $expiresIn = 3600) {
        if (!defined('JWT_SECRET')) {
            throw new Exception('JWT_SECRET not defined');
        }
        
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);
        
        $payload = json_encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + $expiresIn
        ]);
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", JWT_SECRET, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
    }
    
    /**
     * Generate a JWT token for authentication
     */
    public static function generateToken($userId, $expiresIn = 86400) {
        if (!defined('JWT_SECRET')) {
            throw new Exception('JWT_SECRET not defined');
        }
        
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);
        
        $payload = json_encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + $expiresIn
        ]);
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", JWT_SECRET, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
    }
    
    /**
     * Base64Url encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Sanitize user input
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::sanitizeInput($value);
            }
            return $data;
        }
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate request method
     */
    public static function validateMethod($method) {
        if ($_SERVER['REQUEST_METHOD'] !== $method) {
            self::sendResponse(false, "Method not allowed", null, 405);
        }
    }
    
    /**
     * Check if user is authenticated
     */
    public static function requireAuth() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            self::sendResponse(false, 'No authorization header provided', null, 401);
        }
        
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') !== 0) {
            self::sendResponse(false, 'Invalid authentication format', null, 401);
        }
        
        $token = substr($auth, 7);
        $tokenData = self::validateToken($token);
        
        if (!$tokenData) {
            self::sendResponse(false, 'Invalid or expired token', null, 401);
        }
        
        return $tokenData;
    }
    
    /**
     * Generate pagination data
     */
    public static function getPaginationData($page, $total_items, $items_per_page) {
        $page = max(1, intval($page));
        $total_pages = ceil($total_items / $items_per_page);
        
        return [
            'page' => $page,
            'per_page' => $items_per_page,
            'total_items' => $total_items,
            'total_pages' => $total_pages,
            'has_previous' => $page > 1,
            'has_next' => $page < $total_pages,
            'previous_page' => $page > 1 ? $page - 1 : null,
            'next_page' => $page < $total_pages ? $page + 1 : null,
        ];
    }
}
?>
