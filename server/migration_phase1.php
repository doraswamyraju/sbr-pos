<?php
// D:\SBR POS\server\migration_phase1.php
header('Content-Type: application/json');
require_once __DIR__ . '/db_connect.php';
/** @var mysqli $conn */

$results = [];

try {
    // 1. Add min_stock_level to products table if not exists
    $checkCol = $conn->query("SHOW COLUMNS FROM products LIKE 'min_stock_level'");
    if ($checkCol && $checkCol->num_rows == 0) {
        $sql = "ALTER TABLE products ADD COLUMN min_stock_level INT NOT NULL DEFAULT 0 AFTER stock_level";
        if ($conn->query($sql)) {
            $results[] = "Added 'min_stock_level' column to products table.";
        } else {
            throw new Exception("Failed to add min_stock_level: " . $conn->error);
        }
    } else {
        $results[] = "'min_stock_level' column already exists in products table.";
    }

    // 2. Create product_bom table
    $sqlBom = "CREATE TABLE IF NOT EXISTS product_bom (
        id INT AUTO_INCREMENT PRIMARY KEY,
        finished_product_id INT NOT NULL,
        component_product_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (finished_product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_combo (finished_product_id, component_product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

    if ($conn->query($sqlBom)) {
        $results[] = "Table 'product_bom' created/verified successfully.";
    } else {
        throw new Exception("Failed to create product_bom: " . $conn->error);
    }

    // 3. Create assembly_logs table
    $sqlLogs = "CREATE TABLE IF NOT EXISTS assembly_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        finished_product_id INT NOT NULL,
        quantity_assembled INT NOT NULL,
        assembled_by_user_id INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (finished_product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

    if ($conn->query($sqlLogs)) {
        $results[] = "Table 'assembly_logs' created/verified successfully.";
    } else {
        throw new Exception("Failed to create assembly_logs: " . $conn->error);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Phase 1 migration completed successfully.",
        "details" => $results
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
