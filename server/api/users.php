<?php
$allowed_origins = ['http://localhost:3000', 'https://pos.sriddha.com', 'https://sbrpos.rajugariventures.com', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {

    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db_connect.php';

function apiResponse($status, $message, $data = []) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data]);
    exit();
}

if (!isset($conn)) {
    apiResponse('error', 'Database connection not available');
}

// Auto-migration for is_active, permissions, and printer_type columns
$res1 = $conn->query("SHOW COLUMNS FROM `users` LIKE 'is_active'");
if ($res1 && $res1->num_rows == 0) {
    $conn->query("ALTER TABLE `users` ADD `is_active` TINYINT(1) NOT NULL DEFAULT 1");
}

$res2 = $conn->query("SHOW COLUMNS FROM `users` LIKE 'permissions'");
if ($res2 && $res2->num_rows == 0) {
    $conn->query("ALTER TABLE `users` ADD `permissions` TEXT NULL");
}

$res3 = $conn->query("SHOW COLUMNS FROM `users` LIKE 'printer_type'");
if ($res3 && $res3->num_rows == 0) {
    $conn->query("ALTER TABLE `users` ADD `printer_type` VARCHAR(50) NULL DEFAULT 'auto'");
}


$ALLOWED_PRINTER_TYPES = ['auto', 'thermal-3in', 'regular-a4'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT id, username, role, full_name, is_active, IFNULL(printer_type, 'auto') AS printer_type, permissions FROM users";
        $result = $conn->query($sql);
        $users = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $row['permissions'] = !empty($row['permissions']) ? json_decode($row['permissions'], true) : null;
                $users[] = $row;
            }
        }
        apiResponse('success', 'Users fetched successfully', $users);
        break;

    case 'POST':
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
        $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : json_encode([
            'can_view_purchase_price' => ($role === 'admin'),
            'can_manage_inventory' => true,
            'can_manage_users' => ($role === 'admin'),
            'can_view_reports' => ($role === 'admin')
        ]);

        if (!in_array($printer_type, $ALLOWED_PRINTER_TYPES, true)) {
            $printer_type = 'auto';
        }

        if (empty($username) || empty($password_raw)) {
            apiResponse('error', 'Username and password are required');
        }

        $stmt = $conn->prepare("INSERT INTO users (username, password, role, full_name, is_active, printer_type, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            apiResponse('error', 'Prepare failed: ' . $conn->error);
        }
        $stmt->bind_param("ssssiss", $username, $password, $role, $full_name, $is_active, $printer_type, $permissions);

        if ($stmt->execute()) {
            $newId = $stmt->insert_id;
            $created = [
                'id' => $newId,
                'username' => $username,
                'role' => $role,
                'full_name' => $full_name,
                'is_active' => $is_active,
                'printer_type' => $printer_type,
                'permissions' => json_decode($permissions, true)
            ];
            apiResponse('success', 'User added successfully', $created);
        } else {
            apiResponse('error', 'Error adding user: ' . $stmt->error);
        }
        $stmt->close();
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            apiResponse('error', 'Invalid JSON payload');
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            apiResponse('error', 'User ID is required for update.');
        }

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
            if (in_array($pt, $ALLOWED_PRINTER_TYPES, true)) {
                $set_clause[] = "printer_type = ?";
                $params[] = $pt;
                $types .= "s";
            }
        }
        if (isset($data['permissions'])) {
            $set_clause[] = "permissions = ?";
            $params[] = json_encode($data['permissions']);
            $types .= "s";
        }

        if (isset($data['password']) && $data['password'] !== '') {
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

        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_name = 'bind' . $i;
            $$bind_name = $params[$i];
            $bind_names[] = &$$bind_name;
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);

        if ($stmt->execute()) {
            $sel = $conn->prepare("SELECT id, username, role, full_name, is_active, IFNULL(printer_type, 'auto') AS printer_type, permissions FROM users WHERE id = ? LIMIT 1");
            if ($sel) {
                $sel->bind_param("i", $id);
                $sel->execute();
                $res = $sel->get_result();
                $updatedUser = $res->fetch_assoc();
                if ($updatedUser) {
                    $updatedUser['permissions'] = !empty($updatedUser['permissions']) ? json_decode($updatedUser['permissions'], true) : null;
                }
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

        $userId = (int)$id;

        // Prevent deleting the primary admin account
        $chk = $conn->prepare("SELECT username FROM users WHERE id = ?");
        if ($chk) {
            $chk->bind_param("i", $userId);
            $chk->execute();
            $uRes = $chk->get_result()->fetch_assoc();
            $chk->close();
            if ($uRes && strtolower($uRes['username']) === 'admin') {
                apiResponse('error', 'Cannot delete the primary system administrator account.');
            }
        }

        // Safely unassign foreign key references so deletion succeeds without constraint violations
        @$conn->query("UPDATE `leads` SET `assigned_to_user_id` = NULL WHERE `assigned_to_user_id` = $userId");
        @$conn->query("UPDATE `tasks` SET `assigned_to` = NULL WHERE `assigned_to` = $userId");
        @$conn->query("UPDATE `projects` SET `user_id` = NULL WHERE `user_id` = $userId");
        @$conn->query("UPDATE `sales` SET `user_id` = NULL WHERE `user_id` = $userId");

        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        if (!$stmt) {
            apiResponse('error', 'Prepare failed: ' . $conn->error);
        }
        $stmt->bind_param("i", $userId);

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