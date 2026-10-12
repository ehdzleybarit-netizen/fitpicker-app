<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'fitpicker_db';
$username = 'root';
$password = '';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit;
}

$sql = "DELETE FROM clothing_items WHERE id = $id";
$result = $conn->query($sql);

if ($result && $conn->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Delete failed']);
}

$conn->close();
?>