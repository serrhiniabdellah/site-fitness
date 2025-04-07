<?php
require_once 'config.php';

class Database {
    private $host = DB_HOST;
    private $user = DB_USER;
    private $pass = DB_PASS;
    private $dbname = DB_NAME;
    private $dbh;
    private $stmt;
    private $error;
    private $transaction = false;

    public function __construct() {
        // Set DSN (Data Source Name)
        $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4";
        
        // Set PDO options
        $options = [
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        // Attempt connection
        try {
            $this->dbh = new PDO($dsn, $this->user, $this->pass, $options);
            // For debugging only - remove in production
            if(defined('CONFIG_DEBUG') && CONFIG_DEBUG) {
                error_log("Database connection successful");
            }
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            // Format error as JSON for API responses
            $errorResponse = [
                'error' => "Database connection error: {$this->error}"
            ];
            
            header('Content-Type: application/json');
            echo json_encode($errorResponse);
            exit();
        }
    }

    // Prepare statement with query
    public function query($query) {
        $this->stmt = $this->dbh->prepare($query);
    }

    // Bind values
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        $this->stmt->bindValue($param, $value, $type);
    }

    // Execute the prepared statement
    public function execute() {
        return $this->stmt->execute();
    }

    // Get result set as array of objects
    public function resultSet() {
        $this->execute();
        return $this->stmt->fetchAll(PDO::FETCH_OBJ);
    }

    // Get result set as array of associative arrays
    public function resultSetArray() {
        $this->execute();
        return $this->stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get single record as object
    public function single() {
        $this->execute();
        return $this->stmt->fetch(PDO::FETCH_OBJ);
    }

    // Get single record as associative array
    public function singleArray() {
        $this->execute();
        return $this->stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Get row count
    public function rowCount() {
        return $this->stmt->rowCount();
    }

    // Get last inserted ID
    public function lastInsertId() {
        return $this->dbh->lastInsertId();
    }

    // Start transaction
    public function beginTransaction() {
        $this->transaction = $this->dbh->beginTransaction();
        return $this->transaction;
    }

    // End transaction
    public function endTransaction() {
        $this->transaction = false;
        return $this->dbh->commit();
    }

    // Cancel transaction
    public function cancelTransaction() {
        $this->transaction = false;
        return $this->dbh->rollBack();
    }
    
    // Check if in transaction - NEW METHOD
    public function inTransaction() {
        return $this->transaction || $this->dbh->inTransaction();
    }
}
?>
