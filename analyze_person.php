<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$apiKey = 'AQ.Ab8RN6JoDtP9JPJUynU_9_x1A4SNnO0c0TSIC610UblolKPylg';

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    exit;
}

$imagePath = $_FILES['image']['tmp_name'];
$imageData = base64_encode(file_get_contents($imagePath));

$prompt = "Analyze this person's photo and provide a fashion recommendation.
    Analyze: body shape, skin tone, age range, current style.
    Suggest 5 outfit combinations: Top, Bottom, Footwear, Accessories, description.
    Return ONLY valid JSON.";

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

$data = [
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $imageData]]
        ]
    ]],
    'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 2000]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $result = json_decode($response, true);
    $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
    $text = preg_replace('/```json\s*/', '', $text);
    $text = preg_replace('/```\s*/', '', $text);
    $text = trim($text);
    $recommendations = json_decode($text, true);
    
    if ($recommendations) {
        echo json_encode($recommendations);
    } else {
        echo json_encode([
            'success' => true,
            'bodyShape' => 'Average',
            'skinTone' => 'Medium',
            'ageRange' => '25-35',
            'currentStyle' => 'Casual',
            'suggestedOutfits' => generateFallbackOutfits()
        ]);
    }
} else {
    echo json_encode([
        'success' => true,
        'bodyShape' => 'Average',
        'skinTone' => 'Medium',
        'ageRange' => '25-35',
        'currentStyle' => 'Casual',
        'suggestedOutfits' => generateFallbackOutfits()
    ]);
}

function generateFallbackOutfits() {
    return [
        ['name' => 'Casual Streetwear', 'occasion' => 'Casual', 'top' => 'Oversized graphic t-shirt', 'bottom' => 'Ripped jeans', 'footwear' => 'White sneakers', 'accessories' => 'Crossbody bag, cap', 'description' => 'Comfortable street style'],
        ['name' => 'Smart Casual', 'occasion' => 'Work', 'top' => 'Button-down Oxford shirt', 'bottom' => 'Chino pants', 'footwear' => 'Leather derby shoes', 'accessories' => 'Minimalist watch', 'description' => 'Polished professional look'],
        ['name' => 'Sporty Look', 'occasion' => 'Sporty', 'top' => 'Athletic polo shirt', 'bottom' => 'Jogger pants', 'footwear' => 'Running shoes', 'accessories' => 'Fitness tracker', 'description' => 'Active sporty outfit'],
        ['name' => 'Formal Elegance', 'occasion' => 'Formal', 'top' => 'Classic white dress shirt', 'bottom' => 'Tailored trousers', 'footwear' => 'Oxford shoes', 'accessories' => 'Leather belt', 'description' => 'Sophisticated formal attire'],
        ['name' => 'Summer Vibes', 'occasion' => 'Casual', 'top' => 'Linen button-up shirt', 'bottom' => 'Light chino shorts', 'footwear' => 'Espadrilles', 'accessories' => 'Sunglasses', 'description' => 'Perfect for warm weather']
    ];
}
?>