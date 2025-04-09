<?php
/**
 * CORS Handler Auto-Injector
 * 
 * This script automatically adds the cors-handler.php include to all PHP files in the API directory
 * that don't already have it, fixing CORS issues across the entire application.
 * 
 * Usage: php add_cors_handler.php
 */

// Base directory for API files
$baseDir = __DIR__ . '/../api';
$corsHandlerRelativePath = '/../cors-handler.php';

// Count statistics
$stats = [
    'total' => 0,
    'updated' => 0,
    'already_had_handler' => 0,
    'skipped' => 0
];

// Function to recursively scan directory and process PHP files
function processDirectory($dir, $corsHandlerPath, &$stats) {
    $files = scandir($dir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path)) {
            processDirectory($path, $corsHandlerPath, $stats);
        } else if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
            $stats['total']++;
            processPHPFile($path, $corsHandlerPath, $stats);
        }
    }
}

// Process individual PHP file
function processPHPFile($filePath, $corsHandlerPath, &$stats) {
    // Skip cors-handler.php itself
    if (basename($filePath) === 'cors-handler.php') {
        $stats['skipped']++;
        return;
    }
    
    $content = file_get_contents($filePath);
    
    // Calculate the relative path from the file to cors-handler.php
    $fileDir = dirname($filePath);
    $relativePath = str_replace($fileDir, '__DIR__', $corsHandlerPath);
    $includeStatement = "require_once {$relativePath};";
    
    // Check if file already has the cors handler
    if (strpos($content, 'cors-handler.php') !== false) {
        $stats['already_had_handler']++;
        echo "SKIPPED (already has handler): " . basename($filePath) . PHP_EOL;
        return;
    }
    
    // Look for the PHP opening tag
    $phpOpenTagPos = strpos($content, '<?php');
    if ($phpOpenTagPos !== false) {
        // Insert the include statement after the PHP opening tag
        $updatedContent = substr($content, 0, $phpOpenTagPos + 5) . PHP_EOL .
                         "// Include CORS handler at the very top" . PHP_EOL .
                         "require_once __DIR__ . '/../cors-handler.php';" . PHP_EOL . PHP_EOL .
                         substr($content, $phpOpenTagPos + 5);
                         
        // Save the updated content
        file_put_contents($filePath, $updatedContent);
        $stats['updated']++;
        echo "UPDATED: " . basename($filePath) . PHP_EOL;
    } else {
        $stats['skipped']++;
        echo "SKIPPED (no PHP tag): " . basename($filePath) . PHP_EOL;
    }
}

// Start processing
echo "Starting CORS Handler injection process..." . PHP_EOL;
processDirectory($baseDir, $corsHandlerRelativePath, $stats);

// Display results
echo PHP_EOL . "Process completed!" . PHP_EOL;
echo "Total files processed: {$stats['total']}" . PHP_EOL;
echo "Files updated: {$stats['updated']}" . PHP_EOL;
echo "Files already with handler: {$stats['already_had_handler']}" . PHP_EOL;
echo "Files skipped: {$stats['skipped']}" . PHP_EOL;
?>