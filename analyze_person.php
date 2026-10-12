<?php
// Suppress warnings/notices from polluting JSON API responses
error_reporting(0);
ini_set('display_errors', '0');

// Set generous execution time limit for AI diffusion inpainting
set_time_limit(180);
ini_set('max_execution_time', 180);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load environment variables from .env
function loadEnvFile($paths) {
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($key, $val) = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim(trim($val), "\"'");
                    if (!empty($key)) {
                        putenv("$key=$val");
                        $_ENV[$key] = $val;
                        $_SERVER[$key] = $val;
                    }
                }
            }
            break;
        }
    }
}

loadEnvFile([__DIR__ . '/.env', __DIR__ . '/../.env']);
$apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? ''));

if (empty($apiKey)) {
    echo json_encode(['success' => false, 'message' => 'GEMINI_API_KEY is missing from .env']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No image file uploaded']);
    exit;
}

$occasion = isset($_POST['occasion']) && !empty($_POST['occasion']) ? trim($_POST['occasion']) : 'Casual';

$rawImagePath = $_FILES['image']['tmp_name'];
$originalMime = mime_content_type($rawImagePath) ?: 'image/jpeg';

// Save user scan copy in uploads/scans/
if (!is_dir(__DIR__ . '/uploads/scans')) {
    @mkdir(__DIR__ . '/uploads/scans', 0777, true);
}
$savedScanFilename = 'scan_' . time() . '_' . substr(uniqid(), 0, 6) . '.jpg';
$savedScanPath = __DIR__ . '/uploads/scans/' . $savedScanFilename;
@copy($rawImagePath, $savedScanPath);
$originalImageUrl = 'uploads/scans/' . $savedScanFilename;

// ==========================================
// STEP 1: Gemini Human Detection & Styling
// ==========================================
$imageData = base64_encode(file_get_contents($rawImagePath));

$prompt = "You are an expert AI fashion stylist.
Examine this image carefully.

CRITICAL REQUIREMENT:
First, verify whether there is a real human (person) clearly visible in the photo.
- If there is NO clearly visible human in the photo (e.g. only objects, an empty room, pets/animals, landscape, food, or blank space), you MUST return ONLY this JSON:
{
  \"success\": false,
  \"humanDetected\": false,
  \"message\": \"No person detected in the photo. Please take or upload a clear photo of a person.\"
}

- If a human IS detected in the photo:
The user wants an outfit recommendation and garb change for the occasion: \"$occasion\".
1. Analyze the person's visible characteristics: body shape, skin tone, estimated age range, gender presentation (Male / Female / Unisex), and current clothing style.
2. Recommend 3 to 4 stylish outfit combinations specifically designed for the occasion: \"$occasion\", tailored to suit their appearance.
3. For each outfit, provide:
   - name: creative outfit name (e.g. 'Sharp Modern Formal' or 'Effortless Weekend Casual')
   - occasion: \"$occasion\"
   - top: specific top garment recommendation (style, color, cut)
   - bottom: specific bottom garment recommendation (style, color, cut)
   - footwear: matching footwear recommendation
   - accessories: matching accessories
   - description: brief explanation of why this outfit works well for the \"$occasion\" occasion

Return ONLY valid raw JSON with no Markdown backticks matching this schema:
{
  \"success\": true,
  \"humanDetected\": true,
  \"bodyShape\": \"Slim / Athletic / Average / Curvy / etc.\",
  \"skinTone\": \"Fair / Medium / Warm Olive / Deep / etc.\",
  \"ageRange\": \"20-30 / etc.\",
  \"gender\": \"Male / Female / Unisex\",
  \"currentStyle\": \"Casual / Streetwear / etc.\",
  \"occasion\": \"$occasion\",
  \"suggestedOutfits\": [
    {
      \"name\": \"...\",
      \"occasion\": \"$occasion\",
      \"top\": \"...\",
      \"bottom\": \"...\",
      \"footwear\": \"...\",
      \"accessories\": \"...\",
      \"description\": \"...\"
    }
  ]
}";

$modelsToTry = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
$geminiParsed = null;

foreach ($modelsToTry as $modelName) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . $modelName . ":generateContent?key=" . $apiKey;
    
    $payload = [
        'contents' => [[
            'parts' => [
                ['text' => $prompt],
                ['inline_data' => ['mime_type' => $originalMime, 'data' => $imageData]]
            ]
        ]],
        'generationConfig' => [
            'temperature' => 0.4,
            'maxOutputTokens' => 1500,
            'responseMimeType' => 'application/json'
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($httpCode === 200 && $response) {
        $result = json_decode($response, true);
        $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
        
        $text = preg_replace('/```json\s*/i', '', $text);
        $text = preg_replace('/```\s*/i', '', $text);
        $text = trim($text);
        
        $candidate = json_decode($text, true);
        if ($candidate && (isset($candidate['humanDetected']) || isset($candidate['success']))) {
            $geminiParsed = $candidate;
            break;
        }
    }
}

// If Gemini analysis failed, return actual error response
if (!$geminiParsed) {
    echo json_encode([
        'success' => false,
        'message' => 'Gemini AI Vision analysis failed or was rate-limited. Please check your connection and try again.'
    ]);
    exit;
}

// If no human detected, exit immediately without generating tryon
if ($geminiParsed['humanDetected'] === false || (isset($geminiParsed['success']) && $geminiParsed['success'] === false && isset($geminiParsed['message']))) {
    echo json_encode([
        'success' => false,
        'humanDetected' => false,
        'message' => $geminiParsed['message'] ?? 'No person detected in the photo. Please make sure a human is in the frame.'
    ]);
    exit;
}

// ==========================================
// STEP 2: AI Virtual Try-On (Same Person)
// ==========================================
function prepareOptimizedImage($srcPath, $targetWidth = 768, $targetHeight = 1024) {
    if (!extension_loaded('gd')) return $srcPath;
    $info = @getimagesize($srcPath);
    if (!$info) return $srcPath;
    
    $mime = $info['mime'];
    $src = null;
    if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
        $src = @imagecreatefromjpeg($srcPath);
    } elseif ($mime === 'image/png') {
        $src = @imagecreatefrompng($srcPath);
    } elseif ($mime === 'image/webp') {
        $src = @imagecreatefromwebp($srcPath);
    }
    if (!$src) return $srcPath;

    $origW = imagesx($src);
    $origH = imagesy($src);
    $ratio = min($targetWidth / $origW, $targetHeight / $origH);
    $newW = (int)round($origW * $ratio);
    $newH = (int)round($origH * $ratio);

    $dst = imagecreatetruecolor($newW, $newH);
    $white = imagecolorallocate($dst, 255, 255, 255);
    imagefilledrectangle($dst, 0, 0, $newW, $newH, $white);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
    
    $tmpPath = sys_get_temp_dir() . '/vton_opt_' . uniqid() . '.jpg';
    imagejpeg($dst, $tmpPath, 88);
    return $tmpPath;
}

function runVirtualTryon($personPath, $garmentPath, $occasion = 'Casual') {
    $hfToken = getenv('HUGGINGFACE_API_KEY') ?: ($_ENV['HUGGINGFACE_API_KEY'] ?? ($_SERVER['HUGGINGFACE_API_KEY'] ?? ''));
    if (empty($hfToken)) {
        return ['success' => false, 'error' => 'HUGGINGFACE_API_KEY not configured in .env'];
    }

    $optPerson = prepareOptimizedImage($personPath, 768, 1024);
    $authHeader = 'Authorization: Bearer ' . trim($hfToken);

    // 1. Upload Person Image to Hugging Face
    $ch = curl_init("https://yisol-idm-vton.hf.space/upload");
    $c1 = new CURLFile($optPerson, 'image/jpeg', 'person.jpg');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [$authHeader]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['files' => $c1]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $r1 = curl_exec($ch);
    $u1 = json_decode($r1, true)[0] ?? null;
    curl_close($ch);

    // 2. Upload Garment Image to Hugging Face
    $ch = curl_init("https://yisol-idm-vton.hf.space/upload");
    $c2 = new CURLFile($garmentPath, 'image/jpeg', 'garment.jpg');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [$authHeader]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['files' => $c2]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $r2 = curl_exec($ch);
    $u2 = json_decode($r2, true)[0] ?? null;
    curl_close($ch);

    if (!$u1 || !$u2) {
        return ['success' => false, 'error' => 'Hugging Face file upload failed'];
    }

    // 3. Dispatch Live Try-On Job (Gradio 4 FileData structure)
    $callData = [
        'data' => [
            [
                'background' => [
                    'path' => $u1,
                    'meta' => ['_type' => 'gradio.FileData']
                ],
                'layers' => [],
                'composite' => null
            ],
            [
                'path' => $u2,
                'meta' => ['_type' => 'gradio.FileData']
            ],
            strtolower($occasion) . ' clothing',
            true,   // is_checked: auto masking
            false,  // is_checked_crop: auto crop
            30,     // denoise_steps
            42      // seed
        ]
    ];

    $ch = curl_init("https://yisol-idm-vton.hf.space/call/tryon");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        $authHeader,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($callData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $r3 = curl_exec($ch);
    curl_close($ch);
    $eventId = json_decode($r3, true)['event_id'] ?? null;

    if (!$eventId) {
        return ['success' => false, 'error' => 'Hugging Face job dispatch failed'];
    }

    // 4. Stream SSE to retrieve live generated try-on
    $sseUrl = "https://yisol-idm-vton.hf.space/call/tryon/" . $eventId;
    $ch = curl_init($sseUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [$authHeader]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    $resultRemoteUrl = null;
    $buffer = "";

    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) use (&$resultRemoteUrl, &$buffer) {
        $buffer .= $chunk;
        if (strpos($buffer, "event: complete") !== false) {
            if (preg_match('/"url":\s*"([^"]+)"/', $buffer, $matches)) {
                $resultRemoteUrl = $matches[1];
                return 0; // complete URL obtained
            }
        }
        return strlen($chunk);
    });
    curl_exec($ch);
    curl_close($ch);

    if ($resultRemoteUrl) {
        if (!is_dir(__DIR__ . '/generated')) {
            @mkdir(__DIR__ . '/generated', 0777, true);
        }
        $localFilename = 'live_tryon_' . time() . '_' . substr(uniqid(), 0, 6) . '.png';
        $localPath = __DIR__ . '/generated/' . $localFilename;

        // Download with auth header
        $dlCh = curl_init($resultRemoteUrl);
        curl_setopt($dlCh, CURLOPT_HTTPHEADER, [$authHeader]);
        curl_setopt($dlCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($dlCh, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($dlCh, CURLOPT_TIMEOUT, 30);
        $imgData = curl_exec($dlCh);
        curl_close($dlCh);

        if ($imgData && strlen($imgData) > 5000) {
            file_put_contents($localPath, $imgData);
            return [
                'success' => true,
                'imageUrl' => 'generated/' . $localFilename,
                'localPath' => $localPath,
                'remoteUrl' => $resultRemoteUrl
            ];
        }
    }

    return ['success' => false, 'error' => 'Live Try-On timed out or GPU busy'];
}

// Select Garment Template based on Occasion & Gender
$normOccasion = strtolower($occasion);
$gender = strtolower($geminiParsed['gender'] ?? 'unisex');

$garmentFile = 'casual.jpg';
if (strpos($normOccasion, 'formal') !== false) {
    $garmentFile = 'formal.jpg';
} elseif (strpos($normOccasion, 'sport') !== false) {
    $garmentFile = 'sporty.jpg';
} elseif (strpos($normOccasion, 'work') !== false) {
    $garmentFile = 'work.jpg';
} elseif (strpos($normOccasion, 'party') !== false) {
    $garmentFile = ($gender === 'female' && file_exists(__DIR__ . '/garments/party_alt.jpg')) ? 'party_alt.jpg' : 'party.jpg';
} else {
    // Casual
    $garmentFile = ($gender === 'female' && file_exists(__DIR__ . '/garments/casual_alt.jpg')) ? 'casual_alt.jpg' : 'casual.jpg';
}

$garmentFullPath = __DIR__ . '/garments/' . $garmentFile;
if (!file_exists($garmentFullPath)) {
    $garmentFullPath = __DIR__ . '/garments/formal.jpg';
}

// 100% Real Live Virtual Try-On Execution
$vtonResult = runVirtualTryon($savedScanPath, $garmentFullPath, $occasion);

// Prepare Data URLs (base64) so images render with 0 mixed-content and 0 network blocks
$originalBase64 = file_exists($savedScanPath) ? ('data:image/jpeg;base64,' . base64_encode(file_get_contents($savedScanPath))) : null;

$tryonLocalPath = null;
if ($vtonResult['success'] && !empty($vtonResult['localPath']) && file_exists($vtonResult['localPath'])) {
    $tryonLocalPath = $vtonResult['localPath'];
}

$tryonBase64 = null;
if ($tryonLocalPath) {
    $tryonExt = strtolower(pathinfo($tryonLocalPath, PATHINFO_EXTENSION));
    $tryonMime = in_array($tryonExt, ['jpg', 'jpeg']) ? 'image/jpeg' : 'image/png';
    $tryonBase64 = 'data:' . $tryonMime . ';base64,' . base64_encode(file_get_contents($tryonLocalPath));
}

$responsePayload = array_merge($geminiParsed, [
    'success' => true,
    'originalImage' => $originalImageUrl,
    'originalBase64' => $originalBase64,
    'tryonSuccess' => $vtonResult['success'],
    'tryonImage' => $vtonResult['success'] ? $vtonResult['imageUrl'] : null,
    'tryonBase64' => $tryonBase64,
    'tryonRemoteUrl' => $vtonResult['success'] ? $vtonResult['remoteUrl'] : null,
    'garmentUsed' => basename($garmentFullPath),
    'tryonNote' => $vtonResult['success'] 
        ? "AI Virtual Try-On: Live diffusion generated by Hugging Face IDM-VTON" 
        : ("Live Try-On status: " . ($vtonResult['error'] ?? 'Service busy'))
]);

echo json_encode($responsePayload);
?>