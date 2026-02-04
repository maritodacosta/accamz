<?php
// api/accounts.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);

// Extract ID (account code) from URL for PUT requests
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$code = end($parts);
if ($code === 'accounts') { // If no code is provided in URL
    $code = null;
}

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT code, name_id, name_en, name_tet, type, balance_type, created_at, updated_at FROM accounts ORDER BY code ASC");
        $accounts = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $accounts]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'POST') {
    authorizeAdmin($pdo);

    $code = $input['code'] ?? '';
    $name_id = $input['name_id'] ?? '';
    $name_en = $input['name_en'] ?? '';
    $name_tet = $input['name_tet'] ?? '';
    $type = $input['type'] ?? '';
    $balance_type = $input['balance_type'] ?? '';

    if (empty($code) || empty($name_id) || empty($name_en) || empty($name_tet) || empty($type) || empty($balance_type)) {
        sendJsonResponse(['success' => false, 'message' => 'All account fields are required.'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO accounts (code, name_id, name_en, name_tet, type, balance_type) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$code, $name_id, $name_en, $name_tet, $type, $balance_type]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'ACCOUNT_MANAGEMENT', "Account '{$code} - {$name_id}' created.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Account created successfully.', 'data' => ['code' => $code, 'name_id' => $name_id, 'name_en' => $name_en, 'name_tet' => $name_tet, 'type' => $type, 'balance_type' => $balance_type]]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Failed to create account.'], 500);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error
            sendJsonResponse(['success' => false, 'message' => 'Account code already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    authorizeAdmin($pdo);

    if (empty($code)) {
        sendJsonResponse(['success' => false, 'message' => 'Account code is required for update.'], 400);
    }

    $name_id = $input['name_id'] ?? null;
    $name_en = $input['name_en'] ?? null;
    $name_tet = $input['name_tet'] ?? null;
    $type = $input['type'] ?? null;
    $balance_type = $input['balance_type'] ?? null;

    if ($name_id === null && $name_en === null && $name_tet === null && $type === null && $balance_type === null) {
        sendJsonResponse(['success' => false, 'message' => 'No data provided for update.'], 400);
    }

    $setParts = [];
    $executeParams = [];
    if ($name_id !== null) { $setParts[] = 'name_id = ?'; $executeParams[] = $name_id; }
    if ($name_en !== null) { $setParts[] = 'name_en = ?'; $executeParams[] = $name_en; }
    if ($name_tet !== null) { $setParts[] = 'name_tet = ?'; $executeParams[] = $name_tet; }
    if ($type !== null) { $setParts[] = 'type = ?'; $executeParams[] = $type; }
    if ($balance_type !== null) { $setParts[] = 'balance_type = ?'; $executeParams[] = $balance_type; }
    $setParts[] = 'updated_at = CURRENT_TIMESTAMP';
    $executeParams[] = $code;

    try {
        $stmt = $pdo->prepare("UPDATE accounts SET " . implode(', ', $setParts) . " WHERE code = ?");
        $stmt->execute($executeParams);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'ACCOUNT_MANAGEMENT', "Account '{$code}' updated.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Account updated successfully.']);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Account not found or no changes made.'], 404);
        }
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>