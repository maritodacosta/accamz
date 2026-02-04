<?php
// api/users.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);
authorizeAdmin($pdo); // All user management operations require admin role

// Extract ID from URL for PUT/DELETE requests
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$id = end($parts);
if ($id === 'users') { // If no ID is provided in URL
    $id = null;
}

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, username, name, role, branch_name, avatar, created_at, updated_at FROM users");
        $users = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $users]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'POST') {
    $name = $input['name'] ?? '';
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'USER';
    $branchName = $input['branch_name'] ?? '';
    $newId = $input['id'] ?? 'USR-' . uniqid();

    if (empty($name) || empty($username) || empty($password) || empty($branchName)) {
        sendJsonResponse(['success' => false, 'message' => 'Name, username, password, and branch are required.'], 400);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, branch_name) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$newId, $username, $passwordHash, $name, $role, $branchName]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'USER_MANAGEMENT', "User '{$name}' ({$username}) created.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'User created successfully.', 'data' => ['id' => $newId, 'username' => $username, 'name' => $name, 'role' => $role, 'branch_name' => $branchName]]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Failed to create user.'], 500);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error
            sendJsonResponse(['success' => false, 'message' => 'Username already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'User ID is required for update.'], 400);
    }

    $name = $input['name'] ?? null;
    $username = $input['username'] ?? null;
    $password = $input['password'] ?? null; // Only update if provided
    $role = $input['role'] ?? null;
    $branchName = $input['branch_name'] ?? null;

    if ($name === null && $username === null && $password === null && $role === null && $branchName === null) {
        sendJsonResponse(['success' => false, 'message' => 'No data provided for update.'], 400);
    }

    $setParts = [];
    $executeParams = [];
    if ($name !== null) { $setParts[] = 'name = ?'; $executeParams[] = $name; }
    if ($username !== null) { $setParts[] = 'username = ?'; $executeParams[] = $username; }
    if ($password !== null && !empty($password)) { // Only hash if password is provided
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $setParts[] = 'password_hash = ?'; $executeParams[] = $passwordHash;
    }
    if ($role !== null) { $setParts[] = 'role = ?'; $executeParams[] = $role; }
    if ($branchName !== null) { $setParts[] = 'branch_name = ?'; $executeParams[] = $branchName; }
    $setParts[] = 'updated_at = CURRENT_TIMESTAMP';
    $executeParams[] = $id;

    try {
        $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $setParts) . " WHERE id = ?");
        $stmt->execute($executeParams);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'USER_MANAGEMENT', "User ID '{$id}' updated.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'User updated successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'User not found or no changes made.'], 404);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error for username
            sendJsonResponse(['success' => false, 'message' => 'Username already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'DELETE') {
    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'User ID is required for delete.'], 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'USER_MANAGEMENT', "User ID '{$id}' deleted.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'User deleted successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'User not found.'], 404);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Foreign key constraint
            sendJsonResponse(['success' => false, 'message' => 'Cannot delete user because they are linked to existing transactions or audit logs.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>