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

// server/api/products.php

header('Content-Type: application/json');
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
}


// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include your database connection file
include '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Handle fetching single product by ID or all products
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT id, name, price, stock_level, description, sku, category, supplier_id FROM products WHERE id = ?");
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
            // Ensure `price` is always returned
            $sql = "SELECT id, name, price, stock_level, description, sku, category, supplier_id FROM products";
            $result = $conn->query($sql);
            $products = [];
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    // Ensure price is a valid number, defaulting to 0.00 if null
                    $row['price'] = $row['price'] ?? 0.00;
                    $products[] = $row;
                }
            }
            echo json_encode($products);
        }
        break;

    case 'POST':
        // Handle adding a new product
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data === null) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON data received."]);
            exit;
        }
        
        $name = $data['name'] ?? '';
        $description = $data['description'] ?? '';
        $price = $data['price'] ?? 0;
        $stock_level = $data['stock_level'] ?? 0;
        $sku = $data['sku'] ?? '';
        $category = $data['category'] ?? '';
        $supplier_id = $data['supplier_id'] ?? null;

        $stmt = $conn->prepare("INSERT INTO products (name, description, price, stock_level, sku, category, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
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
            echo json_encode(["message" => "Product created successfully.", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'PUT':
        // Handle updating an existing product
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

        $name = $data['name'] ?? '';
        $description = $data['description'] ?? '';
        $price = $data['price'] ?? 0;
        $stock_level = $data['stock_level'] ?? 0;
        $sku = $data['sku'] ?? '';
        $category = $data['category'] ?? '';
        $supplier_id = $data['supplier_id'] ?? null;
        $id = $_GET['id'];

        $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, stock_level=?, sku=?, category=?, supplier_id=? WHERE id=?");
        $stmt->bind_param("ssdissii", 
            $name,
            $description,
            $price,
            $stock_level,
            $sku,
            $category,
            $supplier_id,
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["message" => "Product updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $stmt->error]);
        }
        $stmt->close();
        break;
    
    case 'DELETE':
        // Handle deleting a product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Product ID is missing."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
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

$conn->close();
?>