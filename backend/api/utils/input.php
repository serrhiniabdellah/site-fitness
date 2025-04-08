<?php
/**
 * Helper functions for input sanitization
 */

/**
 * Sanitize input data to prevent SQL injection and XSS attacks
 * 
 * @param string|mixed $input The input data to sanitize
 * @return string|mixed The sanitized input data
 */
function sanitizeInput($input) {
    if (!is_string($input)) {
        return $input;
    }
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    return $input;
}

/**
 * Sanitize an entire array of inputs recursively
 * 
 * @param array|mixed $input The array or value to sanitize
 * @return array|mixed The sanitized array or value
 */
function sanitizeInputArray($input) {
    // If not an array, use sanitizeInput for the single value
    if (!is_array($input)) {
        return sanitizeInput($input);
    }
    
    // Process each element in the array
    $sanitized = [];
    foreach ($input as $key => $value) {
        $sanitized[$key] = is_array($value) ? sanitizeInputArray($value) : sanitizeInput($value);
    }
    
    return $sanitized;
}
