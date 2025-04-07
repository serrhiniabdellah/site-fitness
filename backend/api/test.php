<?php
require_once '../config.php';
require_once '../utils.php';

// Send a simple response
Utils::sendResponse(true, 'Backend connection successful', ['timestamp' => time()]);
?>
