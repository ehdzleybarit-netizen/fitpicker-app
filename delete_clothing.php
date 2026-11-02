<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// ===== KUNAIN ANG ID MULA SA POST BODY =====
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$id = isset($data['id']) ? intval($data['id']) : 0;
$username = isset($data['username']) ? trim($data['username']) : '';

// ===== DEBUG LOG =====
error_log('Delete ID: ' . $id);
error_log('Delete Username: ' . $username);

if ($id <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid ID',
        'debug_id' => $id,
        'debug_raw' => $rawInput
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM clothing_items WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $e->getMessage()]);
}
?>