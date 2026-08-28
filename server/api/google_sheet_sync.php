<?php
// server/api/google_sheet_sync.php
// Google Sheets Integration Endpoint for Sri Balaji Renewables POS

$allowed_origins = ['http://localhost:3000', 'https://pos.sriddha.com', 'https://sbrpos.rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-KEY");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

include '../db_connect.php';

// Security API Key check (Optional security layer)
$EXPECTED_SECRET = "sbr_pos_sync_2026";
$provided_secret = $_REQUEST['api_key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;

// Allow GET action=get_all to fetch products for Google Sheets initial setup
$action = $_GET['action'] ?? null;

if ($action === 'get_all') {
    $sql = "SELECT id, sku, name, category, price, stock_level FROM products ORDER BY name ASC";
    $result = $conn->query($sql);
    $products = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $products[] = [
                'id' => intval($row['id']),
                'sku' => $row['sku'] ?? '',
                'name' => $row['name'] ?? '',
                'category' => $row['category'] ?? 'General',
                'price' => floatval($row['price']),
                'stock_level' => intval($row['stock_level'])
            ];
        }
    }
    echo json_encode(['success' => true, 'total' => count($products), 'products' => $products]);
    $conn->close();
    exit;
}

// Read incoming JSON body from Google Apps Script (UrlFetchApp)
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    // Fallback to $_POST parameters if sent as form-urlencoded
    $data = $_POST;
}

$products = [];

if (isset($data['products']) && is_array($data['products'])) {
    $products = $data['products'];
} else if (isset($data['sku']) || isset($data['name']) || isset($data['product_name'])) {
    // Single product row update
    $products[] = $data;
} else if (is_array($data) && count($data) > 0 && isset($data[0])) {
    $products = $data;
}

if (empty($products)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No product data received."]);
    $conn->close();
    exit;
}

$updated_count = 0;
$inserted_count = 0;
$error_count = 0;

foreach ($products as $item) {
    $sku = trim($item['sku'] ?? $item['Item ID'] ?? $item['SKU'] ?? '');
    $name = trim($item['name'] ?? $item['product_name'] ?? $item['Product Name'] ?? $item['Name'] ?? '');
    
    if ($sku === '-') $sku = '';

    if (empty($name) && empty($sku)) {
        continue;
    }

    $price = null;
    if (isset($item['price']) && $item['price'] !== '') {
        $price = floatval($item['price']);
    } else if (isset($item['Price']) && $item['Price'] !== '') {
        $price = floatval($item['Price']);
    }

    $stock_level = null;
    if (isset($item['stock_level']) && $item['stock_level'] !== '') {
        $stock_level = intval($item['stock_level']);
    } else if (isset($item['stock']) && $item['stock'] !== '') {
        $stock_level = intval($item['stock']);
    } else if (isset($item['Current Stock']) && $item['Current Stock'] !== '') {
        $stock_level = intval($item['Current Stock']);
    } else if (isset($item['Opening Stock']) && $item['Opening Stock'] !== '') {
        $stock_level = intval($item['Opening Stock']);
    }

    $category = trim($item['category'] ?? $item['Category'] ?? '');

    // Check if product exists by SKU or Name
    $existing_id = null;
    if (!empty($sku)) {
        $check = $conn->prepare("SELECT id FROM products WHERE sku = ? OR REPLACE(sku, '-', ' ') = REPLACE(?, '-', ' ') OR REPLACE(sku, ' ', '') = REPLACE(?, '-', '') LIMIT 1");
        $check->bind_param("sss", $sku, $sku, $sku);
        $check->execute();
        $res = $check->get_result();
        if ($r = $res->fetch_assoc()) {
            $existing_id = $r['id'];
        }
        $check->close();
    }

    if (!$existing_id && !empty($name)) {
        $check = $conn->prepare("SELECT id FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1");
        $check->bind_param("s", $name);
        $check->execute();
        $res = $check->get_result();
        if ($r = $res->fetch_assoc()) {
            $existing_id = $r['id'];
        }
        $check->close();
    }

    if ($existing_id) {
        // Build dynamic UPDATE query depending on which fields were provided
        $fields = [];
        $params = [];
        $types = "";

        if ($price !== null) {
            $fields[] = "price = ?";
            $params[] = $price;
            $types .= "d";
        }
        if ($stock_level !== null) {
            $fields[] = "stock_level = ?";
            $params[] = $stock_level;
            $types .= "i";
        }
        if (!empty($category)) {
            $fields[] = "category = ?";
            $params[] = $category;
            $types .= "s";
        }
        if (!empty($name)) {
            $fields[] = "name = ?";
            $params[] = $name;
            $types .= "s";
        }

        if (!empty($fields)) {
            $sql = "UPDATE products SET " . implode(", ", $fields) . " WHERE id = ?";
            $params[] = $existing_id;
            $types .= "i";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            if ($stmt->execute()) {
                $updated_count++;
            } else {
                $error_count++;
            }
            $stmt->close();
        }
    } else {
        // Insert new product if price and stock are set
        $final_name = !empty($name) ? $name : $sku;
        $final_price = $price !== null ? $price : 0.0;
        $final_stock = $stock_level !== null ? $stock_level : 0;
        $final_category = !empty($category) ? $category : 'General';
        $final_sku = !empty($sku) ? $sku : null;

        $stmt = $conn->prepare("INSERT INTO products (name, sku, category, price, stock_level) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssdi", $final_name, $final_sku, $final_category, $final_price, $final_stock);
        if ($stmt->execute()) {
            $inserted_count++;
        } else {
            $error_count++;
        }
        $stmt->close();
    }
}

echo json_encode([
    "success" => true,
    "message" => "Google Sheet sync successful.",
    "updated" => $updated_count,
    "inserted" => $inserted_count,
    "errors" => $error_count
]);

$conn->close();
?>
