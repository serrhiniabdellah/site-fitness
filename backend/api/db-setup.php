<?php
/**
 * Database Setup Script
 * This script creates the database and tables using any available MySQL extension
 */
header('Content-Type: application/json');

// Define database connection parameters directly in this file
$host = 'localhost';
$port = 3307;
$dbname = 'fitzone_db';
$username = 'root';
$password = '';

try {
    // Get available extensions
    $extensions = get_loaded_extensions();
    
    // Try to connect and create database
    if (in_array('mysqli', $extensions)) {
        setupWithMysqli($host, $port, $username, $password, $dbname);
        $connection_type = 'mysqli';
    } elseif (in_array('pdo_mysql', $extensions)) {
        setupWithPDO($host, $port, $username, $password, $dbname);
        $connection_type = 'pdo_mysql';
    } else {
        throw new Exception('No MySQL extensions available. You need to enable mysqli or pdo_mysql in your PHP configuration.');
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Database setup completed successfully using $connection_type",
        'connection_type' => $connection_type
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database setup failed',
        'error' => $e->getMessage(),
        'php_version' => PHP_VERSION,
        'loaded_extensions' => get_loaded_extensions()
    ]);
}

// Setup database using mysqli extension
function setupWithMysqli($host, $port, $username, $password, $dbname) {
    // Connect without selecting a database
    $conn = new mysqli($host, $username, $password, '', $port);
    
    if ($conn->connect_error) {
        throw new Exception("MySQLi connection failed: " . $conn->connect_error);
    }
    
    // Create database if it doesn't exist
    $conn->query("CREATE DATABASE IF NOT EXISTS $dbname");
    
    // Select the database
    $conn->select_db($dbname);
    
    // Create tables using the schema
    createTables($conn, 'mysqli');
    
    $conn->close();
}

// Setup database using PDO extension
function setupWithPDO($host, $port, $username, $password, $dbname) {
    // Connect without selecting a database
    $dsn = "mysql:host=$host;port=$port";
    $conn = new PDO($dsn, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if it doesn't exist
    $conn->exec("CREATE DATABASE IF NOT EXISTS $dbname");
    
    // Connect to the specific database
    $conn = null;
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $conn = new PDO($dsn, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create tables using the schema
    createTables($conn, 'pdo');
    
    $conn = null;
}

// Create database tables
function createTables($conn, $type) {
    // SQL for creating tables
    $tables = [
        "CREATE TABLE IF NOT EXISTS utilisateurs (
            id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(50) NOT NULL,
            prenom VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE IF NOT EXISTS categories (
            id_categorie INT PRIMARY KEY AUTO_INCREMENT,
            nom_categorie VARCHAR(50) NOT NULL,
            description TEXT
        )",
        
        "CREATE TABLE IF NOT EXISTS produits (
            id_produit INT PRIMARY KEY AUTO_INCREMENT,
            nom_produit VARCHAR(100) NOT NULL,
            description TEXT,
            prix DECIMAL(10,2) NOT NULL,
            stock INT DEFAULT 0,
            id_categorie INT,
            image VARCHAR(255),
            est_promotion BOOLEAN DEFAULT FALSE,
            pourcentage_promotion DECIMAL(5,2) DEFAULT 0,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie)
        )",
        
        "CREATE TABLE IF NOT EXISTS panier (
            id_panier INT PRIMARY KEY AUTO_INCREMENT,
            id_utilisateur INT,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            est_actif BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
        )",
        
        "CREATE TABLE IF NOT EXISTS ligne_panier (
            id_ligne_panier INT PRIMARY KEY AUTO_INCREMENT,
            id_panier INT,
            id_produit INT,
            quantite INT DEFAULT 1,
            FOREIGN KEY (id_panier) REFERENCES panier(id_panier),
            FOREIGN KEY (id_produit) REFERENCES produits(id_produit)
        )"
    ];
    
    foreach ($tables as $sql) {
        if ($type === 'mysqli') {
            $result = $conn->query($sql);
            if ($result === false) {
                throw new Exception("Table creation failed: " . $conn->error);
            }
        } else {
            $conn->exec($sql);
        }
    }
    
    // Insert some sample data
    sampleData($conn, $type);
}

// Insert sample data
function sampleData($conn, $type) {
    // Add some categories
    $categories = [
        "INSERT IGNORE INTO categories (nom_categorie, description) VALUES ('Protéines', 'Compléments protéinés pour la musculation')",
        "INSERT IGNORE INTO categories (nom_categorie, description) VALUES ('Vêtements', 'Vêtements de sport et accessoires')",
        "INSERT IGNORE INTO categories (nom_categorie, description) VALUES ('Équipement', 'Matériel de fitness et musculation')"
    ];
    
    foreach ($categories as $sql) {
        if ($type === 'mysqli') {
            $conn->query($sql);
        } else {
            $conn->exec($sql);
        }
    }
    
    // Add some products
    $products = [
        "INSERT IGNORE INTO produits (nom_produit, description, prix, stock, id_categorie, image) 
         VALUES ('Whey Protein', 'Protéine de lactosérum de haute qualité', 29.99, 50, 1, 'whey.jpg')",
         
        "INSERT IGNORE INTO produits (nom_produit, description, prix, stock, id_categorie, image) 
         VALUES ('T-shirt FitZone', 'T-shirt de sport respirant', 19.99, 100, 2, 'tshirt.jpg')",
         
        "INSERT IGNORE INTO produits (nom_produit, description, prix, stock, id_categorie, image) 
         VALUES ('Haltères 5kg', 'Paire d\'haltères de 5kg', 49.99, 30, 3, 'halteres.jpg')"
    ];
    
    foreach ($products as $sql) {
        if ($type === 'mysqli') {
            $conn->query($sql);
        } else {
            $conn->exec($sql);
        }
    }
}
