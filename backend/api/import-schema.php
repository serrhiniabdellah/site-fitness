<?php
/**
 * Database Schema Import Tool
 * 
 * This script imports the database schema from the schema.sql file
 */
header('Content-Type: application/json');

// Display all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Define database connection parameters directly in this file
$dbhost = 'localhost';
$dbport = 3307;
$dbuser = 'root';
$dbpass = '';

try {
    // First, try to connect without selecting a database
    $conn = new mysqli($dbhost, $dbuser, $dbpass, '', $dbport);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Path to the schema file
    $schemaFile = __DIR__ . '/../database/schema.sql';
    
    if (!file_exists($schemaFile)) {
        throw new Exception('Schema file not found: ' . $schemaFile);
    }
    
    // Read the schema file
    $sql = file_get_contents($schemaFile);
    
    // Split the file into individual queries
    $queries = explode(';', $sql);
    
    $results = [];
    
    // Execute each query
    foreach ($queries as $query) {
        $query = trim($query);
        if (!empty($query)) {
            $result = $conn->query($query);
            if ($result === false) {
                $results[] = [
                    'query' => $query,
                    'success' => false,
                    'error' => $conn->error
                ];
            } else {
                $results[] = [
                    'query' => $query,
                    'success' => true
                ];
            }
        }
    }
    
    // Select the database to check if tables were created
    $conn->select_db('fitzone_db');
    
    // Get tables
    $tables = [];
    $result = $conn->query("SHOW TABLES");
    while ($table = $result->fetch_row()) {
        $tables[] = $table[0];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Schema imported successfully',
        'tables' => $tables,
        'results' => $results
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to import schema',
        'error' => $e->getMessage()
    ]);
}
