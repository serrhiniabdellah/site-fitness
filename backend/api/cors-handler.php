<?php
/**
 * API-specific CORS handler
 * This file is included at the top of all API PHP files
 */

// Include the main CORS handler to ensure consistent behavior
require_once __DIR__ . '/../cors-handler.php';

// Any API-specific CORS handling can go here
// For now, we're using the main handler
?>