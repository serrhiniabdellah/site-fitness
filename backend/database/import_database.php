<?php
/**
 * Database Import Script
 * Safely imports the SQL database schema
 */

// Database configuration - get from config.php or define here
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'fitzone_db';

// Connect to MySQL server
try {
    // Connect without database selected first
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>MySQL Connection Successful</h2>";
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    echo "<p>Database '$database' created or already exists.</p>";
    
    // Select the database
    $pdo->exec("USE `$database`");
    echo "<p>Database '$database' selected.</p>";
    
    // Read SQL file
    $sql_file = file_get_contents(__DIR__ . '/fitzone_db.sql');
    
    // Split SQL file into individual statements
    $statements = parseSQL($sql_file);
    
    // Execute each statement
    echo "<h3>Executing SQL statements:</h3>";
    echo "<ul>";
    
    foreach ($statements as $statement) {
        if (trim($statement) == '') continue;
        
        try {
            $pdo->exec($statement);
            $command = getFirstCommand($statement);
            echo "<li style='color:green'>✓ Successfully executed: $command...</li>";
        } catch (PDOException $e) {
            echo "<li style='color:red'>❌ Error executing: " . getFirstCommand($statement) . 
                 "... - " . $e->getMessage() . "</li>";
        }
    }
    
    echo "</ul>";
    echo "<h3>Database setup completed!</h3>";
    
} catch (PDOException $e) {
    die("<h2 style='color:red'>Connection failed: " . $e->getMessage() . "</h2>");
}

/**
 * Parse SQL file into individual statements
 */
function parseSQL($sql) {
    $sql = trim(preg_replace('/\s+/', ' ', $sql));
    $statements = [];
    $current = '';
    $delimiter = ';';
    
    for ($i = 0; $i < strlen($sql); $i++) {
        if ($sql[$i] == $delimiter) {
            $statements[] = $current . $delimiter;
            $current = '';
            continue;
        }
        
        $current .= $sql[$i];
    }
    
    if (!empty($current)) {
        $statements[] = $current;
    }
    
    return $statements;
}

/**
 * Extract the first SQL command from a statement for display
 */
function getFirstCommand($statement) {
    $statement = trim($statement);
    $words = explode(' ', $statement);
    
    if (count($words) >= 3) {
        return strtoupper($words[0]) . " " . $words[1] . " " . $words[2];
    } else {
        return substr($statement, 0, 30) . "...";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>FitZone Database Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h2 {
            color: #088178;
        }
        h3 {
            color: #333;
        }
        p {
            margin-bottom: 15px;
        }
        ul {
            margin: 15px 0;
        }
        li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
</body>
</html>
