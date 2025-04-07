<?php
// Script to create the necessary upload directories

// Base path for your project - adjust as needed
$basePath = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']) . '/site_fitness';

// Directories to create
$directories = [
    '/uploads',
    '/uploads/products',
    '/uploads/categories',
    '/uploads/users'
];

echo "<h1>FitZone Upload Directory Setup</h1>";

foreach ($directories as $dir) {
    $fullPath = $basePath . $dir;
    
    if (!file_exists($fullPath)) {
        if (mkdir($fullPath, 0755, true)) {
            echo "<p style='color:green;'>✅ Created directory: $fullPath</p>";
        } else {
            echo "<p style='color:red;'>❌ Failed to create directory: $fullPath</p>";
            echo "<p>Make sure your web server has write permissions to $basePath</p>";
        }
    } else {
        echo "<p style='color:blue;'>ℹ️ Directory already exists: $fullPath</p>";
        
        // Check permissions
        if (is_writable($fullPath)) {
            echo "<p style='color:green;'>✅ Directory is writable</p>";
        } else {
            echo "<p style='color:red;'>❌ Directory is not writable! Please set permissions to allow the web server to write to this directory.</p>";
        }
    }
}

// Create test file to verify permissions
$testFile = $basePath . '/uploads/test.txt';
$content = "This is a test file created on " . date('Y-m-d H:i:s');

if (file_put_contents($testFile, $content)) {
    echo "<p style='color:green;'>✅ Successfully wrote test file to verify permissions</p>";
    
    // Display the URL to access the test file
    $testFileUrl = 'http://localhost/site_fitness/uploads/test.txt';
    echo "<p>Test file URL: <a href='$testFileUrl' target='_blank'>$testFileUrl</a></p>";
    
    // Clean up test file
    unlink($testFile);
} else {
    echo "<p style='color:red;'>❌ Failed to write test file. Please check directory permissions.</p>";
}

echo "<h2>Next Steps</h2>";
echo "<ol>";
echo "<li>Make sure your Apache server has the document root correct in httpd.conf.</li>";
echo "<li>Check that your 'site_fitness' folder is located directly under your web server's document root.</li>";
echo "<li>Verify that your actual folder path matches what's in your PHP configuration.</li>";
echo "</ol>";

// Display php.ini and server configuration
echo "<h2>Server Information</h2>";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Script Filename:</strong> " . $_SERVER['SCRIPT_FILENAME'] . "</p>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
?>
