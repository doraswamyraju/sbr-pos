<?php
// server/api/sync_sms.php
// Dedicated Endpoint for Manual & Automated Synchronization between SBR POS & SBR SMS

$allowed_origins = ['http://localhost:3000', 'https://pos.sriddha.com', 'https://sbrpos.rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

include '../db_connect.php';
/** @var mysqli $conn */
include '../sms_sync_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'status';

try {
    if ($method === 'GET') {
        if ($action === 'status') {
            // Check connectivity to SMS backend
            $url = rtrim(SMS_API_BASE_URL, '/') . '/';
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            unset($ch);

            echo json_encode([
                "status" => "ok",
                "sms_endpoint" => SMS_API_BASE_URL,
                "reachable" => ($httpCode >= 200 && $httpCode < 400),
                "http_code" => $httpCode,
                "error" => $curlErr ?: null
            ]);
        } else if ($action === 'agent_inventory') {
            $invData = fetch_agent_inventory_from_sms();
            echo json_encode($invData);
            exit;
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid action specified."]);
        }
    } else if ($method === 'POST') {
        if ($action === 'push_all') {
            $syncResult = sync_all_products_to_sms($conn);
            if (!empty($syncResult['success'])) {
                echo json_encode([
                    "status" => "success",
                    "message" => "All products successfully synchronized to SBR SMS!",
                    "details" => $syncResult
                ]);
            } else {
                echo json_encode([
                    "status" => "warning",
                    "message" => "Sync completed with status: " . ($syncResult['error'] ?? 'Check SMS backend connectivity'),
                    "details" => $syncResult
                ]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid POST action. Use action=push_all"]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
