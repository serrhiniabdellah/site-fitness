<?php
// Include CORS handler at the very top
require_once __DIR__ . '/cors-handler.php';

// Simple API index file to verify your API is working
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'FitZone API is working!',
    'endpoints' => [
        'auth' => [
            'login' => '/auth/login.php',
            'register' => '/auth/register.php'
        ],
        'products' => [
            'list' => '/products/index.php',
            'details' => '/products/details.php?id={product_id}'
        ],
        'cart' => [
            'add' => '/cart/add.php',
            'view' => '/cart/index.php',
            'update' => '/cart/update.php',
            'remove' => '/cart/remove.php'
        ]
    ],
    'server_time' => date('Y-m-d H:i:s')
]);
?>
