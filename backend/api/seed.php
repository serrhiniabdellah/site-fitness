<?php
/**
 * Database Seed API
 * 
 * Seeds the database with sample data
 */

// Set content type to JSON
header('Content-Type: application/json');

// Check if script is run from command line or web
$is_cli = (php_sapi_name() === 'cli');

// Database connection parameters
$host = '127.0.0.1';
$port = 3307;
$user = 'root';
$pass = '';
$dbname = 'fitzone_db';

try {
    // Connect to MySQL
    if (extension_loaded('mysqli')) {
        $conn = new mysqli($host, $user, $pass, $dbname, $port);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        // Read and execute SQL file
        $sql_file = __DIR__ . '/../database/seed_data.sql';
        
        if (!file_exists($sql_file)) {
            throw new Exception("SQL file not found: $sql_file");
        }
        
        $sql = file_get_contents($sql_file);
        
        // Split SQL by semicolons (very simple implementation)
        $queries = explode(';', $sql);
        
        foreach ($queries as $query) {
            $query = trim($query);
            if (!empty($query) && strpos($query, '--') !== 0) { // Skip comments and empty lines
                $result = $conn->query($query);
                if ($result === false && $conn->errno != 1065) { // 1065 = empty query
                    throw new Exception("Query failed: $query - Error: " . $conn->error);
                }
            }
        }
        
        // Get product count
        $result = $conn->query("SELECT COUNT(*) as count FROM produits");
        $row = $result->fetch_assoc();
        $product_count = $row['count'];
        
        // Close connection
        $conn->close();
        
        // Return success response
        $response = [
            'success' => true,
            'message' => "Database seeded successfully! $product_count products added.",
            'product_count' => $product_count
        ];
        
    } else {
        throw new Exception("MySQLi extension is not available. Please enable it in your PHP configuration.");
    }
} catch (Exception $e) {
    // Return error response
    $response = [
        'success' => false,
        'message' => "Failed to seed database: " . $e->getMessage()
    ];
}

// Output response
if ($is_cli) {
    echo $response['success'] ? "SUCCESS: " : "ERROR: ";
    echo $response['message'] . "\n";
} else {
    echo json_encode($response);
}
