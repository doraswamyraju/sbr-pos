<?php
// db_connect.php
// Resilient database connection supporting both Local and VPS environments

$servername = "localhost";
$dbname = "pos_system";

$conn = null;

// 1. If an untracked local config exists, use it first
if (file_exists(__DIR__ . '/db_config.php')) {
    include __DIR__ . '/db_config.php';
}

if (!$conn || $conn->connect_error) {
    // List of credentials to auto-try (local dev, VPS, cPanel)
    $credentials = [
        ['user' => 'root', 'pass' => 'BOHPM6139n@', 'db' => 'pos_system'],
        ['user' => 'root', 'pass' => '', 'db' => 'pos_system'],
        ['user' => 'rajugda1_sbr', 'pass' => 'BOHPM6139n@', 'db' => 'pos_system'],
        ['user' => 'rajugda1_sbr', 'pass' => 'BOHPM6139n@', 'db' => 'rajugda1_sbrpos_db'],
    ];

    mysqli_report(MYSQLI_REPORT_OFF);

    foreach ($credentials as $cred) {
        $testConn = @new mysqli($servername, $cred['user'], $cred['pass'], $cred['db']);
        if (!$testConn->connect_error) {
            $conn = $testConn;
            break;
        }
    }

    if (!$conn || $conn->connect_error) {
        header('Content-Type: application/json');
        http_response_code(500);
        $errMsg = $conn ? $conn->connect_error : "Unable to connect to MySQL database.";
        echo json_encode(["status" => "error", "message" => "Database Connection Failed: " . $errMsg]);
        exit();
    }
}

$conn->set_charset("utf8mb4");
?>