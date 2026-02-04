<?php
// api/transactions.php
require_once 'config.php';

$loggedInUserId = authenticateRequest($pdo);

// Extract ID from URL for PUT requests
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', $path);
$id = end($parts);
if ($id === 'transactions') { // If no ID is provided in URL
    $id = null;
}

if ($requestMethod === 'GET') {
    try {
        $stmt = $pdo->query("SELECT t.id, t.date, t.description, t.reference_number, t.branch_name, t.user_id, t.status, t.type, t.approved_by_user_id, t.is_hq_entry, t.created_at, t.updated_at FROM transactions t ORDER BY t.created_at DESC");
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch ledger entries for each transaction
        foreach ($transactions as &$transaction) {
            $stmtEntries = $pdo->prepare("SELECT id, account_code, debit, credit FROM ledger_entries WHERE transaction_id = ?");
            $stmtEntries->execute([$transaction['id']]);
            $transaction['entries'] = $stmtEntries->fetchAll(PDO::FETCH_ASSOC);
        }
        sendJsonResponse(['success' => true, 'data' => $transactions]);
    } catch (PDOException $e) {
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'POST') {
    $pdo->beginTransaction();
    try {
        $transactionId = $input['id'] ?? 'TRX-' . uniqid();
        $date = $input['date'] ?? date('Y-m-d');
        $description = $input['description'] ?? '';
        $referenceNumber = $input['reference_number'] ?? null;
        $branchName = $input['branch_name'] ?? '';
        $userId = $input['user_id'] ?? $loggedInUserId; // Use provided or logged in user ID
        $status = $input['status'] ?? 'PENDING';
        $type = $input['type'] ?? 'GENERAL';
        $approvedByUserId = $input['approved_by_user_id'] ?? null;
        $isHqEntry = $input['is_hq_entry'] ?? false;
        $entries = $input['entries'] ?? [];

        if (empty($description) || empty($branchName) || empty($userId) || empty($entries)) {
            sendJsonResponse(['success' => false, 'message' => 'Transaction description, branch, user, and entries are required.'], 400);
        }

        // Insert into transactions table
        $stmt = $pdo->prepare("INSERT INTO transactions (id, date, description, reference_number, branch_name, user_id, status, type, approved_by_user_id, is_hq_entry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$transactionId, $date, $description, $referenceNumber, $branchName, $userId, $status, $type, $approvedByUserId, $isHqEntry]);

        // Insert into ledger_entries table
        foreach ($entries as $entry) {
            $stmtEntry = $pdo->prepare("INSERT INTO ledger_entries (transaction_id, account_code, debit, credit) VALUES (?, ?, ?, ?)");
            $stmtEntry->execute([$transactionId, $entry['account_code'], $entry['debit'], $entry['credit']]);
        }

        $pdo->commit();

        logAudit($pdo, 'CREATED', "Transaction '{$transactionId}' created with status '{$status}'.", $transactionId, $loggedInUserId);
        
        // Fetch the newly created transaction to return it with full data
        $stmt = $pdo->prepare("SELECT id, date, description, reference_number, branch_name, user_id, status, type, approved_by_user_id, is_hq_entry, created_at, updated_at FROM transactions WHERE id = ?");
        $stmt->execute([$transactionId]);
        $newTransaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmtEntries = $pdo->prepare("SELECT id, account_code, debit, credit FROM ledger_entries WHERE transaction_id = ?");
        $stmtEntries->execute([$transactionId]);
        $newTransaction['entries'] = $stmtEntries->fetchAll(PDO::FETCH_ASSOC);

        sendJsonResponse(['success' => true, 'message' => 'Transaction created successfully.', 'data' => $newTransaction]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($requestMethod === 'PUT') {
    if (empty($id)) {
        sendJsonResponse(['success' => false, 'message' => 'Transaction ID is required for update.'], 400);
    }

    $pdo->beginTransaction();
    try {
        $description = $input['description'] ?? null;
        $status = $input['status'] ?? null;
        $approvedByUserId = $input['approved_by_user_id'] ?? null;
        $auditAction = $input['auditAction'] ?? 'UPDATED';
        $auditDetails = $input['auditDetails'] ?? "Transaction '{$id}' updated.";
        $entries = $input['entries'] ?? null; // For updating ledger entries

        $setParts = [];
        $executeParams = [];

        if ($description !== null) { $setParts[] = 'description = ?'; $executeParams[] = $description; }
        if ($status !== null) { $setParts[] = 'status = ?'; $executeParams[] = $status; }
        if ($approvedByUserId !== null) { $setParts[] = 'approved_by_user_id = ?'; $executeParams[] = $approvedByUserId; }
        $setParts[] = 'updated_at = CURRENT_TIMESTAMP';
        $executeParams[] = $id;

        if (!empty($setParts)) {
            $stmt = $pdo->prepare("UPDATE transactions SET " . implode(', ', $setParts) . " WHERE id = ?");
            $stmt->execute($executeParams);
        }

        // If entries are provided, delete old and insert new ones
        if ($entries !== null) {
            $stmtDeleteEntries = $pdo->prepare("DELETE FROM ledger_entries WHERE transaction_id = ?");
            $stmtDeleteEntries->execute([$id]);

            foreach ($entries as $entry) {
                $stmtInsertEntry = $pdo->prepare("INSERT INTO ledger_entries (transaction_id, account_code, debit, credit) VALUES (?, ?, ?, ?)");
                $stmtInsertEntry->execute([$id, $entry['account_code'], $entry['debit'], $entry['credit']]);
            }
        }

        $pdo->commit();

        logAudit($pdo, $auditAction, $auditDetails, $id, $loggedInUserId);
        
        // Fetch the updated transaction to return it with full data
        $stmt = $pdo->prepare("SELECT id, date, description, reference_number, branch_name, user_id, status, type, approved_by_user_id, is_hq_entry, created_at, updated_at FROM transactions WHERE id = ?");
        $stmt->execute([$id]);
        $updatedTransaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmtEntries = $pdo->prepare("SELECT id, account_code, debit, credit FROM ledger_entries WHERE transaction_id = ?");
        $stmtEntries->execute([$id]);
        $updatedTransaction['entries'] = $stmtEntries->fetchAll(PDO::FETCH_ASSOC);

        sendJsonResponse(['success' => true, 'message' => 'Transaction updated successfully.', 'data' => $updatedTransaction]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
}
?>