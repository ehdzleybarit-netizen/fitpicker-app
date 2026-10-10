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
$image = $data['image'] ?? '';
$type = $data['type'] ?? 'Top';
$color = $data['color'] ?? '';
$style = $data['style'] ?? 'Casual';
$date = $data['date'] ?? date('Y-m-d');

if (empty($username) || empty($image)) {
    echo json_encode(['success' => false, 'message' => 'Username and image are required!']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO clothing_items (username, image, type, color, style, date_added) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$username, $image, $type, $color, $style, $date]);
    
    echo json_encode(['success' => true, 'message' => 'Clothing item saved successfully!']);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>