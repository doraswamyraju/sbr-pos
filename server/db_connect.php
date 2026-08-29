<?php
// db_connect.php
// Resilient database connection supporting PHP 8.1+ exception handling

mysqli_report(MYSQLI_REPORT_OFF);

$servername = "localhost";
$dbname = "pos_system";
$conn = null;

// 1. If an untracked local config exists, use it first
if (file_exists(__DIR__ . '/db_config.php')) {
    try {
        include __DIR__ . '/db_config.php';
    } catch (Throwable $e) {
        // Fallback to auto-detection
    }
}

if (!$conn || $conn->connect_error) {
    $credentials = [
        ['user' => 'root', 'pass' => 'Rajugari@2026', 'db' => 'pos_system'],
        ['user' => 'root', 'pass' => 'BOHPM6139n@', 'db' => 'pos_system'],
        ['user' => 'root', 'pass' => '', 'db' => 'pos_system'],
        ['user' => 'rajugda1_sbr', 'pass' => 'BOHPM6139n@', 'db' => 'pos_system'],
        ['user' => 'rajugda1_sbr', 'pass' => 'BOHPM6139n@', 'db' => 'rajugda1_sbrpos_db']
    ];

    foreach ($credentials as $cred) {
        try {
            $testConn = new mysqli($servername, $cred['user'], $cred['pass'], $cred['db']);
            if (!$testConn->connect_error) {
                $conn = $testConn;
                break;
            }
        } catch (Throwable $e) {
            // Continue trying other credentials
        }
    }

    if (!$conn || $conn->connect_error) {
        header('Content-Type: application/json');
        http_response_code(500);
        $errMsg = $conn ? $conn->connect_error : "Unable to connect to database with configured credentials.";
        echo json_encode(["status" => "error", "message" => "Database Connection Failed: " . $errMsg]);
        exit();
    }
}

$conn->set_charset("utf8mb4");
?>