<?php
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// C:\xampp\htdocs\pos-system\server\api\auth.php

// Enable detailed PHP error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers to allow cross-origin requests (CORS) from your live domain
header('Content-Type: application/json');
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
}

//header('Access-Control-Allow-Origin: https://rajugariventures.com');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $json_data = file_get_contents("php://input");
        $data = json_decode($json_data, true);

        if ($data === null || !isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid input."]);
            exit;
        }

        $username = $conn->real_escape_string($data['username']);
        $password = $data['password'];

        $sql = "SELECT id, username, password, role, full_name FROM users WHERE username = '$username'";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                echo json_encode(["success" => true, "message" => "Login successful.", "user" => [
                    "id" => $user['id'],
                    "full_name" => $user['full_name'],
                    "role" => $user['role']
                ]]);
            } else {
                echo json_encode(["success" => false, "message" => "Incorrect password."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "User not found."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "An unexpected error occurred: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
}

$conn->close();
?>