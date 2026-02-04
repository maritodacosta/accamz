<?php
// api/login.php
require_once 'config.php';

if ($requestMethod !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    sendJsonResponse(['success' => false, 'message' => 'Username and password are required.'], 400);
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password_hash, name, role, branch_name FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Login successful
        $userId = $user['id'];
        $role = $user['role'];
        $branchName = $user['branch_name'];

        // Generate token
        $token = generateJwtToken($userId, $role, $branchName);

        // Remove password_hash before sending user data to frontend
        unset($user['password_hash']);
        
        // Log successful login
        logAudit($pdo, 'LOGIN', "User {$username} logged in successfully.", null, $userId);

        sendJsonResponse([
            'success' => true,
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token
        ]);
    } else {
        // Login failed
        logAudit($pdo, 'LOGIN', "Failed login attempt for username: {$username}.", null, null);
        sendJsonResponse(['success' => false, 'message' => 'Invalid username or password.'], 401);
    }
} catch (PDOException $e) {
    sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
}
?>