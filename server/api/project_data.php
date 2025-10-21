<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle pre-flight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$servername = "localhost";
$username = "root";
$password = ""; 
$dbname = "pos_system";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$action = $_GET['action'] ?? '';
$projectId = $_GET['projectId'] ?? null;

if (!$projectId) {
    http_response_code(400);
    echo json_encode(["error" => "Project ID is required."]);
    exit();
}

switch ($action) {
    case 'getTaskProgress':
        // Query to get task progress counts
        $sql = "SELECT 
                    SUM(CASE WHEN progress = 0 THEN 1 ELSE 0 END) AS not_started,
                    SUM(CASE WHEN progress > 0 AND progress < 100 THEN 1 ELSE 0 END) AS in_progress,
                    SUM(CASE WHEN progress = 100 THEN 1 ELSE 0 END) AS completed,
                    COUNT(*) AS total_tasks
                FROM tasks
                WHERE project_id = ? AND parent_id IS NULL"; // Changed projectId to project_id and parentId to parent_id
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $projectId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        
        echo json_encode($data);
        break;

    case 'getFinancialData':
        // Query to get financial data
        $sql = "SELECT
                    (SELECT SUM(amount) FROM expenses WHERE project_id = ?) AS totalExpense,
                    (SELECT SUM(total_amount) FROM sales_invoices WHERE project_id = ?) AS totalSalesInvoice,
                    (SELECT SUM(boq_value) FROM boq_items WHERE project_id = ?) AS totalBOQValue";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $projectId, $projectId, $projectId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        
        echo json_encode($data);
        break;

    case 'getExpenseData':
        // Query to get expenses by type (you might need to adjust based on your schema)
        // Assuming your expenses table has an 'expense_type' or similar column
        $sql = "SELECT
                    SUM(CASE WHEN expense_type = 'material' THEN amount ELSE 0 END) AS material,
                    SUM(CASE WHEN expense_type = 'salary' THEN amount ELSE 0 END) AS salary,
                    SUM(CASE WHEN expense_type = 'debt_note' THEN amount ELSE 0 END) AS debtNote,
                    SUM(CASE WHEN expense_type = 'site_expenses' THEN amount ELSE 0 END) AS siteExpenses,
                    SUM(CASE WHEN expense_type = 'subcon_expenses' THEN amount ELSE 0 END) AS subconExpenses
                FROM expenses
                WHERE project_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $projectId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        
        echo json_encode($data);
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid action specified."]);
        break;
}

$conn->close();
?>