<?php
// C:\\xampp\\htdocs\\pos-system\\server\\api\\customers.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db_connect.php';

function apiResponse($status, $message, $data = []) {
    echo json_encode(['status' => $status, 'message' => $message, 'data' => $data]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
        $sql = "SELECT id, full_name, phone_number, email, address, is_gst_registered, gstin, is_active FROM customers WHERE is_active = 1";
        $result = $conn->query($sql);
        $customers = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $customers[] = $row;
            }
        }
        apiResponse('success', 'Customers fetched successfully', $customers);
        break;

    case 'POST':
        $full_name = $data['full_name'] ?? '';
        $phone_number = $data['phone_number'] ?? '';
        $email = $data['email'] ?? '';
        $address = $data['address'] ?? '';
        $is_gst_registered = $data['is_gst_registered'] ?? 0;
        $gstin = $data['gstin'] ?? null;
        $is_active = 1;

        $stmt = $conn->prepare("INSERT INTO customers (full_name, phone_number, email, address, is_gst_registered, gstin, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssisi", $full_name, $phone_number, $email, $address, $is_gst_registered, $gstin, $is_active);

        if ($stmt->execute()) {
            apiResponse('success', 'Customer added successfully');
        } else {
            apiResponse('error', 'Error adding customer: ' . $stmt->error);
        }
        $stmt->close();
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            apiResponse('error', 'Customer ID is required for update.');
        }

        $set_clause = [];
        $params = [];
        $types = "";

        if (isset($data['full_name'])) {
            $set_clause[] = "full_name = ?";
            $params[] = $data['full_name'];
            $types .= "s";
        }
        if (isset($data['phone_number'])) {
            $set_clause[] = "phone_number = ?";
            $params[] = $data['phone_number'];
            $types .= "s";
        }
        if (isset($data['email'])) {
            $set_clause[] = "email = ?";
            $params[] = $data['email'];
            $types .= "s";
        }
        if (isset($data['address'])) {
            $set_clause[] = "address = ?";
            $params[] = $data['address'];
            $types .= "s";
        }
        if (isset($data['is_gst_registered'])) {
            $set_clause[] = "is_gst_registered = ?";
            $params[] = $data['is_gst_registered'];
            $types .= "i";
        }
        if (isset($data['gstin'])) {
            $set_clause[] = "gstin = ?";
            $params[] = $data['gstin'];
            $types .= "s";
        }
        if (isset($data['is_active'])) {
             $set_clause[] = "is_active = ?";
             $params[] = $data['is_active'];
             $types .= "i";
        }

        if (empty($set_clause)) {
            apiResponse('error', 'No data provided to update.');
        }

        $sql = "UPDATE customers SET " . implode(", ", $set_clause) . " WHERE id = ?";
        $params[] = $id;
        $types .= "i";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            apiResponse('success', 'Customer updated successfully');
        } else {
            apiResponse('error', 'Error updating customer: ' . $stmt->error);
        }
        $stmt->close();
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            apiResponse('error', 'Customer ID is required for deletion.');
        }

        $stmt = $conn->prepare("UPDATE customers SET is_active = 0 WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            apiResponse('success', 'Customer marked as inactive successfully');
        } else {
            apiResponse('error', 'Error marking customer as inactive: ' . $stmt->error);
        }
        $stmt->close();
        break;

    default:
        apiResponse('error', 'Unsupported request method.');
        break;
}

$conn->close();
?>