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
    exit(0);
}

header('Content-Type: application/json');
include '../db_connect.php';

$report_type = $_GET['type'] ?? null;

switch ($report_type) {
    case 'sales':
        $today = date('Y-m-d');
        $this_month = date('Y-m');

        // Total sales today
        $today_res = $conn->query("SELECT SUM(total_amount) AS total FROM sales WHERE DATE(sale_date) = '$today'")->fetch_assoc();
        $total_sales_today = floatval($today_res['total'] ?? 0);

        // Total monthly sales
        $month_res = $conn->query("SELECT SUM(total_amount) AS total FROM sales WHERE DATE_FORMAT(sale_date, '%Y-%m') = '$this_month'")->fetch_assoc();
        $total_sales_month = floatval($month_res['total'] ?? 0);

        // All-time revenue
        $total_revenue_res = $conn->query("SELECT SUM(total_amount) AS total_revenue FROM sales")->fetch_assoc();
        $total_revenue = floatval($total_revenue_res['total_revenue'] ?? 0);

        // Estimated profit
        $total_profit = round($total_revenue * 0.25, 2);

        // Top selling products
        $top_products = [];
        $top_res = $conn->query("
            SELECT p.name AS product_name, SUM(si.quantity) AS total_quantity_sold, SUM(si.quantity * si.unit_price) AS total_sales_val
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            GROUP BY si.product_id
            ORDER BY total_quantity_sold DESC
            LIMIT 5
        ");
        if ($top_res && $top_res->num_rows > 0) {
            while ($row = $top_res->fetch_assoc()) {
                $top_products[] = [
                    'product_name' => $row['product_name'],
                    'total_quantity_sold' => intval($row['total_quantity_sold']),
                    'total_sales_val' => floatval($row['total_sales_val'])
                ];
            }
        }

        // Daily trend for past 7 days
        $sales_trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $d_res = $conn->query("SELECT SUM(total_amount) AS daily_total FROM sales WHERE DATE(sale_date) = '$d'")->fetch_assoc();
            $sales_trend[] = [
                'date' => date('D, M j', strtotime($d)),
                'total' => floatval($d_res['daily_total'] ?? 0)
            ];
        }

        echo json_encode([
            'total_sales_today' => $total_sales_today,
            'total_sales_month' => $total_sales_month,
            'total_revenue' => $total_revenue,
            'total_profit' => $total_profit,
            'top_selling_products' => $top_products,
            'sales_trend' => $sales_trend
        ]);
        break;

    case 'inventory':
        $total_prod_res = $conn->query("SELECT COUNT(*) AS total_products, SUM(price * stock_level) AS total_value FROM products")->fetch_assoc();
        $low_stock_res = $conn->query("SELECT id, name, sku, stock_level, price FROM products WHERE stock_level <= 10 ORDER BY stock_level ASC");

        $low_stock_items = [];
        if ($low_stock_res && $low_stock_res->num_rows > 0) {
            while ($row = $low_stock_res->fetch_assoc()) {
                $low_stock_items[] = $row;
            }
        }

        echo json_encode([
            'total_products' => intval($total_prod_res['total_products'] ?? 0),
            'total_value' => floatval($total_prod_res['total_value'] ?? 0),
            'low_stock_count' => count($low_stock_items),
            'low_stock_items' => $low_stock_items
        ]);
        break;

    case 'leads':
        $total_leads_res = $conn->query("SELECT COUNT(*) AS total_leads FROM leads")->fetch_assoc();
        $converted_leads_res = $conn->query("SELECT COUNT(*) AS converted_leads FROM leads WHERE status = 'Converted'")->fetch_assoc();
        $contacted_leads_res = $conn->query("SELECT COUNT(*) AS contacted_leads FROM leads WHERE status IN ('Contacted', 'Qualified')")->fetch_assoc();

        $total_leads = intval($total_leads_res['total_leads'] ?? 0);
        $converted_leads = intval($converted_leads_res['converted_leads'] ?? 0);
        $contacted_leads = intval($contacted_leads_res['contacted_leads'] ?? 0);
        $conversion_rate = ($total_leads > 0) ? round(($converted_leads / $total_leads) * 100, 2) : 0;

        echo json_encode([
            'total_leads' => $total_leads,
            'converted_leads' => $converted_leads,
            'contacted_leads' => $contacted_leads,
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