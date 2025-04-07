<?php
require_once '../config.php';
require_once '../db.php';

// Prevent this script from being run in production
if (!isset($_SERVER['REMOTE_ADDR']) || !in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1'])) {
    die("This script can only be run locally.");
}

header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitZone User Debug Tool</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #088178;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .password-info {
            background: #f8f9fa;
            border-left: 4px solid #088178;
            padding: 10px 15px;
            margin: 15px 0;
        }
        .action-button {
            padding: 8px 16px;
            background: #088178;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
        .success {
            color: #2ecc71;
            font-weight: bold;
        }
        .error {
            color: #e74c3c;
            font-weight: bold;
        }
        code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .debug-section {
            margin-top: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>FitZone User Authentication Debug Tool</h1>

    <?php
    // Connect to database
    try {
        $db = new Database();
        echo "<div class='success'>Database connection successful!</div>";

        // Check if database exists
        $db->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :dbname");
        $db->bind(':dbname', DB_NAME);
        $result = $db->single();

        if (!$result) {
            echo "<div class='error'>Database '".DB_NAME."' does not exist!</div>";
            echo "<p>Please run the database setup script first.</p>";
            exit();
        }

        // Check user table
        $db->query("SHOW TABLES LIKE 'utilisateurs'");
        $table = $db->single();
        
        if (!$table) {
            echo "<div class='error'>User table does not exist!</div>";
            echo "<p>Please run the database setup script to create the tables.</p>";
            exit();
        }

        // Action: Reset test user password
        if (isset($_POST['reset_password'])) {
            $email = "user@example.com";
            $newPassword = "userpass";
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $db->query("UPDATE utilisateurs SET mot_de_passe = :password WHERE email = :email");
            $db->bind(':password', $hashedPassword);
            $db->bind(':email', $email);
            
            if ($db->execute()) {
                echo "<div class='success'>Password for $email reset to '$newPassword'</div>";
            } else {
                echo "<div class='error'>Failed to reset password!</div>";
            }
        }
        
        // Action: Create test user
        if (isset($_POST['create_user'])) {
            $email = "user@example.com";
            $password = "userpass";
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Check if user exists
            $db->query("SELECT * FROM utilisateurs WHERE email = :email");
            $db->bind(':email', $email);
            $existingUser = $db->single();
            
            if ($existingUser) {
                $db->query("UPDATE utilisateurs SET mot_de_passe = :password WHERE email = :email");
                $db->bind(':password', $hashedPassword);
                $db->bind(':email', $email);
                $db->execute();
                echo "<div class='success'>Updated test user $email with password '$password'</div>";
            } else {
                $db->query("INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom) VALUES (:email, :password, 'Test', 'User')");
                $db->bind(':email', $email);
                $db->bind(':password', $hashedPassword);
                
                if ($db->execute()) {
                    echo "<div class='success'>Created test user $email with password '$password'</div>";
                } else {
                    echo "<div class='error'>Failed to create test user!</div>";
                }
            }
        }

        // Get all users
        $db->query("SELECT id_utilisateur, email, mot_de_passe, nom, prenom, est_admin FROM utilisateurs");
        $users = $db->resultSet();
        
        if (!$users) {
            echo "<div class='error'>No users found in the database!</div>";
        } else {
            echo "<h2>Users in Database</h2>";
            echo "<table>";
            echo "<tr><th>ID</th><th>Email</th><th>Name</th><th>Password Hash</th><th>Admin</th></tr>";
            
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td>{$user['id_utilisateur']}</td>";
                echo "<td>{$user['email']}</td>";
                echo "<td>{$user['prenom']} {$user['nom']}</td>";
                echo "<td>" . substr($user['mot_de_passe'], 0, 20) . "...</td>";
                echo "<td>" . ($user['est_admin'] ? 'Yes' : 'No') . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        }

        // Password verification test
        echo "<h2>Password Verification Test</h2>";
        
        // Default test users from database schema
        $testUsers = [
            ['email' => 'admin@fitzone.com', 'password' => 'adminpass'],
            ['email' => 'user@example.com', 'password' => 'userpass'],
            ['email' => 'jane@example.com', 'password' => 'userpass'],
        ];
        
        echo "<table>";
        echo "<tr><th>Email</th><th>Test Password</th><th>Status</th></tr>";
        
        foreach ($testUsers as $testUser) {
            // Get user with this email
            $db->query("SELECT * FROM utilisateurs WHERE email = :email");
            $db->bind(':email', $testUser['email']);
            $user = $db->single();
            
            $status = '';
            if (!$user) {
                $status = "<span class='error'>User not found</span>";
            } else {
                // Test password verification
                $verified = password_verify($testUser['password'], $user['mot_de_passe']);
                $status = $verified ? 
                    "<span class='success'>Password matches!</span>" : 
                    "<span class='error'>Password doesn't match</span>";
            }
            
            echo "<tr>";
            echo "<td>{$testUser['email']}</td>";
            echo "<td>{$testUser['password']}</td>";
            echo "<td>$status</td>";
            echo "</tr>";
        }
        
        echo "</table>";

    } catch (Exception $e) {
        echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
    }
    ?>

    <div class="debug-section">
        <h3>Actions</h3>
        <form method="post">
            <button type="submit" name="reset_password" class="action-button">Reset Test User Password</button>
            <button type="submit" name="create_user" class="action-button">Create/Update Test User</button>
        </form>
        
        <div class="password-info">
            <h3>Password Hashing Information</h3>
            <p>The original schema uses this password hash for userpass: <code>$2y$10$VQFr0Pb6NzK.hypX9Z0qGODPnwytZLUCnLWbwxnQFhj9Ejt7Htfb.</code></p>
            <p>Current PHP password_hash: <code><?= password_hash('userpass', PASSWORD_DEFAULT) ?></code></p>
            
            <h4>Common Issues:</h4>
            <ul>
                <li>Different PHP versions may generate different hashes</li>
                <li>The cost parameter in password_hash may be different</li>
                <li>The users may not have been properly inserted into the database</li>
            </ul>
            
            <p>Use the buttons above to reset or create test users with properly hashed passwords.</p>
        </div>
    </div>
</body>
</html>
