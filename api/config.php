<?php
// api/config.php
// Konfigurasi koneksi database MySQL
// --- PENTING: GANTI DENGAN DETAIL DATABASE DARI CPANEL HOSTING ANDA ---
define('DB_HOST', 'sql305.byethost13.com');         // Biasanya 'localhost' atau '127.0.0.1'
define('DB_USER', 'b13_41066503');  // Ganti dengan username database MySQL Anda
define('DB_PASSWORD', 'Marito@792715'); // Ganti dengan password database MySQL Anda
define('DB_NAME', 'b13_41066503_accamz'); // Ganti dengan nama database MySQL Anda
// --------------------------------------------------------------------

// Kunci rahasia untuk otentikasi (SANGAT PENTING! GANTI DENGAN STRING YANG SANGAT KUAT DAN PANJANG)
// Ini akan digunakan untuk menandatangani atau memverifikasi token sesi/autentikasi (misal: JWT)
// Pastikan ini adalah string yang acak, panjang, dan sulit ditebak. Contoh: 'SjS3oE_R4tP!qZkYxV8wU7v6T5s4Q3p2O1n0M9L8K7J6I5H4G3F2E1D0C_B_A'
define('SECRET_KEY', '8c6d1e4f9b2a7c5d0f3e8b1a9c4d7e0f2b1a8c6d1e4f9b2a7c5d0f3e8b1a9c4d7e0f'); // Kunci rahasia yang diregenerasi
// Konfigurasi CORS (Cross-Origin Resource Sharing)
// --- PENTING: GANTI '*' DENGAN URL LENGKAP APLIKASI FRONTEND REACT ANDA SAAT PRODUKSI ---
// Ini mencegah masalah keamanan dan memastikan hanya frontend Anda yang bisa mengakses API.
// Contoh: 'https://erp.lotariaamizade.com' atau 'http://www.accamz.byethost13.com'
header("Access-Control-Allow-Origin: http://www.accamz.byethost13.com"); // Ganti dengan domain frontend Anda
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 3600"); // Cache preflight request for 1 hour
header("Content-Type: application/json; charset=UTF-8");

// Tanggapi permintaan OPTIONS secara langsung untuk CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Koneksi ke database
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Mengembalikan hasil sebagai array asosiatif
} catch (PDOException $e) {
    // Jika koneksi gagal, hentikan eksekusi dan kirim error
    http_response_code(500); // Internal Server Error
    error_log("Database connection failed: " . $e->getMessage()); // Catat error ke log server
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Please check server logs for details.']);
    exit();
}

// --- Helper Functions ---

// Fungsi pembantu untuk mengirim respons JSON
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Fungsi untuk mendapatkan input JSON dari request body
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// Fungsi untuk membuat token JWT sederhana (placeholder)
// Di aplikasi produksi yang sesungguhnya, sangat disarankan untuk menggunakan
// library JWT yang matang seperti 'firebase/php-jwt' untuk keamanan yang lebih baik.
function generateJwtToken($userId, $role, $branchName) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'role' => $role,
        'branch_name' => $branchName,
        'exp' => time() + (15 * 60) // Token berlaku 15 menit. Sesuaikan durasi sesuai kebutuhan.
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

// Fungsi untuk mendekode dan memverifikasi token JWT sederhana (placeholder)
function decodeJwtToken($jwt) {
    @list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = explode('.', $jwt);

    if (count(explode('.', $jwt)) !== 3) {
        return false; // Format JWT tidak valid
    }

    $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlSignature));

    $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, SECRET_KEY, true);

    if (!hash_equals($signature, $expectedSignature)) {
        return false; // Tanda tangan tidak cocok (token diubah atau kunci salah)
    }

    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);

    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false; // Payload tidak valid atau token kadaluarsa
    }

    return $payload;
}

// Fungsi untuk mendapatkan user ID dari token yang terautentikasi
function getUserIdFromToken() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = decodeJwtToken($token);
        if ($payload) {
            return $payload['user_id'];
        }
    }
    return null;
}

function getUserRoleFromToken() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = decodeJwtToken($token);
        if ($payload) {
            return $payload['role'];
        }
    }
    return null;
}

function getUserBranchFromToken() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = decodeJwtToken($token);
        if ($payload) {
            return $payload['branch_name'];
        }
    }
    return null;
}

// Fungsi untuk mencatat aktivitas ke audit_logs
function logAudit($pdo, $action, $details = null, $transactionId = null, $userId = null) {
    // Gunakan user ID yang disediakan, atau coba dapatkan dari token jika ada
    $actualUserId = $userId;
    if (!$actualUserId) {
        $actualUserId = getUserIdFromToken();
    }
    
    $userName = 'System'; // Default
    if ($actualUserId) {
        $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $stmt->execute([$actualUserId]);
        $user = $stmt->fetch();
        if ($user) {
            $userName = $user['name'];
        }
    }

    $stmt = $pdo->prepare("INSERT INTO audit_logs (action, user_id, user_name, details, transaction_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$action, $actualUserId, $userName, $details, $transactionId]);
}


// --- Middleware ---

// Middleware untuk otentikasi API
function authenticateRequest($pdo) {
    $userId = getUserIdFromToken();
    if ($userId) {
        // Token valid, set user_id untuk request ini
        return $userId;
    }
    // Token tidak valid atau tidak ada
    sendJsonResponse(['success' => false, 'message' => 'Unauthorized: Invalid or missing token.'], 401);
}

// Middleware untuk otorisasi ADMIN
function authorizeAdmin($pdo) {
    $role = getUserRoleFromToken();
    if ($role === 'ADMIN') {
        return true;
    }
    sendJsonResponse(['success' => false, 'message' => 'Forbidden: Admin access required.'], 403);
}

// --- Request Parsing ---
// Ini akan mengambil metode HTTP dan body JSON untuk setiap request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();