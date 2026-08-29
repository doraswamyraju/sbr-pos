<?php
// server/api/auth.php
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../db_connect.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $json_data = file_get_contents("php://input");
    $data = json_decode($json_data, true);

    if (!is_array($data) || empty($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Username and password are required."]);
        exit;
    }

    $username = trim($data['username']);
    $password = trim($data['password']);

    $stmt = $conn->prepare("SELECT id, username, password, role, full_name, is_active FROM users WHERE username = ? LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();

            if (isset($user['is_active']) && (int)$user['is_active'] === 0) {
                echo json_encode(["success" => false, "message" => "Account is inactive. Contact Administrator."]);
                exit;
            }

            $dbPass = $user['password'];
            $passValid = password_verify($password, $dbPass) || ($password === $dbPass) || (md5($password) === $dbPass);

            if ($passValid) {
                $roleStr = $user['role'] ?? 'store_incharge';
                $cleanRole = strtolower(str_replace([' ', '_', '-'], '', $roleStr));
                $fullName = !empty($user['full_name']) ? $user['full_name'] : $user['username'];

                echo json_encode([
                    "success" => true,
                    "message" => "Login successful.",
                    "user" => [
                        "id" => (string)$user['id'],
                        "username" => $user['username'],
                        "full_name" => $fullName,
                        "name" => $fullName,
                        "role" => $roleStr,
                        "is_admin" => ($cleanRole === 'admin')
                    ]
                ]);
                exit;
            } else {
                echo json_encode(["success" => false, "message" => "Incorrect password."]);
                exit;
            }
        } else {
            echo json_encode(["success" => false, "message" => "User not found."]);
            exit;
        }
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database query failed."]);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
}
?>