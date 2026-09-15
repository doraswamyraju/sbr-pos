<?php
require_once __DIR__ . '/../cors.php';
// leads.php
// Complete API for Leads used by the React frontend

// Enable detailed PHP error reporting for debugging
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');

session_start();

// Helper functions for JSON responses
function errorJson($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function successJson($data = ['message' => 'Success']) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

// Function to read JSON input
function jsonInput() {
    $input = file_get_contents("php://input");
    $decoded = json_decode($input, true);
    return is_array($decoded) ? $decoded : null;
}

// Load DB connection
require_once __DIR__ . '/../db_connect.php';

// Check if MySQLi connection is valid
if ($conn->connect_error) {
    errorJson("Database Connection Failed: " . $conn->connect_error, 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Helper: flexible getter for common field name variants
function flex_get($data, $variants = []) {
    if (!is_array($data)) return null;
    // exact keys first
    foreach ($variants as $k) {
        if (array_key_exists($k, $data)) {
            return $data[$k];
        }
    }
    // case-insensitive fallback
    foreach ($data as $rk => $rv) {
        foreach ($variants as $k) {
            if (strcasecmp(trim($rk), trim($k)) === 0) {
                return $rv;
            }
            // normalize underscores/spaces
            $rkN = strtolower(str_replace([' ', '-'], '_', trim($rk)));
            $kN  = strtolower(str_replace([' ', '-'], '_', trim($k)));
            if ($rkN === $kN) return $rv;
        }
    }
    return null;
}

// GET: list or single lead
if ($method === 'GET') {
    $select_fields = "id, full_name, contact_info, email, source, assigned_to_user_id, followup_reminder, status, notes, address, created_at";
    
    if ($id > 0) {
        $sql = "SELECT $select_fields FROM leads WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $lead = $result->fetch_assoc();
        if ($lead) {
            successJson(['data' => $lead]);
        } else {
            errorJson('Lead not found', 404);
        }
    } else {
        $sql = "SELECT $select_fields FROM leads ORDER BY created_at DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            errorJson("Query failed: " . $conn->error, 500);
        }

        $leads = [];
        while ($row = $result->fetch_assoc()) {
            $leads[] = $row;
        }
        successJson(['data' => $leads]);
    }
}

// POST: create new lead
if ($method === 'POST') {
    // Accept JSON body or form-encoded POST
    $body = jsonInput();
    if ($body === null) {
        $body = $_POST;
    }

    $full_name = flex_get($body, ['full_name', 'name', 'client_name', 'customer_name']) ?? '';
    $contact_info = flex_get($body, ['contact_info', 'phone', 'mobile', 'phone_number']) ?? '';
    $email = flex_get($body, ['email', 'email_address']) ?? null;
    $source = flex_get($body, ['source', 'lead_source']) ?? 'Direct';
    $assigned_to_user_id = flex_get($body, ['assigned_to_user_id', 'assigned_to', 'user_id', 'agent_id']);
    $followup_reminder = flex_get($body, ['followup_reminder', 'reminder_date', 'followup_date']);
    $status = flex_get($body, ['status', 'lead_status']) ?? 'New';
    $notes = flex_get($body, ['notes', 'remarks', 'comment']) ?? null;
    $address = flex_get($body, ['address', 'location']) ?? null;

    if (empty($full_name)) {
        errorJson('Name / Customer Name is required', 422);
    }
    if (empty($contact_info)) {
        errorJson('Contact info / Phone is required', 422);
    }

    $assigned_param = ($assigned_to_user_id !== null && $assigned_to_user_id !== '') ? (int)$assigned_to_user_id : null;
    $followup_param = !empty($followup_reminder) ? $followup_reminder : null;

    $sql = "INSERT INTO leads (full_name, contact_info, email, source, assigned_to_user_id, followup_reminder, status, notes, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        errorJson("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param('ssssissss', $full_name, $contact_info, $email, $source, $assigned_param, $followup_param, $status, $notes, $address);

    if ($stmt->execute()) {
        $new_id = $conn->insert_id;
        successJson(['message' => 'Lead created successfully', 'lead_id' => $new_id]);
    } else {
        errorJson("Execute failed: " . $stmt->error, 500);
    }
}

// PUT: update lead
if ($method === 'PUT') {
    if ($id <= 0) {
        errorJson('Lead ID is required for update', 400);
    }

    $body = jsonInput();
    if ($body === null) {
        errorJson('Invalid JSON body', 400);
    }

    $full_name = flex_get($body, ['full_name', 'name']);
    $contact_info = flex_get($body, ['contact_info', 'phone', 'mobile']);
    $email = flex_get($body, ['email']);
    $source = flex_get($body, ['source']);
    $assigned_to_user_id = flex_get($body, ['assigned_to_user_id', 'assigned_to', 'user_id', 'agent_id']);
    $followup_reminder = flex_get($body, ['followup_reminder', 'reminder_date']);
    $status = flex_get($body, ['status']);
    $notes = flex_get($body, ['notes', 'remarks']);
    $address = flex_get($body, ['address']);

    $fields = [];
    $params = [];
    $types = '';

    if ($full_name !== null) { $fields[] = 'full_name = ?'; $params[] = $full_name; $types .= 's'; }
    if ($contact_info !== null) { $fields[] = 'contact_info = ?'; $params[] = $contact_info; $types .= 's'; }
    if ($email !== null) { $fields[] = 'email = ?'; $params[] = $email; $types .= 's'; }
    if ($source !== null) { $fields[] = 'source = ?'; $params[] = $source; $types .= 's'; }
    if ($assigned_to_user_id !== null) { 
        $fields[] = 'assigned_to_user_id = ?'; 
        $params[] = ($assigned_to_user_id === '' ? null : (int)$assigned_to_user_id); 
        $types .= 'i'; 
    }
    if ($followup_reminder !== null) { 
        $fields[] = 'followup_reminder = ?'; 
        $params[] = (!empty($followup_reminder) ? $followup_reminder : null); 
        $types .= 's'; 
    }
    if ($status !== null) { $fields[] = 'status = ?'; $params[] = $status; $types .= 's'; }
    if ($notes !== null) { $fields[] = 'notes = ?'; $params[] = $notes; $types .= 's'; }
    if ($address !== null) { $fields[] = 'address = ?'; $params[] = $address; $types .= 's'; }

    if (empty($fields)) {
        errorJson('No fields provided to update', 400);
    }

    $sql = "UPDATE leads SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;
    $types .= 'i';

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        errorJson("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        successJson(['message' => 'Lead updated successfully']);
    } else {
        errorJson("Execute failed: " . $stmt->error, 500);
    }
}

// DELETE: delete lead
if ($method === 'DELETE') {
    if ($id <= 0) {
        errorJson('Lead ID is required for delete', 400);
    }

    $stmt = $conn->prepare("DELETE FROM leads WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        successJson(['message' => 'Lead deleted successfully']);
    } else {
        errorJson("Delete failed: " . $stmt->error, 500);
    }
}
?>
