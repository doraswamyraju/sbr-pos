<?php
// server/cors.php
// Centralized CORS and Preflight handler for all API endpoints

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost',
    'http://127.0.0.1',
    'https://pos.sribalajirenewables.com',
    'http://pos.sribalajirenewables.com',
    'https://sribalajirenewables.com',
    'http://sribalajirenewables.com',
    'https://pos.sriddha.com',
    'http://pos.sriddha.com',
    'https://sriddha.com',
    'https://sbr.sriddha.com',
    'https://sbrpos.rajugariventures.com',
    'https://rajugariventures.com'
];

if (!empty($origin)) {
    if (in_array($origin, $allowed_origins) ||
        preg_match('/^https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:sribalajirenewables\.com|sriddha\.com|rajugariventures\.com)(?::\d+)?$/i', $origin) ||
        preg_match('/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i', $origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        header("Access-Control-Allow-Origin: {$origin}");
    }
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Origin, Accept");
header("Access-Control-Max-Age: 86400");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
