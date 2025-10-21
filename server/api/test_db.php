<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Test database connection
try {
    require '../db_connect.php';
    echo json_encode(["message" => "Database connection successful."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}

// Test JSON decoding
$json_data = '{"test": "data"}';
$decoded_data = json_decode($json_data, true);
if ($decoded_data === null) {
    http_response_code(500);
    echo json_encode(["error" => "JSON decoding failed."]);
} else {
    echo json_encode(["message" => "JSON decoding successful."]);
}
?>