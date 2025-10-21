<?php
// server/api/company_info.php
// Returns JSON row (first) from company_info table. Safe for the React dev origin.
// Backup existing file before replacing.

header('Content-Type: application/json; charset=utf-8');

$allowed_origin = 'https://rajugariventures.com';
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// use existing db_connect if present (common in your project)
$dbConnectPath = __DIR__ . '/../db_connect.php';
if (file_exists($dbConnectPath)) {
    include $dbConnectPath; // should provide $conn (mysqli)
} else {
    // fallback: create a connection with these defaults - edit if needed
    $dbHost = '127.0.0.1';
    $dbUser = 'rajugda1_sbr';
    $dbPass = 'BOHPM6139n@';
    $dbName = 'rajugda1_sbrpos_db';
    $conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'DB connect error']);
        exit;
    }
}

// Ensure mysqli $conn exists
if (!isset($conn) || !($conn instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'DB connection missing']);
    exit;
}

$sql = "SELECT * FROM company_info LIMIT 1";
$res = $conn->query($sql);
if ($res && $row = $res->fetch_assoc()) {
    // normalize a couple of names to make front-end usage easier
    $normalized = [
        'company_name' => $row['company_name'] ?? $row['name'] ?? '',
        'address' => $row['address'] ?? $row['address_line1'] ?? '',
        'address_line2' => $row['address_line2'] ?? '',
        'phone_number' => $row['phone_number'] ?? $row['phone'] ?? '',
        'email' => $row['email'] ?? '',
        'gstin' => $row['gstin'] ?? $row['gst'] ?? '',
        'default_print_format' => $row['default_print_format'] ?? '',
        'logo_path' => $row['logo_path'] ?? null,
        // include raw row for completeness
        'raw' => $row
    ];
    echo json_encode($normalized);
    exit;
}

// no row
echo json_encode(['message' => 'No company info found']);
exit;

?>