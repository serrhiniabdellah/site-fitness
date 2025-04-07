<?php
require_once '../config.php';

// This is a simple endpoint to test API connectivity
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'API connection successful']);
?>
