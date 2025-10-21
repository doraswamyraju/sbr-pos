<?php
// C:\xampp\htdocs\pos-system\server\api\bulk_import.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
if ($data === null || !isset($data['products'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON data received."]);
    exit;
}

$products = $data['products'];
$success_count = 0;
$error_count = 0;
$update_count = 0;

$stmt = $conn->prepare("INSERT INTO products (name, description, price, stock_level, sku, category, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), stock_level=VALUES(stock_level), category=VALUES(category), supplier_id=VALUES(supplier_id)");

foreach ($products as $product) {
    // Get values with null coalescing to prevent errors
    $name = $product['name'] ?? '';
    $description = $product['description'] ?? '';
    $price = $product['price'] ?? 0;
    $stock_level = $product['stock_level'] ?? 0;
    $sku = $product['sku'] ?? '';
    $category = $product['category'] ?? '';
    $supplier_id = $product['supplier_id'] ?? null;
    
    // Bind parameters and execute
    $stmt->bind_param("ssdissi", 
        $name,
        $description,
        $price,
        $stock_level,
        $sku,
        $category,
        $supplier_id
    );

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 1) {
            $update_count++;
        } else {
            $success_count++;
        }
    } else {
        $error_count++;
    }
}
$stmt->close();

if ($error_count === 0) {
    echo json_encode(["message" => "Successfully imported and updated products.", "new_products" => $success_count, "updated_products" => $update_count]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Successfully imported $success_count new products and updated $update_count products. Failed to import $error_count products."]);
}

$conn->close();
?>