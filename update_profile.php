<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
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

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';
$age = $data['age'] ?? '18-24';
$skinTone = $data['skinTone'] ?? 'Medium';
$bodyShape = $data['bodyShape'] ?? 'Slim';
$preferredStyle = $data['preferredStyle'] ?? 'Casual';
$favoriteColors = $data['favoriteColors'] ?? '[]';

if (empty($username)) {
    echo json_encode(['success' => false, 'message' => 'Username is required!']);
    exit;
}

try {
    $sql = "UPDATE users SET 
        full_name = ?, 
        email = ?, 
        age = ?, 
        skin_tone = ?, 
        body_shape = ?, 
        preferred_style = ?, 
        favorite_colors = ? 
        WHERE username = ?";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$fullName, $email, $age, $skinTone, $bodyShape, $preferredStyle, $favoriteColors, $username]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile!']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>