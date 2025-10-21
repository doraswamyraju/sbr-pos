<?php
// C:\xampp\htdocs\pos-system\server\api\purchase_history.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT 
                    p.id, 
                    p.purchase_date, 
                    p.total_amount,
                    s.supplier_name,
                    GROUP_CONCAT(CONCAT(pi.quantity, 'x ', prod.name) SEPARATOR ', ') AS purchased_items
                FROM 
                    purchases p
                LEFT JOIN 
                    suppliers s ON p.supplier_id = s.id
                LEFT JOIN
                    purchase_items pi ON p.id = pi.purchase_id
                LEFT JOIN
                    products prod ON pi.product_id = prod.id
                GROUP BY
                    p.id
                ORDER BY 
                    p.purchase_date DESC";
        
        $result = $conn->query($sql);
        $purchases = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $purchases[] = $row;
            }
        }
        echo json_encode($purchases);
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}

$conn->close();
?>