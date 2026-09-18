<?php
require_once __DIR__ . '/../cors.php';
// server/api/google_sheet_sync.php
// Google Sheets Integration Endpoint for Sri Balaji Renewables POS

header('Content-Type: application/json; charset=utf-8');

include '../db_connect.php';
/** @var mysqli $conn */
if (file_exists('../sms_sync_helper.php')) {
    include_once '../sms_sync_helper.php';
}

// Security API Key check (Optional security layer)
$EXPECTED_SECRET = "sbr_pos_sync_2026";
$provided_secret = $_REQUEST['api_key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;

// Allow GET action=get_all to fetch products for Google Sheets initial setup
$action = $_GET['action'] ?? null;

if ($action === 'get_all') {
    $sql = "SELECT id, sku, name, category, price, stock_level, min_stock_level, supplier_id, description FROM products ORDER BY name ASC";
    $result = $conn->query($sql);
    $products = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $products[] = [
                'id' => intval($row['id']),
                'sku' => $row['sku'] ?? '',
                'name' => $row['name'] ?? '',
                'category' => $row['category'] ?? 'General',
                'price' => floatval($row['price'] ?? 0),
                'stock_level' => intval($row['stock_level'] ?? 0),
                'min_stock_level' => intval($row['min_stock_level'] ?? 0),
                'supplier_id' => (!empty($row['supplier_id']) && is_numeric($row['supplier_id'])) ? intval($row['supplier_id']) : '',
                'description' => $row['description'] ?? ''
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
} else if (isset($data['sku']) || isset($data['name']) || isset($data['product_name']) || isset($data['Product Name'])) {
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
    $sku = trim($item['sku'] ?? $item['SKU'] ?? $item['Item ID'] ?? $item['item_id'] ?? '');
    $name = trim($item['name'] ?? $item['product_name'] ?? $item['Product Name'] ?? $item['Name'] ?? $item['item_name'] ?? '');
    
    if ($sku === '-') $sku = '';

    if (empty($name) && empty($sku)) {
        continue;
    }

    $price = null;
    if (isset($item['price']) && $item['price'] !== '') {
        $price = floatval($item['price']);
    } else if (isset($item['Price']) && $item['Price'] !== '') {
        $price = floatval($item['Price']);
    } else if (isset($item['Price (₹)']) && $item['Price (₹)'] !== '') {
        $price = floatval($item['Price (₹)']);
    }

    $stock_level = null;
    if (isset($item['stock_level']) && $item['stock_level'] !== '') {
        $stock_level = intval($item['stock_level']);
    } else if (isset($item['Current Stock Level']) && $item['Current Stock Level'] !== '') {
        $stock_level = intval($item['Current Stock Level']);
    } else if (isset($item['Current Stock']) && $item['Current Stock'] !== '') {
        $stock_level = intval($item['Current Stock']);
    } else if (isset($item['stock']) && $item['stock'] !== '') {
        $stock_level = intval($item['stock']);
    } else if (isset($item['Opening Stock']) && $item['Opening Stock'] !== '') {
        $stock_level = intval($item['Opening Stock']);
    }

    $min_stock_level = null;
    if (isset($item['min_stock_level']) && $item['min_stock_level'] !== '') {
        $min_stock_level = intval($item['min_stock_level']);
    } else if (isset($item['Minimum Stock Level']) && $item['Minimum Stock Level'] !== '') {
        $min_stock_level = intval($item['Minimum Stock Level']);
    } else if (isset($item['Min Stock Level']) && $item['Min Stock Level'] !== '') {
        $min_stock_level = intval($item['Min Stock Level']);
    } else if (isset($item['Low Stock Alert']) && $item['Low Stock Alert'] !== '') {
        $min_stock_level = intval($item['Low Stock Alert']);
    } else if (isset($item['min_stock']) && $item['min_stock'] !== '') {
        $min_stock_level = intval($item['min_stock']);
    }

    $category = null;
    if (isset($item['category']) && trim($item['category']) !== '') {
        $category = trim($item['category']);
    } else if (isset($item['Category']) && trim($item['Category']) !== '') {
        $category = trim($item['Category']);
    }

    $supplier_id = null;
    $supplier_id_set = false;
    if (isset($item['supplier_id']) && $item['supplier_id'] !== '') {
        $supplier_id_set = true;
        $supplier_id = (is_numeric($item['supplier_id']) && intval($item['supplier_id']) > 0) ? intval($item['supplier_id']) : null;
    } else if (isset($item['Supplier ID']) && $item['Supplier ID'] !== '') {
        $supplier_id_set = true;
        $supplier_id = (is_numeric($item['Supplier ID']) && intval($item['Supplier ID']) > 0) ? intval($item['Supplier ID']) : null;
    }

    $description = null;
    if (isset($item['description'])) {
        $description = trim($item['description']);
    } else if (isset($item['Description'])) {
        $description = trim($item['Description']);
    }

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
        if ($min_stock_level !== null) {
            $fields[] = "min_stock_level = ?";
            $params[] = $min_stock_level;
            $types .= "i";
        }
        if ($category !== null) {
            $fields[] = "category = ?";
            $params[] = $category;
            $types .= "s";
        }
        if (!empty($name)) {
            $fields[] = "name = ?";
            $params[] = $name;
            $types .= "s";
        }
        if (!empty($sku)) {
            $fields[] = "sku = ?";
            $params[] = $sku;
            $types .= "s";
        }
        if ($supplier_id_set) {
            if ($supplier_id !== null) {
                $fields[] = "supplier_id = ?";
                $params[] = $supplier_id;
                $types .= "i";
            } else {
                $fields[] = "supplier_id = NULL";
            }
        }
        if ($description !== null) {
            $fields[] = "description = ?";
            $params[] = $description;
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
                if (function_exists('sync_single_product_to_sms')) {
                    sync_single_product_to_sms([
                        'id' => $existing_id,
                        'pos_product_id' => $existing_id,
                        'name' => $name,
                        'price' => $price,
                        'stock_level' => $stock_level,
                        'min_stock_level' => $min_stock_level,
                        'category' => $category,
                        'sku' => $sku,
                        'description' => $description
                    ], 'upsert');
                }
            } else {
                $error_count++;
            }
            $stmt->close();
        }
    } else {
        // Insert new product
        $final_name = !empty($name) ? $name : $sku;
        $final_price = $price !== null ? $price : 0.0;
        $final_stock = $stock_level !== null ? $stock_level : 0;
        $final_min_stock = $min_stock_level !== null ? $min_stock_level : 0;
        $final_category = !empty($category) ? $category : 'General';
        $final_sku = !empty($sku) ? $sku : null;
        $final_supplier = $supplier_id;
        $final_desc = $description !== null ? $description : '';

        $cols = ["name", "description", "price", "stock_level", "min_stock_level", "category"];
        $placeholders = ["?", "?", "?", "?", "?", "?"];
        $types = "ssdiis";
        $params = [$final_name, $final_desc, $final_price, $final_stock, $final_min_stock, $final_category];

        if ($final_sku !== null) {
            $cols[] = "sku";
            $placeholders[] = "?";
            $types .= "s";
            $params[] = $final_sku;
        } else {
            $cols[] = "sku";
            $placeholders[] = "NULL";
        }

        if ($final_supplier !== null) {
            $cols[] = "supplier_id";
            $placeholders[] = "?";
            $types .= "i";
            $params[] = $final_supplier;
        } else {
            $cols[] = "supplier_id";
            $placeholders[] = "NULL";
        }

        $sql = "INSERT INTO products (" . implode(", ", $cols) . ") VALUES (" . implode(", ", $placeholders) . ")";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            $inserted_count++;
            if (function_exists('sync_single_product_to_sms')) {
                sync_single_product_to_sms([
                    'id' => $newId,
                    'pos_product_id' => $newId,
                    'name' => $final_name,
                    'price' => $final_price,
                    'stock_level' => $final_stock,
                    'min_stock_level' => $final_min_stock,
                    'category' => $final_category,
                    'sku' => $final_sku,
                    'description' => $final_desc
                ], 'upsert');
            }
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
