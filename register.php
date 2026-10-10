<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (empty($fullName) || empty($email) || empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required!']);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $username, $hashedPassword]);
    
    echo json_encode(['success' => true, 'message' => 'Registration successful!']);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
?>