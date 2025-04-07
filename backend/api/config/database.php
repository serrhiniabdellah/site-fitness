<?php
// Database connection settings
$host = "localhost";
$username = "root";
$password = ""; // Default XAMPP password is empty
$database = "fitzone_db";
$port = 3307; // As seen in your SQL dump, you're using port 3307

// Create connection
$conn = new mysqli($host, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to ensure proper encoding
$conn->set_charset("utf8mb4");
