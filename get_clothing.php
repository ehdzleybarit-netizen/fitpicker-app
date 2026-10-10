<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'fitpicker_db';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$username = isset($_GET['username']) ? $_GET['username'] : 'admin';
$username = mysqli_real_escape_string($conn, $username);

$sql = "SELECT * FROM clothing_items WHERE username = '$username' ORDER BY id DESC";
$result = $conn->query($sql);

$items = [];
while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

echo json_encode(['success' => true, 'data' => $items]);
$conn->close();
?>