<?php
// C:\xampp\htdocs\pos-system\server\api\suppliers.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM suppliers";
        $result = $conn->query($sql);
        $suppliers = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $suppliers[] = $row;
            }
        }
        echo json_encode($suppliers);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $supplier_name = $data['supplier_name'] ?? '';
        $contact_name = $data['contact_name'] ?? '';
        $phone_number = $data['phone_number'] ?? '';
        $email = $data['email'] ?? '';
        $address = $data['address'] ?? '';

        $sql = "INSERT INTO suppliers (supplier_name, contact_name, phone_number, email, address) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $supplier_name, $contact_name, $phone_number, $email, $address);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Supplier added successfully.", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'];
        $supplier_name = $data['supplier_name'] ?? '';
        $contact_name = $data['contact_name'] ?? '';
        $phone_number = $data['phone_number'] ?? '';
        $email = $data['email'] ?? '';
        $address = $data['address'] ?? '';
        
        $sql = "UPDATE suppliers SET supplier_name=?, contact_name=?, phone_number=?, email=?, address=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssi", $supplier_name, $contact_name, $phone_number, $email, $address, $id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Supplier updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $sql = "DELETE FROM suppliers WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Supplier deleted successfully."]);
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