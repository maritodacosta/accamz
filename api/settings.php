<?php
// api/settings.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);

// Extract ID from URL for PUT request
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$keyName = end($parts); // The last part should be the key_name for PUT

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT key_name, value FROM settings");
        $settings = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $settings]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    authorizeAdmin($pdo); // Only admins can update settings

    if (empty($keyName) || $keyName === 'settings') { // Ensure key_name is provided in URL
        sendJsonResponse(['success' => false, 'message' => 'Setting key name required for update.'], 400);
    }

    $value = $input['value'] ?? null;

    if ($value === null) {
        sendJsonResponse(['success' => false, 'message' => 'Value is required for update.'], 400);
    }

    try {
        $stmt = $pdo->prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?");
        $stmt->execute([$value, $keyName]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'SETTINGS_UPDATED', "Setting '{$keyName}' updated to '{$value}'.");
            sendJsonResponse(['success' => true, 'message' => 'Setting updated successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Setting not found or no changes made.'], 404);
        }
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>