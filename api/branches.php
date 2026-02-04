<?php
// api/branches.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);

// Extract ID from URL for PUT/DELETE requests
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$id = end($parts);
if ($id === 'branches') { // If no ID is provided in URL
    $id = null;
}

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, name, location, code, created_at, updated_at FROM branches");
        $branches = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $branches]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'POST') {
    authorizeAdmin($pdo);

    $name = $input['name'] ?? '';
    $location = $input['location'] ?? '';
    $code = $input['code'] ?? '';
    $newId = $input['id'] ?? 'BR-' . uniqid(); // Allow frontend to suggest ID or generate

    if (empty($name) || empty($location) || empty($code)) {
        sendJsonResponse(['success' => false, 'message' => 'Name, location, and code are required.'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO branches (id, name, location, code) VALUES (?, ?, ?, ?)");
        $stmt->execute([$newId, $name, $location, $code]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'BRANCH_MANAGEMENT', "Branch '{$name}' (Code: {$code}) created.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Branch created successfully.', 'data' => ['id' => $newId, 'name' => $name, 'location' => $location, 'code' => $code]]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Failed to create branch.'], 500);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error
            sendJsonResponse(['success' => false, 'message' => 'Branch name or code already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    authorizeAdmin($pdo);

    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'Branch ID is required for update.'], 400);
    }

    $name = $input['name'] ?? null;
    $location = $input['location'] ?? null;
    $code = $input['code'] ?? null;

    if ($name === null && $location === null && $code === null) {
        sendJsonResponse(['success' => false, 'message' => 'No data provided for update.'], 400);
    }

    $setParts = [];
    $executeParams = [];
    if ($name !== null) { $setParts[] = 'name = ?'; $executeParams[] = $name; }
    if ($location !== null) { $setParts[] = 'location = ?'; $executeParams[] = $location; }
    if ($code !== null) { $setParts[] = 'code = ?'; $executeParams[] = $code; }
    $setParts[] = 'updated_at = CURRENT_TIMESTAMP';
    $executeParams[] = $id;

    try {
        $stmt = $pdo->prepare("UPDATE branches SET " . implode(', ', $setParts) . " WHERE id = ?");
        $stmt->execute($executeParams);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'BRANCH_MANAGEMENT', "Branch ID '{$id}' updated.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Branch updated successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Branch not found or no changes made.'], 404);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error
            sendJsonResponse(['success' => false, 'message' => 'Branch name or code already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'DELETE') {
    authorizeAdmin($pdo);

    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'Branch ID is required for delete.'], 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'BRANCH_MANAGEMENT', "Branch ID '{$id}' deleted.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Branch deleted successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Branch not found.'], 404);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Foreign key constraint
            sendJsonResponse(['success' => false, 'message' => 'Cannot delete branch because it is linked to existing users or transactions.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>