<?php
// server/api/products.php

$allowed_origins = ['http://localhost:3000', 'https://pos.sriddha.com', 'https://sbrpos.rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

include '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $conn->prepare("SELECT id, name, price, stock_level, description, sku, category, supplier_id FROM products WHERE id = ?");
                if (!$stmt) {
                    throw new Exception($conn->error);
                }
                $stmt->bind_param("i", $_GET['id']);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($result->num_rows > 0) {
                    echo json_encode($result->fetch_assoc());
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Product not found."]);
                }
                $stmt->close();
            } else {
                $sql = "SELECT id, name, price, stock_level, description, sku, category, supplier_id FROM products";
                $result = $conn->query($sql);
                $products = [];
                if ($result && $result->num_rows > 0) {
                    while($row = $result->fetch_assoc()) {
                        $row['price'] = floatval($row['price'] ?? 0.00);
                        $products[] = $row;
                    }
                }
                echo json_encode($products);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if ($data === null) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid JSON data received."]);
                exit;
            }
            
            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $price = isset($data['price']) && $data['price'] !== '' ? floatval($data['price']) : 0.0;
            $stock_level = isset($data['stock_level']) && $data['stock_level'] !== '' ? intval($data['stock_level']) : 0;
            $sku_raw = trim($data['sku'] ?? '');
            $sku = ($sku_raw !== '') ? $sku_raw : null;
            $category = trim($data['category'] ?? '');
            $supplier_id = (!empty($data['supplier_id']) && is_numeric($data['supplier_id']) && intval($data['supplier_id']) > 0) ? intval($data['supplier_id']) : null;

            $cols = ["name", "description", "price", "stock_level", "category"];
            $placeholders = ["?", "?", "?", "?", "?"];
            $types = "ssdss";
            $params = [$name, $description, $price, $stock_level, $category];

            if ($sku !== null) {
                $cols[] = "sku";
                $placeholders[] = "?";
                $types .= "s";
                $params[] = $sku;
            } else {
                $cols[] = "sku";
                $placeholders[] = "NULL";
            }

            if ($supplier_id !== null) {
                $cols[] = "supplier_id";
                $placeholders[] = "?";
                $types .= "i";
                $params[] = $supplier_id;
            } else {
                $cols[] = "supplier_id";
                $placeholders[] = "NULL";
            }

            $sql = "INSERT INTO products (" . implode(", ", $cols) . ") VALUES (" . implode(", ", $placeholders) . ")";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Product created successfully.", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error: " . $stmt->error]);
            }
            $stmt->close();
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if ($data === null) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid JSON data received."]);
                exit;
            }

            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(["error" => "Product ID is missing."]);
                exit;
            }

            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $price = isset($data['price']) && $data['price'] !== '' ? floatval($data['price']) : 0.0;
            $stock_level = isset($data['stock_level']) && $data['stock_level'] !== '' ? intval($data['stock_level']) : 0;
            $sku_raw = trim($data['sku'] ?? '');
            $sku = ($sku_raw !== '') ? $sku_raw : null;
            $category = trim($data['category'] ?? '');
            $supplier_id = (!empty($data['supplier_id']) && is_numeric($data['supplier_id']) && intval($data['supplier_id']) > 0) ? intval($data['supplier_id']) : null;
            $id = intval($_GET['id']);

            $sql = "UPDATE products SET name=?, description=?, price=?, stock_level=?, category=?";
            $types = "ssdss";
            $params = [$name, $description, $price, $stock_level, $category];

            if ($sku !== null) {
                $sql .= ", sku=?";
                $types .= "s";
                $params[] = $sku;
            } else {
                $sql .= ", sku=NULL";
            }

            if ($supplier_id !== null) {
                $sql .= ", supplier_id=?";
                $types .= "i";
                $params[] = $supplier_id;
            } else {
                $sql .= ", supplier_id=NULL";
            }

            $sql .= " WHERE id=?";
            $types .= "i";
            $params[] = $id;

            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param($types, ...$params);

            if ($stmt->execute()) {
                echo json_encode(["message" => "Product updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error: " . $stmt->error]);
            }
            $stmt->close();
            break;
        
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(["error" => "Product ID is missing."]);
                exit;
            }

            $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param("i", $_GET['id']);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Product deleted successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error: " . $stmt->error]);
            }
            $stmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed."]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>