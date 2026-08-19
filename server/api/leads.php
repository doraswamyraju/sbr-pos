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

$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
}

// leads.php
// Complete API for Leads used by the React frontend

// Enable detailed PHP error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// Basic CORS (adjust for production)
if (isset($_SERVER['HTTP_ORIGIN'])) {
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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

// Simple authentication check (adjust as needed)
// if (!isset($_SESSION['user_id'])) {
//     errorJson('Unauthorized', 401);
// }

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

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

// POST: create new lead
if ($method === 'POST') {
    // Accept JSON body or form-encoded POST
    $body = jsonInput();
    if ($body === null) {
        // fall back to $_POST
        $body = $_POST;
    }

    // Map common variants -> canonical names
    $full_name = trim((string) (flex_get($body, ['full_name','Full Name','Name','name']) ?? ''));
    $phone     = trim((string) (flex_get($body, ['phone_number','phone','Phone','contact_info','contact']) ?? ''));
    $email     = trim((string) (flex_get($body, ['email','Email','e-mail']) ?? ''));
    $source    = trim((string) (flex_get($body, ['source','Source']) ?? ''));
    $assigned  = flex_get($body, ['assigned_to_user_id','Assigned To','assigned_to','assigned']);
    $status    = trim((string) (flex_get($body, ['status','Status']) ?? ''));
    $notes     = trim((string) (flex_get($body, ['notes','Notes','note']) ?? ''));
    $address   = trim((string) (flex_get($body, ['address','Address']) ?? ''));
    $followup  = flex_get($body, ['followup_reminder','followup_reminder']);

    // Normalize assigned to integer or null
    if ($assigned !== null && $assigned !== '') {
        $assigned = (int) $assigned;
    } else {
        $assigned = null;
    }

    // Required fields: ensure canonical names are present
    // Keep original required set but use mapped values
    $required_missing = [];
    if ($full_name === '') $required_missing[] = 'full_name (or Name)';
    if ($phone === '') $required_missing[] = 'phone_number (or Phone)';
    if ($email === '') $required_missing[] = 'email';
    if ($source === '') $required_missing[] = 'source';

    if (!empty($required_missing)) {
        errorJson('Missing required field: ' . implode(', ', $required_missing), 422);
    }

    $sql = "INSERT INTO leads (full_name, contact_info, email, source, assigned_to_user_id, status, notes, address, followup_reminder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        errorJson('Prepare failed: ' . $conn->error, 500);
    }

    // Bind parameters with correct types
    // followup_reminder may be null/string; we pass as string
    $stmt->bind_param('ssssissss', $full_name, $phone, $email, $source, $assigned, $status, $notes, $address, $followup);

    if ($stmt->execute()) {
        successJson(['message' => 'Lead created', 'id' => $conn->insert_id]);
    } else {
        errorJson('Failed to create lead: ' . $stmt->error, 500);
    }
}

// PUT: update lead
if ($method === 'PUT') {
    if ($id <= 0) {
        errorJson('Missing lead id', 422);
    }
    $data = jsonInput();
    $updates = [];
    $params = [];
    $types = '';

    $fields_to_update = ['full_name', 'contact_info', 'email', 'source', 'assigned_to_user_id', 'followup_reminder', 'status', 'notes', 'address'];
    
    if (isset($data['phone_number']) && !isset($data['contact_info'])) {
        $data['contact_info'] = $data['phone_number'];
    }

    foreach ($fields_to_update as $field) {
        if (isset($data[$field])) {
            $updates[] = "`$field` = ?";
            $params[] = $data[$field];
            $types .= 's';
        }
    }

    if (empty($updates)) {
        successJson(['message' => 'No changes supplied']);
    }

    $params[] = $id;
    $types .= 'i';
    
    $sql = "UPDATE leads SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        successJson(['updated' => $stmt->affected_rows]);
    } else {
        errorJson('Update error: ' . $stmt->error, 500);
    }
}

// DELETE: remove lead
if ($method === 'DELETE') {
    if ($id <= 0) {
        errorJson('Missing lead id', 422);
    }
    $sql = "DELETE FROM leads WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        successJson(['deleted' => $stmt->affected_rows]);
    } else {
        errorJson('Delete error: ' . $stmt->error, 500);
    }
}

$conn->close();
