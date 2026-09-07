<?php
// server/sms_sync_helper.php
// Cross-System Synchronization Helper between SBR POS (MySQL) and SBR SMS (MongoDB)

if (!defined('SMS_SYNC_TOKEN')) {
    define('SMS_SYNC_TOKEN', 'sbr_pos_sms_sync_secret_2026');
}

if (!defined('SMS_API_BASE_URL')) {
    // Check if custom config exists
    if (file_exists(__DIR__ . '/sms_config.php')) {
        include_once __DIR__ . '/sms_config.php';
    } else {
        // Fallback default SMS backend endpoint
        $defaultUrl = 'http://localhost:5000/api';
        if (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'sriddha.com') !== false || strpos($_SERVER['HTTP_HOST'], 'rajugariventures.com') !== false)) {
            $defaultUrl = 'https://api.sriddha.com/api';
        }
        define('SMS_API_BASE_URL', $defaultUrl);
    }
}

/**
 * Synchronize a single product (or deletion) to SBR SMS Backend
 *
 * @param array $productData Associative array of product fields
 * @param string $action 'upsert' or 'delete'
 * @return array Result containing success status and response
 */
function sync_single_product_to_sms($productData, $action = 'upsert') {
    $url = rtrim(SMS_API_BASE_URL, '/') . '/products/sync-from-pos';
    
    $payload = array_merge($productData, ['action' => $action]);
    $jsonData = json_encode($payload);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-pos-sync-token: ' . SMS_SYNC_TOKEN,
        'Content-Length: ' . strlen($jsonData)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3); // Fast timeout to avoid blocking POS UI
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'error' => $curlErr, 'http_code' => $httpCode];
    }

    $decoded = json_decode($response, true);
    return [
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'http_code' => $httpCode,
        'response' => $decoded ?: $response
    ];
}

/**
 * Bulk synchronize all active products from POS to SBR SMS Backend
 *
 * @param mysqli $conn Active MySQLi database connection
 * @return array Result summary of bulk sync
 */
function sync_all_products_to_sms($conn) {
    $sql = "SELECT id, name, price, stock_level, min_stock_level, description, sku, category, supplier_id FROM products";
    $result = $conn->query($sql);
    if (!$result) {
        return ['success' => false, 'error' => $conn->error];
    }

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = [
            'id' => intval($row['id']),
            'pos_product_id' => intval($row['id']),
            'name' => $row['name'],
            'price' => floatval($row['price'] ?? 0),
            'stock_level' => intval($row['stock_level'] ?? 0),
            'min_stock_level' => intval($row['min_stock_level'] ?? 0),
            'description' => $row['description'] ?? '',
            'sku' => $row['sku'] ?? '',
            'category' => $row['category'] ?? 'General'
        ];
    }

    if (empty($products)) {
        return ['success' => true, 'message' => 'No products found to sync.', 'count' => 0];
    }

    $url = rtrim(SMS_API_BASE_URL, '/') . '/products/sync-bulk-from-pos';
    $payload = json_encode(['products' => $products]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-pos-sync-token: ' . SMS_SYNC_TOKEN,
        'Content-Length: ' . strlen($payload)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'error' => $curlErr, 'http_code' => $httpCode];
    }

    $decoded = json_decode($response, true);
    return [
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'http_code' => $httpCode,
        'response' => $decoded ?: $response,
        'total_sent' => count($products)
    ];
}
?>
