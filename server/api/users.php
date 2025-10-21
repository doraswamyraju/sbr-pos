<?php
// C:\\xampp\\htdocs\\pos-system\\server\\api\\users.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db_connect.php'; // Ensure this file correctly establishes a MySQLi connection

// Function to send a JSON response and exit
function apiResponse($status, $message, $data = []) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data]);
    exit();
}

// Ensure $conn exists
if (!isset($conn)) {
    apiResponse('error', 'Database connection not available');
}

// Check if the is_active column exists and add it if not
$result = $conn->query("SHOW COLUMNS FROM `users` LIKE 'is_active'");
if ($result && $result->num_rows == 0) {
    $conn->query("ALTER TABLE `users` ADD `is_active` TINYINT(1) NOT NULL DEFAULT 1");
}

// Allowed printer type values
$ALLOWED_PRINTER_TYPES = ['auto', 'thermal-3in', 'regular-a4'];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Return list of users (include printer_type)
        $sql = "SELECT id, username, role, full_name, is_active, IFNULL(printer_type, 'auto') AS printer_type FROM users";
        $result = $conn->query($sql);
        $users = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
        }
        apiResponse('success', 'Users fetched successfully', $users);
        break;

    case 'POST':
        // Create new user; accept optional printer_type
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            apiResponse('error', 'Invalid JSON payload');
        }

        $username = $data['username'] ?? '';
        $password_raw = $data['password'] ?? '';
        $password = password_hash($password_raw, PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'store_incharge';
        $full_name = $data['full_name'] ?? '';
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        $printer_type = isset($data['printer_type']) ? trim($data['printer_type']) : 'auto';

        // Validate printer_type
        if ($printer_type === '' || !in_array($printer_type, $ALLOWED_PRINTER_TYPES, true)) {
            $printer_type = 'auto';
        }

        // Basic validation
        if (empty($username) || empty($password_raw)) {
            apiResponse('error', 'Username and password are required');
        }

        // Insert with printer_type
        $stmt = $conn->prepare("INSERT INTO users (username, password, role, full_name, is_active, printer_type) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            apiResponse('error', 'Prepare failed: ' . $conn->error);
        }
        $stmt->bind_param("ssssds", $username, $password, $role, $full_name, $is_active, $printer_type);

        if ($stmt->execute()) {
            $newId = $stmt->insert_id;
            // Return newly created user (id + provided fields)
            $created = [
                'id' => $newId,
                'username' => $username,
                'role' => $role,
                'full_name' => $full_name,
                'is_active' => $is_active,
                'printer_type' => $printer_type
            ];
            apiResponse('success', 'User added successfully', $created);
        } else {
            apiResponse('error', 'Error adding user: ' . $stmt->error);
        }
        $stmt->close();
        break;

    case 'PUT':
        // Update user by id (only update fields provided)
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            apiResponse('error', 'Invalid JSON payload');
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            apiResponse('error', 'User ID is required for update.');
        }

        // Build dynamic SET clause
        $set_clause = [];
        $params = [];
        $types = "";

        if (isset($data['username'])) {
            $set_clause[] = "username = ?";
            $params[] = $data['username'];
            $types .= "s";
        }
        if (isset($data['full_name'])) {
            $set_clause[] = "full_name = ?";
            $params[] = $data['full_name'];
            $types .= "s";
        }
        if (isset($data['role'])) {
            $set_clause[] = "role = ?";
            $params[] = $data['role'];
            $types .= "s";
        }
        if (isset($data['is_active'])) {
            $set_clause[] = "is_active = ?";
            $params[] = (int)$data['is_active'];
            $types .= "i";
        }
        if (isset($data['printer_type'])) {
            $pt = trim($data['printer_type']);
            if (!in_array($pt, $ALLOWED_PRINTER_TYPES, true)) {
                apiResponse('error', 'Invalid printer_type. Allowed: ' . implode(', ', $ALLOWED_PRINTER_TYPES));
            }
            $set_clause[] = "printer_type = ?";
            $params[] = $pt;
            $types .= "s";
        }

        if (isset($data['password']) && $data['password'] !== '') {
            // Update password if provided (non-empty)
            $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
            $set_clause[] = "password = ?";
            $params[] = $hashed;
            $types .= "s";
        }

        if (empty($set_clause)) {
            apiResponse('error', 'No data provided to update.');
        }

        $sql = "UPDATE users SET " . implode(", ", $set_clause) . " WHERE id = ?";
        $params[] = (int)$id;
        $types .= "i";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            apiResponse('error', 'Prepare failed: ' . $conn->error);
        }

        // Bind params dynamically
        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_name = 'bind' . $i;
            $$bind_name = $params[$i];
            $bind_names[] = &$$bind_name;
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);

        if ($stmt->execute()) {
            // Return updated user (include printer_type)
            $sel = $conn->prepare("SELECT id, username, role, full_name, is_active, IFNULL(printer_type, 'auto') AS printer_type FROM users WHERE id = ? LIMIT 1");
            if ($sel) {
                $sel->bind_param("i", $id);
                $sel->execute();
                $res = $sel->get_result();
                $updatedUser = $res->fetch_assoc();
                $sel->close();
                apiResponse('success', 'User updated successfully', $updatedUser);
            } else {
                apiResponse('success', 'User updated successfully');
            }
        } else {
            apiResponse('error', 'Error updating user: ' . $stmt->error);
        }
        $stmt->close();
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            apiResponse('error', 'User ID is required for deletion.');
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        if (!$stmt) {
            apiResponse('error', 'Prepare failed: ' . $conn->error);
        }
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            apiResponse('success', 'User deleted successfully');
        } else {
            apiResponse('error', 'Error deleting user: ' . $stmt->error);
        }
        $stmt->close();
        break;

    default:
        apiResponse('error', 'Unsupported request method.');
        break;
}

$conn->close();
?>