<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$uploadDir = 'uploads/analyzed/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $filename = uniqid() . '.jpg';
    $filepath = $uploadDir . $filename;
    move_uploaded_file($_FILES['image']['tmp_name'], $filepath);
    
    // Simulated AI Analysis
    $colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Brown', 'Gray'];
    $types = ['Top', 'Bottom', 'Dress', 'Jacket', 'Shorts', 'Jeans', 'Shirt'];
    $styles = ['Casual', 'Formal', 'Sporty', 'Trendy', 'Classic', 'Streetwear'];
    
    $result = [
        'success' => true,
        'type' => $types[array_rand($types)],
        'color' => $colors[array_rand($colors)],
        'style' => $styles[array_rand($styles)],
        'image_url' => 'http://192.168.1.240/fitpicker-api/' . $filepath,
        'message' => 'Clothing analyzed successfully'
    ];
    
    echo json_encode($result);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to upload image'
    ]);
}
?>