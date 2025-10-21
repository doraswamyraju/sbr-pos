<?php
// user_settings.php
// Provides GET (fetch user) and PUT/POST (update user) for the current user or for admins editing other users.
//
// NOTE: This file expects these variables to be available from your auth/bootstrap code:
//   - $mysqli            -> mysqli connection
//   - $logged_user_id    -> id of currently authenticated user
//   - $logged_is_admin   -> boolean / 1 if current user is admin
//
// If your project uses a different bootstrap, ensure that file that includes this sets those variables
// before including/dispatching this endpoint.

header("Content-Type: application/json; charset=UTF-8");

// Basic guard: ensure environment variables exist
if (!isset($mysqli) || !isset($logged_user_id) || !isset($logged_is_admin)) {
    // If these aren't set, we try to include a common bootstrap if present (adjust path if needed)
    if (file_exists(__DIR__ . '/../../config.php')) {
        require_once __DIR__ . '/../../config.php';
    }
}

// After optional include, verify again
if (!isset($mysqli) || !isset($logged_user_id) || !isset($logged_is_admin)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server misconfiguration: DB/auth not initialized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Helper: allowed printer types
$ALLOWED_PRINTER_TYPES = ['auto', 'thermal-3in', 'regular-a4'];

// Helper to fetch user row by id (includes printer_type now)
function get_user_row($mysqli, $id) {
    $stmt = $mysqli->prepare('SELECT id, name, email, phone, role, lead_notifications, notification_email, IFNULL(printer_type, "auto") AS printer_type FROM users WHERE id = ? LIMIT 1');
    if (!$stmt) return null;
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $res = $stmt->get_result();
    return $res->fetch_assoc();
}

// Ensure methods allowed
if ($method === 'GET') {
    $target_id = isset($_GET['id']) ? (int) $_GET['id'] : $logged_user_id;

    // Authorization: non-admins can only view themselves
    if ($target_id !== (int)$logged_user_id && !$logged_is_admin) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $row = get_user_row($mysqli, $target_id);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    echo json_encode(['data' => $row]);
    exit;
}

// Read body for PUT/POST
if ($method === 'PUT' || $method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $target_id = isset($_GET['id']) ? (int) $_GET['id'] : $logged_user_id;

    // Authorization: non-admins can only update themselves
    if ($target_id !== (int)$logged_user_id && !$logged_is_admin) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    // Allowed/expected fields
    $name = array_key_exists('name', $input) ? trim($input['name']) : null;
    $email = array_key_exists('email', $input) ? trim($input['email']) : null;
    $phone = array_key_exists('phone', $input) ? trim($input['phone']) : null;
    $lead_notifications = array_key_exists('lead_notifications', $input) ? ($input['lead_notifications'] ? 1 : 0) : null;
    $notification_email = array_key_exists('notification_email', $input) ? trim($input['notification_email']) : null;
    $role = array_key_exists('role', $input) ? trim($input['role']) : null;
    $printer_type = array_key_exists('printer_type', $input) ? trim($input['printer_type']) : null;

    // Validate emails
    if ($email !== null && $email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email']);
        exit;
    }
    if ($notification_email !== null && $notification_email !== '' && !filter_var($notification_email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid notification email']);
        exit;
    }

    // Role update allowed only for admin
    if ($role !== null && !$logged_is_admin) {
        http_response_code(403);
        echo json_encode(['error' => 'Cannot update role']);
        exit;
    }

    // Validate printer_type if provided
    if ($printer_type !== null) {
        global $ALLOWED_PRINTER_TYPES;
        if (!in_array($printer_type, $ALLOWED_PRINTER_TYPES, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid printer_type']);
            exit;
        }
    }

    // Build dynamic UPDATE query
    $sets = [];
    $types = '';
    $vals = [];

    if ($name !== null) { $sets[] = 'name = ?'; $types .= 's'; $vals[] = $name; }
    if ($email !== null) { $sets[] = 'email = ?'; $types .= 's'; $vals[] = $email; }
    if ($phone !== null) { $sets[] = 'phone = ?'; $types .= 's'; $vals[] = $phone; }
    if ($notification_email !== null) { $sets[] = 'notification_email = ?'; $types .= 's'; $vals[] = $notification_email; }
    if ($lead_notifications !== null) { $sets[] = 'lead_notifications = ?'; $types .= 'i'; $vals[] = $lead_notifications; }
    if ($role !== null) { $sets[] = 'role = ?'; $types .= 's'; $vals[] = $role; }
    if ($printer_type !== null) { $sets[] = 'printer_type = ?'; $types .= 's'; $vals[] = $printer_type; }

    if (empty($sets)) {
        // Nothing to update
        echo json_encode(['message' => 'Nothing to update']);
        exit;
    }

    $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ? LIMIT 1';
    $types .= 'i'; $vals[] = $target_id;

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed', 'details' => $mysqli->error]);
        exit;
    }

    // Bind params dynamically
    $bind_names[] = $types;
    for ($i = 0; $i < count($vals); $i++) {
        $bind_name = 'bind' . $i;
        $$bind_name = $vals[$i];
        $bind_names[] = &$$bind_name;
    }
    call_user_func_array([$stmt, 'bind_param'], $bind_names);

    if ($stmt->execute()) {
        // Fetch and return updated row for convenience (so frontend can update pos_user)
        $updated = get_user_row($mysqli, $target_id);
        echo json_encode(['success' => true, 'data' => $updated]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed', 'details' => $stmt->error]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit;
