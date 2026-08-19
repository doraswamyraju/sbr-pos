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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
if ($data === null) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON data received."]);
    exit;
}

$products = $data['products'] ?? $data['rows'] ?? $data;
if (!is_array($products)) {
    http_response_code(400);
    echo json_encode(["error" => "No product rows found."]);
    exit;
}

$success_count = 0;
$error_count = 0;
$update_count = 0;

foreach ($products as $product) {
    $name = trim($product['name'] ?? $product['product_name'] ?? $product['Item Name'] ?? '');
    $sku = trim($product['sku'] ?? $product['item_id'] ?? '');

    if (empty($name) && !empty($sku)) {
        $name = $sku;
    }

    if (empty($name)) {
        continue;
    }

    $description = trim($product['description'] ?? '');
    $price = floatval($product['price'] ?? $product['selling_price'] ?? 0);
    $stock_level = intval($product['stock_level'] ?? $product['stock'] ?? $product['current_stock'] ?? $product['opening_stock'] ?? 0);

    if ($sku === '-' || $sku === '') {
        $sku = null;
    }

    $category = trim($product['category'] ?? 'General');
    if (empty($category)) {
        $category = 'General';
    }

    $supplier_id = isset($product['supplier_id']) && is_numeric($product['supplier_id']) ? intval($product['supplier_id']) : null;

    // Check if product exists by SKU or Name
    $existing_id = null;
    if ($sku !== null) {
        $check_stmt = $conn->prepare("SELECT id FROM products WHERE sku = ? LIMIT 1");
        $check_stmt->bind_param("s", $sku);
        $check_stmt->execute();
        $check_res = $check_stmt->get_result();
        if ($row = $check_res->fetch_assoc()) {
            $existing_id = $row['id'];
        }
        $check_stmt->close();
    }

    if (!$existing_id) {
        $check_stmt = $conn->prepare("SELECT id FROM products WHERE name = ? LIMIT 1");
        $check_stmt->bind_param("s", $name);
        $check_stmt->execute();
        $check_res = $check_stmt->get_result();
        if ($row = $check_res->fetch_assoc()) {
            $existing_id = $row['id'];
        }
        $check_stmt->close();
    }

    if ($existing_id) {
        // Update existing product
        $upd_stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, stock_level=?, sku=?, category=?, supplier_id=? WHERE id=?");
        $upd_stmt->bind_param("ssdissii", $name, $description, $price, $stock_level, $sku, $category, $supplier_id, $existing_id);
        if ($upd_stmt->execute()) {
            $update_count++;
        } else {
            $error_count++;
        }
        $upd_stmt->close();
    } else {
        // Insert new product
        $ins_stmt = $conn->prepare("INSERT INTO products (name, description, price, stock_level, sku, category, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $ins_stmt->bind_param("ssdissi", $name, $description, $price, $stock_level, $sku, $category, $supplier_id);
        if ($ins_stmt->execute()) {
            $success_count++;
        } else {
            $error_count++;
        }
        $ins_stmt->close();
    }
}

if ($error_count === 0 || $success_count > 0 || $update_count > 0) {
    echo json_encode([
        "message" => "Successfully processed products: $success_count new added, $update_count updated.",
        "new_products" => $success_count,
        "updated_products" => $update_count,
        "errors" => $error_count
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to import products. Errors encountered: $error_count"]);
}

$conn->close();
?>