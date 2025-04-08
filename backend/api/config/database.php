<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;
    private $port;

    public function __construct() {
        $this->host = "localhost";
        $this->db_name = "fitzone_db";
        $this->username = "root";
        $this->password = ""; // Default XAMPP password is empty
        $this->port = 3307; // As seen in your SQL dump
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
