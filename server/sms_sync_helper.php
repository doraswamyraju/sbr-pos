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
        // Fallback default SMS backend endpoint on live server
        $defaultUrl = 'https://sbr.sriddha.com/api';
        if (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)) {
            $defaultUrl = 'http://localhost:5006/api';
        }
        define('SMS_API_BASE_URL', $defaultUrl);
    }
}

/**
 * Universal HTTP POST Request Helper (Supports cURL & stream context fallback)
 */
function sms_http_post($url, $payloadArray, $timeout = 15) {
    $jsonData = json_encode($payloadArray);
    $headers = [
        "Content-Type: application/json",
        "x-pos-sync-token: " . SMS_SYNC_TOKEN,
        "Content-Length: " . strlen($jsonData)
    ];

    // Method 1: cURL (Preferred when ext-curl is enabled)
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        if (PHP_VERSION_ID < 80500) { @curl_close($ch); }
        unset($ch);

        if ($curlErr) {
            return ['success' => false, 'error' => $curlErr, 'http_code' => $httpCode];
        }

        $decoded = json_decode($response, true);
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'http_code' => $httpCode,
            'response' => $decoded ?: $response
        ];
    } else {
        // Method 2: Stream Context fallback (Works natively in all PHP installations without ext-curl)
        $opts = [
            'http' => [
                'method'  => 'POST',
                'header'  => implode("\r\n", $headers),
                'content' => $jsonData,
                'timeout' => $timeout,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];
        $context  = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
        
        $httpCode = 200;
        if (isset($http_response_header) && is_array($http_response_header)) {
            if (preg_match('#HTTP/\S+\s+(\d+)#', $http_response_header[0], $matches)) {
                $httpCode = intval($matches[1]);
            }
        }

        if ($response === false) {
            $lastErr = error_get_last();
            return [
                'success' => false,
                'error' => $lastErr['message'] ?? 'Failed to connect to SMS API via stream context.',
                'http_code' => $httpCode
            ];
        }

        $decoded = json_decode($response, true);
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'http_code' => $httpCode,
            'response' => $decoded ?: $response
        ];
    }
}

/**
 * Synchronize a single product (or deletion) to SBR SMS Backend
 */
function sync_single_product_to_sms($productData, $action = 'upsert') {
    $url = rtrim(SMS_API_BASE_URL, '/') . '/products/sync-from-pos';
    $payload = array_merge($productData, ['action' => $action]);
    return sms_http_post($url, $payload, 5);
}

/**
 * Bulk synchronize all active products from POS to SBR SMS Backend
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
    $result = sms_http_post($url, ['products' => $products], 25);
    $result['total_sent'] = count($products);
    return $result;
}

/**
 * Fetch Agent Van Kit inventory from SMS Backend
 */
function fetch_agent_inventory_from_sms() {
    $url = rtrim(SMS_API_BASE_URL, '/') . '/agent-inventory/pos-summary';
    
    // cURL Method
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "x-pos-sync-token: " . SMS_SYNC_TOKEN
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        if (PHP_VERSION_ID < 80500) { @curl_close($ch); }
        unset($ch);
        
        if ($curlErr) {
            return ['success' => false, 'error' => $curlErr];
        }
        $decoded = json_decode($response, true);
        return $decoded ?: ['success' => false, 'error' => 'Invalid JSON response from SMS API'];
    } else {
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "Content-Type: application/json\r\nx-pos-sync-token: " . SMS_SYNC_TOKEN . "\r\n",
                'timeout' => 10,
                'ignore_errors' => true
            ],
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
        ];
        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return ['success' => false, 'error' => 'Failed to reach SMS API'];
        }
        $decoded = json_decode($response, true);
        return $decoded ?: ['success' => false, 'error' => 'Invalid JSON from SMS API'];
    }
}
?>
