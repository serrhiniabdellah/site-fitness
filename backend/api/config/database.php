<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;
    private $port;

    public function __construct() {
        // Detect Docker environment
        $is_docker = getenv('DB_HOST') === 'database';

        // Use environment variables in Docker, fallback to default values
        $this->host = $is_docker ? getenv('DB_HOST') : "localhost";
        $this->db_name = $is_docker ? getenv('DB_NAME') : "fitzone_db";
        $this->username = $is_docker ? getenv('DB_USER') : "root";
        $this->password = $is_docker ? getenv('DB_PASS') : ""; // Default XAMPP password is empty
        
        // Use port 3306 in Docker, fallback to 3307 for local dev
        $this->port = $is_docker ? 3306 : 3307;
    }

    /**
     * Get database connection
     * @return mysqli The database connection object
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name, $this->port);
            
            if ($this->conn->connect_error) {
                throw new Exception("Connection error: " . $this->conn->connect_error);
            }
            
            // Set charset to utf8mb4
            $this->conn->set_charset("utf8mb4");
        } catch(Exception $e) {
            echo "Database connection error: " . $e->getMessage();
        }

        return $this->conn;
    }
}

// Create database connection
$database = new Database();
$conn = $database->getConnection();
