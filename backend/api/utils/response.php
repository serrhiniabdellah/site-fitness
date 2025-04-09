<?php
// Include CORS handler at the very top
require_once __DIR__ . '/../cors-handler.php';


/**
 * Helper functions for API responses
 */

/**
 * Send a success response with data
 * @param array $data The response data
 * @param int $statusCode The HTTP status code
 */
function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Send an error response
 * @param string $message The error message
 * @param int $statusCode The HTTP status code
 */
function sendErrorResponse($message, $statusCode = 400) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}
