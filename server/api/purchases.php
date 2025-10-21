<?php
// C:\xampp\htdocs\pos-system\server\api\purchases.php

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
        $sql = "SELECT * FROM purchases";
        $result = $conn->query($sql);
        $purchases = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $purchases[] = $row;
            }
        }
        echo json_encode($purchases);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $supplierId = $data['supplier_id'] ?? null;
        $items = $data['items'] ?? [];

        if (empty($items)) {
            http_response_code(400);
            echo json_encode(["error" => "No items in purchase."]);
            exit();
        }

        $conn->begin_transaction();

        try {
            // 1. Create the purchase record
            $sql = "INSERT INTO purchases (supplier_id, total_amount) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $total_amount = 0;
            $stmt->bind_param("id", $supplierId, $total_amount);
            $stmt->execute();
            $purchaseId = $conn->insert_id;
            $stmt->close();

            // 2. Add purchase items and update stock
            $total_amount = 0;
            foreach ($items as $item) {
                $productId = $item['product_id'];
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];

                // Insert into purchase_items table
                $sql = "INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iiid", $purchaseId, $productId, $quantity, $unitPrice);
                $stmt->execute();
                $stmt->close();

                // Update product stock level
                $sql = "UPDATE products SET stock_level = stock_level + ?, purchase_price = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("idi", $quantity, $unitPrice, $productId);
                $stmt->execute();
                $stmt->close();
                
                $total_amount += ($quantity * $unitPrice);
            }
            
            // 3. Update the total amount for the purchase
            $sql = "UPDATE purchases SET total_amount = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("di", $total_amount, $purchaseId);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(["message" => "Purchase recorded and inventory updated successfully.", "purchase_id" => $purchaseId]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $purchaseId = $_GET['id'];
        $items = $data['items'] ?? [];
        $supplierId = $data['supplier_id'] ?? null;

        $conn->begin_transaction();
        try {
            // Revert stock changes from the old purchase
            $oldItemsSql = "SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?";
            $stmt = $conn->prepare($oldItemsSql);
            $stmt->bind_param("i", $purchaseId);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $revertSql = "UPDATE products SET stock_level = stock_level - ? WHERE id = ?";
                $revertStmt = $conn->prepare($revertSql);
                $revertStmt->bind_param("ii", $row['quantity'], $row['product_id']);
                $revertStmt->execute();
                $revertStmt->close();
            }
            $stmt->close();

            // Delete old purchase items
            $deleteSql = "DELETE FROM purchase_items WHERE purchase_id = ?";
            $stmt = $conn->prepare($deleteSql);
            $stmt->bind_param("i", $purchaseId);
            $stmt->execute();
            $stmt->close();

            // Add new purchase items and update stock
            $total_amount = 0;
            foreach ($items as $item) {
                $productId = $item['product_id'];
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];

                $insertSql = "INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
                $insertStmt = $conn->prepare($insertSql);
                $insertStmt->bind_param("iiid", $purchaseId, $productId, $quantity, $unitPrice);
                $insertStmt->execute();
                $insertStmt->close();

                $updateSql = "UPDATE products SET stock_level = stock_level + ?, purchase_price = ? WHERE id = ?";
                $updateStmt = $conn->prepare($updateSql);
                $updateStmt->bind_param("idi", $quantity, $unitPrice, $productId);
                $updateStmt->execute();
                $updateStmt->close();
                
                $total_amount += ($quantity * $unitPrice);
            }
            
            // Update purchase record
            $updatePurchaseSql = "UPDATE purchases SET supplier_id = ?, total_amount = ? WHERE id = ?";
            $stmt = $conn->prepare($updatePurchaseSql);
            $stmt->bind_param("idi", $supplierId, $total_amount, $purchaseId);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(["message" => "Purchase updated successfully."]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $purchaseId = $_GET['id'];

        $conn->begin_transaction();
        try {
            // Revert stock changes before deleting
            $itemsSql = "SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?";
            $stmt = $conn->prepare($itemsSql);
            $stmt->bind_param("i", $purchaseId);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $revertSql = "UPDATE products SET stock_level = stock_level - ? WHERE id = ?";
                $revertStmt = $conn->prepare($revertSql);
                $revertStmt->bind_param("ii", $row['quantity'], $row['product_id']);
                $revertStmt->execute();
                $revertStmt->close();
            }
            $stmt->close();

            // Delete purchase items
            $deleteItemsSql = "DELETE FROM purchase_items WHERE purchase_id = ?";
            $stmt = $conn->prepare($deleteItemsSql);
            $stmt->bind_param("i", $purchaseId);
            $stmt->execute();
            $stmt->close();

            // Delete the purchase record
            $deletePurchaseSql = "DELETE FROM purchases WHERE id = ?";
            $stmt = $conn->prepare($deletePurchaseSql);
            $stmt->bind_param("i", $purchaseId);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(["message" => "Purchase deleted successfully."]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}

$conn->close();
?>