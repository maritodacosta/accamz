<?php
// api/audit.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);
authorizeAdmin($pdo); // Only admins can view audit logs

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, action, user_id, user_name, timestamp, details, transaction_id FROM audit_logs ORDER BY timestamp DESC");
        $logs = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $logs]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>