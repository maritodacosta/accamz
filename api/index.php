<?php
// api/index.php
// This is a placeholder for the API root.
// Individual API endpoints will be handled by separate PHP files (e.g., login.php, transactions.php).

require_once 'config.php';

// If someone directly accesses /api/, they get a generic message.
sendJsonResponse(['success' => true, 'message' => 'Lotaria de Amizade ERP API is online.', 'version' => '1.0.0']);
?>