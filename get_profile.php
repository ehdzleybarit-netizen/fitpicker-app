<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$host = 'localhost';
$dbname = 'fitpicker_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]));
}

$username = $_GET['username'] ?? '';

if (empty($username)) {
    echo json_encode(['success' => false, 'message' => 'Username is required!']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'data' => [
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'age' => $user['age'] ?? '18-24',
                'skin_tone' => $user['skin_tone'] ?? 'Medium',
                'body_shape' => $user['body_shape'] ?? 'Slim',
                'preferred_style' => $user['preferred_style'] ?? 'Casual',
                'favorite_colors' => $user['favorite_colors'] ?? '[]'
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found!']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>