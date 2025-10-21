<?php
// C:\xampp\htdocs\pos-system\server\api\reports.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include '../db_connect.php';

$report_type = $_GET['type'] ?? null;

switch ($report_type) {
    case 'sales':
        // Calculate total revenue and profit from sales
        $total_revenue_sql = "SELECT SUM(total_amount) AS total_revenue FROM sales";
        $total_profit_sql = "SELECT SUM(si.quantity * (si.unit_price - p.price)) AS total_profit FROM sale_items si JOIN products p ON si.product_id = p.id";

        $total_revenue_result = $conn->query($total_revenue_sql)->fetch_assoc();
        $total_profit_result = $conn->query($total_profit_sql)->fetch_assoc();

        echo json_encode([
            'total_revenue' => floatval($total_revenue_result['total_revenue'] ?? 0),
            'total_profit' => floatval($total_profit_result['total_profit'] ?? 0)
        ]);
        break;

    case 'inventory':
        // Get low-stock items and total inventory value
        $low_stock_sql = "SELECT id, name, stock_level FROM products WHERE stock_level <= 10 ORDER BY stock_level ASC";
        $total_value_sql = "SELECT SUM(price * stock_level) AS total_value FROM products";

        $low_stock_result = $conn->query($low_stock_sql);
        $low_stock_items = [];
        if ($low_stock_result->num_rows > 0) {
            while($row = $low_stock_result->fetch_assoc()) {
                $low_stock_items[] = $row;
            }
        }

        $total_value_result = $conn->query($total_value_sql)->fetch_assoc();
        
        echo json_encode([
            'low_stock_items' => $low_stock_items,
            'total_value' => floatval($total_value_result['total_value'] ?? 0)
        ]);
        break;

    case 'leads':
        // Calculate lead conversion rate
        $total_leads_sql = "SELECT COUNT(*) AS total_leads FROM leads";
        $converted_leads_sql = "SELECT COUNT(*) AS converted_leads FROM leads WHERE status = 'Converted'";

        $total_leads_result = $conn->query($total_leads_sql)->fetch_assoc();
        $converted_leads_result = $conn->query($converted_leads_sql)->fetch_assoc();

        $total_leads = intval($total_leads_result['total_leads'] ?? 0);
        $converted_leads = intval($converted_leads_result['converted_leads'] ?? 0);
        $conversion_rate = ($total_leads > 0) ? round(($converted_leads / $total_leads) * 100, 2) : 0;

        echo json_encode([
            'total_leads' => $total_leads,
            'converted_leads' => $converted_leads,
            'conversion_rate' => $conversion_rate
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid report type."]);
        break;
}

$conn->close();
?>