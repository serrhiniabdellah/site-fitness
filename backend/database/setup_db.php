<?php
// Database setup script for MySQL

// Connection details
$host = 'localhost';
$user = 'root';
$password = ''; // Change if your MySQL root user has a password

try {
    // Connect to MySQL server (without database)
    $conn = new PDO("mysql:host=$host", $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to MySQL server successfully.<br>";
    
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/fitzone_db.sql');
    
    // Execute SQL script
    $conn->exec($sql);
    
    echo "Database 'fitzone_db' created and populated successfully!<br>";
    echo "You can now start using your application with the database.<br>";
    
} catch(PDOException $e) {
    echo "<div style='color:red;'>Error: " . $e->getMessage() . "</div><br>";
    
    // More detailed error information
    if (strpos($e->getMessage(), 'syntax error') !== false) {
        echo "<h3>SQL Syntax Error</h3>";
        echo "<p>There appears to be a syntax error in your SQL script. Check the following:</p>";
        echo "<ul>";
        echo "<li>Make sure your SQL script is compatible with MySQL</li>";
        echo "<li>Check for missing semicolons at the end of statements</li>";
        echo "<li>Ensure proper quoting of table and column names if needed</li>";
        echo "</ul>";
    }
    elseif (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "<h3>Database Access Error</h3>";
        echo "<p>Could not access the database with the provided credentials. Check the following:</p>";
        echo "<ul>";
        echo "<li>Username and password are correct</li>";
        echo "<li>The database user has sufficient privileges</li>";
        echo "<li>MySQL server is running and accessible</li>";
        echo "</ul>";
    }
}

// Close connection
$conn = null;

// Additional help information
echo "<hr>";
echo "<h3>Troubleshooting Tips</h3>";
echo "<p>If you encountered errors:</p>";
echo "<ul>";
echo "<li>Make sure MySQL is running on your server</li>";
echo "<li>Check that the MySQL PDO extension is enabled in your PHP configuration</li>";
echo "<li>Verify that your database user has permissions to create databases</li>";
echo "<li>If using XAMPP/WAMP/MAMP, ensure the services are started</li>";
echo "</ul>";
?>
