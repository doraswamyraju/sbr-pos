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

// server/api/edit_sale.php

// Updated credentials for cPanel
$dbHost = '127.0.0.1';
$dbName = 'rajugda1_sbrpos_db';
$dbUser = 'rajugda1_sbr';
$dbPass = 'BOHPM6139n@';

$allowed_origin = 'https://rajugariventures.com';
if (isset($_SERVER['HTTP_ORIGIN'])) {
} else {
}
header("Content-Type: application/json; charset=utf-8");
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $ex) {
    respond(500, ['success' => false, 'message' => 'DB connect failed: ' . $ex->getMessage()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    respond(405, ['success' => false, 'message' => 'Method not allowed']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!isset($data['sale_id']) || !isset($data['cart_items']) || !is_array($data['cart_items'])) {
    respond(400, ['success' => false, 'message' => 'Missing required fields: sale_id, cart_items']);
}

$saleId = intval($data['sale_id']);

try {
    $pdo->beginTransaction();

    // 1. Fetch current sale and items to compare
    $stmt = $pdo->prepare("SELECT * FROM `sales` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $saleId]);
    $existingSale = $stmt->fetch();
    if (!$existingSale) {
        $pdo->rollBack();
        respond(404, ['success' => false, 'message' => 'Sale not found']);
    }

    // 2. Update the main sales record
    $totalAmount = array_reduce($data['cart_items'], function($sum, $item) {
        return $sum + (floatval($item['price'] ?? 0) * intval($item['quantity'] ?? 0));
    }, 0);
    $discount = floatval($data['discount'] ?? $existingSale['discount'] ?? 0);
    $payableAmount = $totalAmount - $discount;

    $updateSql = "UPDATE `sales` SET total_amount = ?, discount = ?, payable_amount = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $pdo->prepare($updateSql);
    $stmt->execute([$totalAmount, $discount, $payableAmount, $saleId]);

    // 3. Delete existing sale items
    $stmt = $pdo->prepare("DELETE FROM `sale_items` WHERE sale_id = ?");
    $stmt->execute([$saleId]);

    // 4. Insert new (updated) sale items
    $stmt = $pdo->prepare("INSERT INTO `sale_items` (sale_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)");
    foreach ($data['cart_items'] as $item) {
        $product_id = $item['id'] ?? null;
        $product_name = $item['name'] ?? 'Unknown Product';
        $quantity = $item['quantity'] ?? 1;
        $price = $item['price'] ?? 0;
        $stmt->execute([$saleId, $product_id, $product_name, $quantity, $price]);
    }

    $pdo->commit();
    respond(200, ['success' => true, 'message' => 'Sale updated successfully.']);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Edit sale error: " . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Failed to update sale: ' . $e->getMessage()]);
}
?>