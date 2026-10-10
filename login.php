<?php
// ===== I-ENABLE ANG ERROR REPORTING (PANANDALIAN) =====
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===== HEADERS =====
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ===== HANDLE OPTIONS REQUEST =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// ===== GET INPUT DATA =====
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// ===== DEBUG: I-LOG ANG INPUT =====
error_log('Raw input: ' . $rawInput);
error_log('Decoded data: ' . print_r($data, true));

// ===== VALIDATE INPUT =====
if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input',
        'debug_raw' => $rawInput
    ]);
    exit;
}

$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (empty($username) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Username and password are required!',
        'debug_username' => $username,
        'debug_password_length' => strlen($password)
    ]);
    exit;
}

try {
    // ===== HANAPIN ANG USER =====
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password!',
            'debug' => 'User not found'
        ]);
        exit;
    }
    
    // ===== I-VERIFY ANG PASSWORD =====
    if (password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user' => [
                'id' => $user['id'],
                'fullName' => $user['full_name'] ?? '',
                'username' => $user['username'],
                'email' => $user['email'] ?? ''
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password!',
            'debug' => 'Password mismatch'
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Login failed: ' . $e->getMessage(),
        'debug' => 'PDO Exception'
    ]);
}
?>