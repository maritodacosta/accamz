<?php
// api/inventory.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);

// Extract ID from URL for PUT/DELETE requests
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$id = end($parts);
if ($id === 'inventory') { // If no ID is provided in URL
    $id = null;
}

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, code, category, reference_number, stock_in, stock_out, branch_name, created_at, updated_at FROM inventory_items ORDER BY created_at DESC");
        $items = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $items]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'POST') {
    $code = $input['code'] ?? '';
    $category = $input['category'] ?? '';
    $referenceNumber = $input['reference_number'] ?? null;
    $stockIn = $input['stock_in'] ?? 0;
    $stockOut = $input['stock_out'] ?? 0;
    $branchName = $input['branch_name'] ?? '';
    $newId = $input['id'] ?? 'INV-' . uniqid();

    if (empty($code) || empty($category) || empty($branchName)) {
        sendJsonResponse(['success' => false, 'message' => 'Code, category, and branch name are required.'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO inventory_items (id, code, category, reference_number, stock_in, stock_out, branch_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$newId, $code, $category, $referenceNumber, $stockIn, $stockOut, $branchName]);

        if ($stmt->rowCount() > 0) {
            logAudit($pdo, 'INVENTORY_MUTATION', "Inventory item '{$code}' created. In: {$stockIn}, Out: {$stockOut}.", null, $loggedInUserId);
            sendJsonResponse(['success' => true, 'message' => 'Inventory item created successfully.', 'data' => ['id' => $newId, 'code' => $code, 'category' => $category, 'reference_number' => $referenceNumber, 'stock_in' => $stockIn, 'stock_out' => $stockOut, 'branch_name' => $branchName]]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Failed to create inventory item.'], 500);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry error
            sendJsonResponse(['success' => false, 'message' => 'Inventory item code already exists.'], 409);
        }
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'Inventory item ID is required for update.'], 400);
    }

    $code = $input['code'] ?? null;
    $category = $input['category'] ?? null;
    $referenceNumber = $input['reference_number'] ?? null;
    $stockIn = $input['stock_in'] ?? null;
    $stockOut = $input['stock_out'] ?? null;
    $branchName = $input['branch_name'] ?? null;

    if ($code === null && $category === null && $referenceNumber === null && $stockIn === null && $stockOut === null && $branchName === null) {
        sendJsonResponse(['success' => false, 'message' => 'No data provided for update.'], 400);
    }

    $setParts = [];
    $executeParams