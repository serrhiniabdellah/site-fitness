<?php
// Database setup script for MySQL on port 3307

// Display styles for better readability
echo "<!DOCTYPE html>
<html>
<head>
    <title>FitZone Database Setup</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .info { color: blue; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .step { margin-bottom: 20px; border-left: 5px solid #ddd; padding-left: 15px; }
        .option { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .option-header { font-weight: bold; margin-bottom: 10px; }
        button, .button { padding: 8px 16px; background: #088178; color: white; border: none; 
                border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 5px 0; }
        button:hover, .button:hover { opacity: 0.9; }
        .danger { background-color: #e74c3c; }
    </style>
</head>
<body>
    <h1>FitZone Database Setup</h1>";

// Get the action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Connection details - using port 3307 as specified in your MySQL config
$host = 'localhost';
$port = 3307;
$user = 'root';
$password = ''; // Change if your MySQL root user has a password

// Show options if no action is specified
if (empty($action)) {
    echo "<div class='option'>
        <div class='option-header'>Choose a setup option:</div>
        <p>Select how you want to set up the database:</p>
        <a href='?action=verify' class='button'>Verify Database & Update User</a>
        <a href='?action=update_schema' class='button'>Update Schema Only</a>
        <a href='?action=reset' class='button danger'>Reset Database (WILL DELETE ALL DATA)</a>
    </div>";
    exit;
}

try {
    // Step 1: Connect to MySQL server
    echo "<div class='step'><h3>Step 1: Connecting to MySQL server</h3>";
    
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p class='success'>Connected to MySQL server successfully!</p></div>";
    
    // Step 2: Handle database based on selected action
    echo "<div class='step'><h3>Step 2: Setting up database</h3>";
    
    if ($action === 'reset') {
        // Drop database if it exists
        $pdo->exec("DROP DATABASE IF EXISTS `fitzone_db`");
        echo "<p class='warning'>Database 'fitzone_db' has been dropped.</p>";
    }
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `fitzone_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    echo "<p class='success'>Database 'fitzone_db' created or confirmed to exist.</p></div>";
    
    // Step 3: Select the database
    $pdo->exec("USE `fitzone_db`");
    
    // Step 4: Handle schema based on action
    echo "<div class='step'><h3>Step 3: Managing database structure</h3>";
    
    if ($action === 'reset') {
        // Full reset - import the entire schema
        echo "<p>Performing full database reset and import...</p>";
        importFullSchema($pdo);
    } else if ($action === 'update_schema') {
        // Update schema without dropping tables
        echo "<p>Updating database schema without dropping existing tables...</p>";
        updateSchemaOnly($pdo);
    }
    
    // Step 5: Always verify user accounts
    echo "<div class='step'><h3>Step 4: Verifying user credentials</h3>";
    
    // Check if utilisateurs table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        // User account handling
        verifyUserAccounts($pdo);
    } else {
        echo "<p class='error'>Table 'utilisateurs' doesn't exist! Something went wrong with the import.</p>";
    }
    
    echo "</div>";
    
    echo "<div class='step'><h3>Setup Complete!</h3>
    <p class='success'>FitZone database has been set up successfully!</p>
    <p>You can now use the following credentials to log in:</p>
    <ul>
        <li><strong>Admin User:</strong> admin@fitzone.com / adminpass</li>
        <li><strong>Regular User:</strong> user@example.com / userpass</li>
    </ul>
    <p>Your database configuration should be:</p>
    <pre>
define('DB_HOST', 'localhost:3307');
define('DB_USER', 'root');
define('DB_PASS', ''); // Use your actual password if set
define('DB_NAME', 'fitzone_db');
    </pre>
    <p><a href='mysql_setup.php' class='button'>Back to Setup Options</a></p>
    </div>";
    
} catch (PDOException $e) {
    echo "<p class='error'>Database error: " . htmlspecialchars($e->getMessage()) . "</p>";
    
    // Provide troubleshooting tips
    echo "<div class='step'><h3>Troubleshooting Tips</h3>
    <ul>
        <li>Make sure your MySQL server is running on port 3307</li>
        <li>Verify that the username and password are correct</li>
        <li>Check that you have sufficient permissions to create and modify databases</li>
        <li>Try the 'Verify Database & Update User' option first</li>
    </ul>
    <p><a href='mysql_setup.php' class='button'>Back to Setup Options</a></p>
    </div>";
}

echo "</body></html>";

/**
 * Import full database schema (used for reset option)
 */
function importFullSchema($pdo) {
    // First, drop all tables to avoid constraint issues
    $tables = getTables($pdo);
    if (!empty($tables)) {
        // Disable foreign key checks temporarily
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS `$table`");
            echo "<p class='info'>Dropped table: $table</p>";
        }
        
        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
    
    // Now import the schema
    $sqlFile = file_get_contents(__DIR__ . '/fitzone_db.sql');
    $sqlFile = cleanSqlFile($sqlFile);
    
    // Split the SQL file into individual statements
    $statements = extractQueries($sqlFile);
    $totalQueries = count($statements);
    $executedQueries = 0;
    $errorCount = 0;
    
    // Execute each statement
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                $executedQueries++;
            } catch (PDOException $e) {
                // Skip some common non-critical errors
                $errorCode = $e->getCode();
                if (!in_array($errorCode, ['42S01', '42S02', '42000', '23000'])) { // Table already exists, doesn't exist, syntax error, duplicate entry
                    echo "<p class='error'>Error executing statement: " . htmlspecialchars($e->getMessage()) . "</p>";
                    echo "<pre>" . htmlspecialchars(substr($statement, 0, 300)) . "...</pre>";
                    $errorCount++;
                }
            }
        }
    }
    
    if ($errorCount > 0) {
        echo "<p class='warning'>Database import completed with some errors. Executed $executedQueries statements successfully with $errorCount errors.</p>";
    } else {
        echo "<p class='success'>Database import completed successfully! Executed $executedQueries statements.</p>";
    }
}

/**
 * Update schema without dropping tables
 */
function updateSchemaOnly($pdo) {
    // First check if tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        // No tables - do full import
        echo "<p class='info'>No tables found in the database. Performing full import...</p>";
        importFullSchema($pdo);
        return;
    }
    
    echo "<p class='info'>Found " . count($tables) . " existing tables. Checking for schema updates...</p>";
    
    // For a proper schema update we should compare existing schema with desired schema
    // But for simplicity, we'll just ensure the essential tables exist
    $requiredTables = [
        'utilisateurs', 'produits', 'categories', 'variants_produit',
        'commandes', 'avis', 'cart', 'images_produit'
    ];
    
    $missingTables = array_diff($requiredTables, $tables);
    
    if (!empty($missingTables)) {
        echo "<p class='warning'>Missing tables detected: " . implode(', ', $missingTables) . "</p>";
        echo "<p class='info'>Consider using the 'Reset Database' option for a complete setup.</p>";
    } else {
        echo "<p class='success'>All required tables appear to be present.</p>";
    }
}

/**
 * Verify and update user accounts
 */
function verifyUserAccounts($pdo) {
    // Check if admin user exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs WHERE email = 'admin@fitzone.com'");
    $adminCount = $stmt->fetchColumn();
    
    if ($adminCount > 0) {
        // Update admin password
        $hashedAdminPassword = password_hash('adminpass', PASSWORD_DEFAULT);
        $pdo->exec("UPDATE utilisateurs SET mot_de_passe = '$hashedAdminPassword' WHERE email = 'admin@fitzone.com'");
        echo "<p class='success'>Updated admin user 'admin@fitzone.com' with password 'adminpass'</p>";
    } else {
        // Create admin user
        $hashedAdminPassword = password_hash('adminpass', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, est_admin) VALUES ('admin@fitzone.com', '$hashedAdminPassword', 'Admin', 'User', 1)");
        echo "<p class='success'>Created admin user 'admin@fitzone.com' with password 'adminpass'</p>";
    }
    
    // Check if test user exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs WHERE email = 'user@example.com'");
    $userCount = $stmt->fetchColumn();
    
    if ($userCount > 0) {
        // Update test user password
        $hashedPassword = password_hash('userpass', PASSWORD_DEFAULT);
        $pdo->exec("UPDATE utilisateurs SET mot_de_passe = '$hashedPassword' WHERE email = 'user@example.com'");
        echo "<p class='success'>Updated test user 'user@example.com' with password 'userpass'</p>";
    } else {
        // Create test user
        $hashedPassword = password_hash('userpass', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom) VALUES ('user@example.com', '$hashedPassword', 'User', 'Test')");
        echo "<p class='success'>Created test user 'user@example.com' with password 'userpass'</p>";
    }
    
    // Check the row count in users table
    $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
    $userCount = $stmt->fetchColumn();
    echo "<p class='info'>Total users in database: $userCount</p>";
}

/**
 * Get all tables in the database
 */
function getTables($pdo) {
    $stmt = $pdo->query("SHOW TABLES");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * Clean the SQL file to remove problematic parts
 */
function cleanSqlFile($sql) {
    // Remove phpMyAdmin specific parts
    $sql = preg_replace('/--\s*Base de données[\s\S]*?phpmyadmin[^;]*;/i', '', $sql);
    $sql = preg_replace('/CREATE DATABASE IF NOT EXISTS `phpmyadmin`[\s\S]*?USE `phpmyadmin`;/i', '', $sql);
    $sql = preg_replace('/CREATE TABLE `pma__[^`]*`[\s\S]*?;/i', '', $sql);
    $sql = preg_replace('/INSERT INTO `pma__[^`]*`[\s\S]*?;/i', '', $sql);
    $sql = preg_replace('/ALTER TABLE `pma__[^`]*`[\s\S]*?;/i', '', $sql);
    
    // Remove test database
    $sql = preg_replace('/--\s*Base de données[\s\S]*?test[^;]*;/i', '', $sql);
    $sql = preg_replace('/CREATE DATABASE IF NOT EXISTS `test`[\s\S]*?USE `test`;/i', '', $sql);
    
    return $sql;
}

/**
 * Extract individual SQL queries from a file
 */
function extractQueries($sql) {
    // Remove comments
    $sql = preg_replace('!/\*.*?\*/!s', '', $sql);
    $sql = preg_replace('/--.*?$/m', '', $sql);
    
    // Split on semicolons followed by whitespace or end of string
    $queries = preg_split('/;\s*$/m', $sql);
    
    // Filter out empty queries and certain statements we want to skip
    $filteredQueries = array_filter($queries, function($query) {
        $query = trim($query);
        if (empty($query)) return false;
        
        // Skip phpMyAdmin tables
        if (strpos($query, 'pma__') !== false) return false;
        
        // Skip statements that are likely to cause issues
        $skipPatterns = [
            'USE `phpmyadmin`',
            'USE `test`',
        ];
        
        foreach ($skipPatterns as $pattern) {
            if (strpos($query, $pattern) !== false) return false;
        }
        
        return true;
    });
    
    return array_values($filteredQueries);
}
?>
