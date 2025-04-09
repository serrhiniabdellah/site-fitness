<?php
// This file will check your server configuration

echo "<h1>Server Configuration Check</h1>";

// Check if we're running on a web server
echo "<h2>Server Information</h2>";
echo "<p>Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Not detected - you might be accessing this directly without a web server') . "</p>";
echo "<p>Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Not detected') . "</p>";
echo "<p>Script Path: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Not detected') . "</p>";
echo "<p>Current URL: " . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . "://" . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($_SERVER['REQUEST_URI'] ?? '') . "</p>";

// Check PHP version
echo "<h2>PHP Information</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Check important extensions
echo "<h2>Required Extensions</h2>";
$requiredExtensions = ['mysqli', 'pdo_mysql', 'json', 'mbstring'];
echo "<ul>";
foreach ($requiredExtensions as $ext) {
    echo "<li>" . $ext . ": " . (extension_loaded($ext) ? "✓ Enabled" : "✗ Not enabled") . "</li>";
}
echo "</ul>";

// Check directory paths
echo "<h2>Directory Path Check</h2>";
$projectRoot = __DIR__;
echo "<p>Current file location: " . $projectRoot . "</p>";

// Check backend paths
$backendPath = $projectRoot . '/backend';
$apiPath = $backendPath . '/api';
echo "<p>Backend path: " . $backendPath . " - " . (is_dir($backendPath) ? "✓ Exists" : "✗ Not found") . "</p>";
echo "<p>API path: " . $apiPath . " - " . (is_dir($apiPath) ? "✓ Exists" : "✗ Not found") . "</p>";

// Check key files
echo "<h2>Key Files Check</h2>";
$keyFiles = [
    $projectRoot . '/backend/config.php',
    $apiPath . '/test_connection.php',
    $apiPath . '/cors-handler.php'
];

echo "<ul>";
foreach ($keyFiles as $file) {
    echo "<li>" . $file . ": " . (file_exists($file) ? "✓ Exists" : "✗ Not found") . "</li>";
}
echo "</ul>";

// Check for htaccess file which might affect routing
echo "<h2>.htaccess Check</h2>";
$htaccessPath = $projectRoot . '/.htaccess';
echo "<p>.htaccess file: " . (file_exists($htaccessPath) ? "✓ Exists" : "✗ Not found") . "</p>";
if (file_exists($htaccessPath)) {
    echo "<p>Content:</p>";
    echo "<pre>" . htmlspecialchars(file_get_contents($htaccessPath)) . "</pre>";
}

// Test URL construction for the API
$hostname = $_SERVER['HTTP_HOST'] ?? 'localhost';
$possibleUrls = [
    "http://{$hostname}/site-fitness/backend/api/test_connection.php",
    "http://{$hostname}/site_fitness/backend/api/test_connection.php",
    "http://{$hostname}/site-fitness/backend/api/simple_test.php",
    "http://{$hostname}/site_fitness/backend/api/simple_test.php"
];

echo "<h2>Possible API URLs</h2>";
echo "<ul>";
foreach ($possibleUrls as $url) {
    echo "<li><a href=\"{$url}\" target=\"_blank\">{$url}</a></li>";
}
echo "</ul>";

// Suggested actions
echo "<h2>Suggested Actions</h2>";
echo "<ol>";
echo "<li>Make sure your web server (Apache/XAMPP/WAMP) is running</li>";
echo "<li>Check that your document root is correctly set to point to your site</li>";
echo "<li>Verify that PHP is properly configured with your web server</li>";
echo "<li>If using XAMPP/WAMP, ensure the services are running and the port is not blocked</li>";
echo "<li>Try accessing one of the possible API URLs listed above</li>";
echo "</ol>";
?>