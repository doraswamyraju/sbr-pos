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

// convert_lead.php
// POST JSON: { lead_id: INT, items: [{product_id:int, qty:int}, ...] }
// Returns JSON { status: "success", sale_id, invoice_id, invoice_url } or { status: "error", message }

header('Content-Type: application/json');
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
}


// Enable CORS (Cross-Origin Resource Sharing)
if (isset($_SERVER['HTTP_ORIGIN'])) {
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- DB connection: adjust credentials ---
$DB_HOST = '127.0.0.1';
$DB_USER = 'rajugda1_sbr';
$DB_PASS = 'BOHPM6139n@';
$DB_NAME = 'rajugda1_sbrpos_db';

// helper
function fail($msg) {
    echo json_encode(['status' => 'error', 'message' => $msg]);
    exit;
}

$raw = file_get_contents("php://input");
if (!$raw) fail("No input");
$data = json_decode($raw, true);
if (!$data) fail("Invalid JSON");

if (empty($data['lead_id'])) fail("lead_id is required");
$lead_id = intval($data['lead_id']);
$items = $data['items'] ?? [];

if (!is_array($items) || count($items) === 0) fail("At least one product item required.");

// connect
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    fail("DB connect error: " . $mysqli->connect_error);
}

$mysqli->set_charset("utf8mb4");

try {
    $mysqli->begin_transaction();

    // 1) load lead
    $stmt = $mysqli->prepare("SELECT * FROM leads WHERE id = ?");
    $stmt->bind_param("i", $lead_id);
    $stmt->execute();
    $leadRes = $stmt->get_result();
    $lead = $leadRes->fetch_assoc();
    $stmt->close();

    if (!$lead) {
        $mysqli->rollback();
        fail("Lead not found.");
    }

    // 2) create or find customer (use lead email or phone)
    $customer_id = null;
    $lead_email = $lead['email'] ?? null;
    $lead_phone = $lead['contact_info'] ?? ($lead['phone'] ?? null);
    if ($lead_email) {
        $stmt = $mysqli->prepare("SELECT id FROM customers WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $lead_email);
        $stmt->execute();
        $r = $stmt->get_result();
        $existing = $r->fetch_assoc();
        $stmt->close();
        if ($existing && $existing['id']) {
            $customer_id = $existing['id'];
        }
    }
    if (!$customer_id && $lead_phone) {
        $stmt = $mysqli->prepare("SELECT id FROM customers WHERE phone_number = ? LIMIT 1");
        $stmt->bind_param("s", $lead_phone);
        $stmt->execute();
        $r = $stmt->get_result();
        $existing = $r->fetch_assoc();
        $stmt->close();
        if ($existing && $existing['id']) {
            $customer_id = $existing['id'];
        }
    }

    if (!$customer_id) {
        // create new customer from lead
        $full_name = $lead['full_name'] ?? '';
        $phone = $lead_phone ?? '';
        $email = $lead_email ?? '';
        $address = $lead['address'] ?? '';
        $is_active = 1;
        
        $stmt = $mysqli->prepare("INSERT INTO customers (full_name, phone_number, email, address, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssis", $full_name, $phone, $email, $address, $is_active);
        
        $ok = $stmt->execute();
        if (!$ok) {
            $mysqli->rollback();
            fail("Failed to create customer: " . $stmt->error);
        }
        $customer_id = $stmt->insert_id;
        $stmt->close();
    }

    // 3) create sale (sales table)
    $user_id = $lead['assigned_to_user_id'] ?? 1; // 1 is a hardcoded ID for 'Admin User' from your SQL dump.
    $total_amount = 0;
    
    $sale_items_data = [];
    $product_price_stmt = $mysqli->prepare("SELECT id, price, name FROM products WHERE id = ? LIMIT 1");
    
    foreach ($items as $it) {
        $pid = intval($it['product_id']);
        $qty = max(1, intval($it['qty'] ?? 1));
        
        $product_price_stmt->bind_param("i", $pid);
        $product_price_stmt->execute();
        $r = $product_price_stmt->get_result();
        $prod = $r->fetch_assoc();
        
        if (!$prod) {
            $mysqli->rollback();
            fail("Product not found: id {$pid}");
        }
        $rate = floatval($prod['price'] ?? 0);
        $line_total = $rate * $qty;
        
        $sale_items_data[] = ['product_id' => $pid, 'quantity' => $qty, 'rate' => $rate, 'total' => $line_total, 'name' => $prod['name']];
        $total_amount += $line_total;
    }
    $product_price_stmt->close();

    $status = 'Completed';
    $stmt = $mysqli->prepare("INSERT INTO sales (customer_id, total_amount, user_id, status) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("idss", $customer_id, $total_amount, $user_id, $status);
    
    $ok = $stmt->execute();
    if (!$ok) {
        $mysqli->rollback();
        fail("Failed to create sale: " . $stmt->error);
    }
    $sale_id = $stmt->insert_id;
    $stmt->close();

    // insert sale items
    $stmt = $mysqli->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
    foreach ($sale_items_data as $row) {
        $stmt->bind_param("iiid", 
            $sale_id, 
            $row['product_id'], 
            $row['quantity'], 
            $row['rate']
        );
        
        $ok = $stmt->execute();
        if (!$ok) {
            $mysqli->rollback();
            fail("Failed to insert sale item: " . $stmt->error);
        }
    }
    $stmt->close();
    
    // The `invoices` table doesn't exist in your schema, so we should skip this step.
    
    // Optionally mark lead as converted
    $stmt = $mysqli->prepare("UPDATE leads SET status = 'Converted', converted_to_sale_id = ? WHERE id = ?");
    $stmt->bind_param("ii", $sale_id, $lead_id);
    $stmt->execute();
    $stmt->close();

    $mysqli->commit();

    // Structure the response to match the sales.php response
    $sale_date = (new DateTime())->format('Y-m-d H:i:s');
    $customer_name = $lead['full_name'] ?? 'Walk-in Customer';
    
    echo json_encode([
        'status' => 'success',
        'sale' => [
            'id' => $sale_id,
            'customer_id' => $customer_id,
            'user_id' => $user_id,
            'total_amount' => $total_amount,
            'payable_amount' => $total_amount, // Assuming no discount on leads for now
            'status' => $status,
            'sale_date' => $sale_date,
            'customer_name' => $customer_name,
            'items' => $sale_items_data
        ],
        'message' => 'Lead converted to sale successfully.'
    ]);
    exit;

} catch (Exception $e) {
    $mysqli->rollback();
    fail("Server error: " . $e->getMessage());
}
?>