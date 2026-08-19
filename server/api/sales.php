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

// server/api/sales.php
// Rectified for cPanel deployment with mysqli

// !! IMPORTANT: Ensure this file is in the same directory as db_connect.php,
// or update the path below accordingly.
include '../db_connect.php';

// Allowed origin for dev app and production
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
} else {
    // Fallback for other origins, consider removing this in a production environment for security.
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

function getTableColumns($conn, $dbName, $tableName) {
    try {
        $sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $dbName, $tableName);
        $stmt->execute();
        $result = $stmt->get_result();
        $columns = [];
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row['COLUMN_NAME'];
        }
        return $columns;
    } catch (Exception $e) {
        return [];
    }
}

function fetchCompanyInfo($conn) {
    global $dbname;
    $defaults = [
        'company_name' => 'Company Name',
        'address' => '',
        'address_line2' => '',
        'phone_number' => '',
        'email' => '',
        'gstin' => '',
        'logo_path' => null,
        'default_print_format' => 'A4'
    ];

    $check = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'company_info'");
    $check->bind_param("s", $dbname);
    $check->execute();
    $result = $check->get_result();
    if ($result->fetch_row()[0] <= 0) return $defaults;

    $stmt = $conn->prepare("SELECT * FROM `company_info` LIMIT 1");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    if (!$row) return $defaults;

    $out = $defaults;
    $out['company_name'] = $row['company_name'] ?? ($row['name'] ?? $out['company_name']);
    $out['address'] = $row['address'] ?? ($row['address_line1'] ?? $out['address']);
    $out['address_line2'] = $row['address_line2'] ?? '';
    $out['phone_number'] = $row['phone_number'] ?? ($row['phone'] ?? $out['phone_number']);
    $out['email'] = $row['email'] ?? $out['email'];
    $out['gstin'] = $row['gstin'] ?? ($row['gst'] ?? '');
    $out['logo_path'] = $row['logo_path'] ?? null;
    $out['default_print_format'] = $row['default_print_format'] ?? $out['default_print_format'];
    return $out;
}

function buildReceiptHtmlWithCompany($saleRow, $items, $company) {
    $company_name = htmlspecialchars($company['company_name'] ?? 'Company Name');
    $address = htmlspecialchars($company['address'] ?? '');
    $address2 = htmlspecialchars($company['address_line2'] ?? '');
    $phone = htmlspecialchars($company['phone_number'] ?? '');
    $email = htmlspecialchars($company['email'] ?? '');
    $gst = htmlspecialchars($company['gstin'] ?? '');
    $logo_path = htmlspecialchars($company['logo_path'] ?? '');
    
    $invoiceType = (isset($saleRow['is_gst_customer']) && $saleRow['is_gst_customer'] == 1 && isset($saleRow['gst_number']) && !empty($saleRow['gst_number'])) ? 'Invoice' : 'Proforma Invoice';
    $customer_name = htmlspecialchars($saleRow['customer_name'] ?? 'Walk-in Customer');
    $customer_gst = htmlspecialchars($saleRow['gst_number'] ?? '');

    $items_html = '';
    foreach ($items as $it) {
        $iname = htmlspecialchars($it['product_name'] ?? $it['name'] ?? $it['title'] ?? '');
        $iqty = intval($it['quantity'] ?? $it['qty'] ?? 1);
        $iprice = number_format(floatval($it['price'] ?? $it['unit_price'] ?? 0), 2);
        $itotal = number_format($iqty * floatval($it['price'] ?? $it['unit_price'] ?? 0), 2);
        $items_html .= "<tr><td style='padding:8px;border:1px solid #ddd'>{$iname}</td><td style='padding:8px;border:1px solid #ddd;text-align:center'>{$iqty}</td><td style='padding:8px;border:1px solid #ddd;text-align:right'>₹{$iprice}</td><td style='padding:8px;border:1px solid #ddd;text-align:right'>₹{$itotal}</td></tr>";
    }

    $total = number_format(floatval($saleRow['total_amount'] ?? $saleRow['total'] ?? 0), 2);
    $discount = number_format(floatval($saleRow['discount'] ?? 0), 2);
    $payable = number_format(floatval($saleRow['payable_amount'] ?? $saleRow['payable'] ?? $saleRow['grand_total'] ?? 0), 2);

    $logo_html = !empty($logo_path) ? "<img src='https://rajugariventures.com/sbr-pos/server/{$logo_path}' alt='Company Logo' style='max-height: 80px; max-width: 150px;'/>" : "";

    $receipt = "<!doctype html><html><head><meta charset='utf-8'><title>{$invoiceType}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:18px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:8px;border:1px solid #ddd}th{background:#f7f7f7}.company{display:flex;justify-content:space-between;align-items:flex-start}.company .left{max-width:60%}.company .right{text-align:right}.summary{float:right;width:300px;margin-top:12px}</style></head><body>";
    $receipt .= "<div class='company'><div class='left'>{$logo_html}<div style='font-weight:700;font-size:18px; margin-top: 10px;'>{$company_name}</div><div style='font-size:12px;margin-top:6px'>{$address}" . ($address2 ? "<br>{$address2}" : "") . "</div><div style='font-size:12px;margin-top:6px'>Phone: {$phone} " . ($email ? " • {$email}" : "") . "</div>" . ($gst ? "<div style='font-size:12px;margin-top:6px'>GST: {$gst}</div>" : "") . "</div><div class='right'><div><strong>{$invoiceType} #:</strong> " . htmlspecialchars($saleRow['id'] ?? $saleRow['sale_id'] ?? $saleRow['invoice_id'] ?? '') . "</div><div><strong>Date:</strong> " . htmlspecialchars($saleRow['created_at'] ?? $saleRow['sale_date'] ?? date('Y-m-d H:i:s')) . "</div></div></div>";
    
    $receipt .= "<div style='margin-top:16px;'><strong>Bill To:</strong><br/><div>{$customer_name}</div>" . (!empty($customer_gst) ? "<div>GSTIN: {$customer_gst}</div>" : "") . "</div>";
    
    $receipt .= "<table><thead><tr><th>Item</th><th style='width:80px'>Qty</th><th style='width:120px;text-align:right'>Rate</th><th style='width:120px;text-align:right'>Total</th></tr></thead><tbody>{$items_html}</tbody></table>";
    $receipt .= "<div class='summary'><table><tr><td>Subtotal</td><td style='text-align:right'>₹{$total}</td></tr><tr><td>Discount</td><td style='text-align:right'>₹{$discount}</td></tr><tr><td><strong>Payable</strong></td><td style='text-align:right'><strong>₹{$payable}</strong></td></tr></table></div>";
    $receipt .= "<div style='clear:both;margin-top:40px;text-align:center;color:#666'>Thank you for your business!</div></body></html>";
    return $receipt;
}

$method = $_SERVER['REQUEST_METHOD'];

// A helper function to find the correct sale items table name
function findSaleItemsTable($conn, $dbName) {
    $candidateItemTables = ['sale_items','sale_item','items','sale_details','sales_items'];
    foreach ($candidateItemTables as $t) {
        $sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $dbName, $t);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->fetch_row()[0] > 0) {
            return $t;
        }
    }
    return null;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $saleId = intval($_GET['id']);
        try {
            $stmt = $conn->prepare("SELECT s.*, c.full_name as customer_full_name, c.is_gst_registered, c.gstin FROM `sales` s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ? LIMIT 1");
            $stmt->bind_param("i", $saleId);
            $stmt->execute();
            $result = $stmt->get_result();
            $saleRow = $result->fetch_assoc();
            if (!$saleRow) respond(404, ['success' => false, 'message' => 'Sale not found']);

            $saleRow['customer_name'] = $saleRow['customer_full_name'] ?? 'Walk-in Customer';
            $saleRow['gst_number'] = $saleRow['gstin'];
            $saleRow['is_gst_customer'] = $saleRow['is_gst_registered'];

            $foundItemsTable = findSaleItemsTable($conn, $dbname);
            $items = [];
            if ($foundItemsTable) {
                $cols = getTableColumns($conn, $dbname, $foundItemsTable);
                $linkCol = null;
                foreach (['sale_id','invoice_id','order_id'] as $cand) {
                    foreach ($cols as $c) {
                        if (strtolower($c) === strtolower($cand)) { $linkCol = $c; break 2; }
                    }
                }
                if ($linkCol) {
                    $stmtItems = $conn->prepare("SELECT si.*, p.name as product_name FROM `{$foundItemsTable}` si JOIN `products` p ON si.product_id = p.id WHERE `$linkCol` = ?");
                    $stmtItems->bind_param("i", $saleId);
                    $stmtItems->execute();
                    $resultItems = $stmtItems->get_result();
                    $items = $resultItems->fetch_all(MYSQLI_ASSOC);
                }
            }
            respond(200, ['success' => true, 'sale' => $saleRow, 'items' => $items]);
        } catch (Exception $e) {
            respond(500, ['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        try {
            $stmt = $conn->prepare("SELECT s.*, c.full_name as customer_name FROM `sales` s LEFT JOIN `customers` c ON s.customer_id = c.id ORDER BY id DESC LIMIT 200");
            $stmt->execute();
            $result = $stmt->get_result();
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            respond(200, ['success' => true, 'data' => $rows]);
        } catch (Exception $e) {
            respond(500, ['success' => false, 'message' => $e->getMessage()]);
        }
    }
} elseif ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = $_POST;
        if (isset($data['cart_items']) && is_string($data['cart_items'])) {
            $tmp = json_decode($data['cart_items'], true);
            if (is_array($tmp)) $data['cart_items'] = $tmp;
        }
    }
    if (!is_array($data)) respond(400, ['success' => false, 'message' => 'Invalid payload']);
    if (!isset($data['user_id']) || !isset($data['total_amount']) || !isset($data['cart_items'])) {
        respond(400, ['success' => false, 'message' => 'Missing required fields: user_id, total_amount, cart_items']);
    }

    try {
        $conn->begin_transaction();
        $salesTable = 'sales';
        $salesCols = getTableColumns($conn, $dbname, $salesTable);

        $candidates = [
            'user_id' => ['user_id','userid','user'],
            'customer_id' => ['customer_id','customerid','customer'],
            'customer_name' => ['customer_name','customer','name'],
            'total_amount' => ['total_amount','total','amount'],
            'discount' => ['discount','discount_amount','discount_value'],
            'payable_amount' => ['payable_amount','payable','grand_total'],
            'payment_mode' => ['payment_mode','mode'],
            'upi_id' => ['upi_id','upi'],
            'is_gst_customer' => ['is_gst_customer','gst_registered'],
            'gst_number' => ['gst_number','gst']
        ];

        $insertCols = [];
        $insertVals = [];
        $paramTypes = '';
        $paramValues = [];

        foreach ($candidates as $payloadKey => $cands) {
            $found = null;
            foreach ($cands as $cand) {
                foreach ($salesCols as $sc) {
                    if (strtolower($sc) === strtolower($cand)) { $found = $sc; break 2; }
                }
            }
            if ($found && isset($data[$payloadKey])) {
                $insertCols[] = "`$found`";
                $insertVals[] = "?";
                $paramValues[] = $data[$payloadKey];
                // Guess param type
                if (is_int($data[$payloadKey])) {
                    $paramTypes .= 'i';
                } elseif (is_float($data[$payloadKey])) {
                    $paramTypes .= 'd';
                } else {
                    $paramTypes .= 's';
                }
            }
        }

        if (empty($insertCols)) {
            if (in_array('total_amount', $salesCols) && isset($data['total_amount'])) {
                $insertCols[] = "`total_amount`";
                $insertVals[] = "?";
                $paramValues[] = $data['total_amount'];
                $paramTypes .= 'd';
            } else {
                $conn->rollback();
                respond(500, ['success' => false, 'message' => 'Cannot map sales columns for insert.']);
            }
        }

        $sql = "INSERT INTO `$salesTable` (" . implode(",", $insertCols) . ") VALUES (" . implode(",", $insertVals) . ")";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($paramTypes, ...$paramValues);
        $stmt->execute();
        $saleId = $conn->insert_id;

        $foundItemsTable = findSaleItemsTable($conn, $dbname);

        $insertedItems = [];
        if ($foundItemsTable) {
            $itemCols = getTableColumns($conn, $dbname, $foundItemsTable);
            $map = ['sale_id'=>['sale_id','invoice_id','order_id'],'product_id'=>['product_id','pid','item_id'],'product_name'=>['product_name','name','title'],'quantity'=>['quantity','qty','q'],'price'=>['price','unit_price','rate']];
            $available = [];
            foreach ($map as $k=>$cands) {
                foreach ($cands as $cand) {
                    foreach ($itemCols as $ic) {
                        if (strtolower($ic) === strtolower($cand)) { $available[$k] = $ic; break 2; }
                    }
                }
            }

            foreach ($data['cart_items'] as $it) {
                $icols = []; $ivals = []; $iparams = []; $paramTypes = '';
                if (isset($available['sale_id'])) { $icols[]="`{$available['sale_id']}`"; $ivals[]="?"; $iparams[]=$saleId; $paramTypes .= 'i'; }
                if (isset($available['product_id'])) { $icols[]="`{$available['product_id']}`"; $ivals[]="?"; $iparams[]=$it['id'] ?? null; $paramTypes .= 'i'; }
                if (isset($available['product_name'])) { $icols[]="`{$available['product_name']}`"; $ivals[]="?"; $iparams[]=$it['name'] ?? ''; $paramTypes .= 's'; }
                if (isset($available['quantity'])) { $icols[]="`{$available['quantity']}`"; $ivals[]="?"; $iparams[]=intval($it['quantity'] ?? 1); $paramTypes .= 'i'; }
                if (isset($available['price'])) { $icols[]="`{$available['price']}`"; $ivals[]="?"; $iparams[]=floatval($it['price'] ?? 0); $paramTypes .= 'd'; }
                
                if (!empty($icols)) {
                    $sqlIt = "INSERT INTO `{$foundItemsTable}` (" . implode(",", $icols) . ") VALUES (" . implode(",", $ivals) . ")";
                    $stmti = $conn->prepare($sqlIt);
                    $stmti->bind_param($paramTypes, ...$iparams);
                    try {
                        $stmti->execute();
                        $insertedItems[] = $conn->insert_id;
                    } catch (mysqli_sql_exception $ex) {
                        if (strpos($ex->getMessage(), 'foreign key') !== false) {
                            if (isset($available['product_id'])) {
                                $altCols = []; $altVals = []; $altParams = []; $altTypes = '';
                                foreach ($icols as $idx => $col) {
                                    if (strpos($col, $available['product_id']) === false) {
                                        $altCols[] = $col;
                                        $altVals[] = $ivals[$idx];
                                        $altParams[] = $iparams[$idx];
                                        $altTypes .= $paramTypes[$idx];
                                    }
                                }
                                try {
                                    if (!empty($altCols)) {
                                        $sqlAlt = "INSERT INTO `{$foundItemsTable}` (" . implode(",", $altCols) . ") VALUES (" . implode(",", $altVals) . ")";
                                        $stmtAlt = $conn->prepare($sqlAlt);
                                        $stmtAlt->bind_param($altTypes, ...$altParams);
                                        $stmtAlt->execute();
                                        $insertedItems[] = $conn->insert_id;
                                        continue;
                                    }
                                } catch (mysqli_sql_exception $innerEx) {
                                    error_log("sale items alternate insert failed: " . $innerEx->getMessage());
                                }
                            }
                        }
                        error_log("sale items insert error: " . $ex->getMessage());
                        continue;
                    }
                }
            }
        }

        $conn->commit();

        $stmt = $conn->prepare("SELECT s.*, c.full_name as customer_name, c.gstin, c.is_gst_registered FROM `sales` s LEFT JOIN `customers` c ON s.customer_id = c.id WHERE s.id = ? LIMIT 1");
        $stmt->bind_param("i", $saleId);
        $stmt->execute();
        $result = $stmt->get_result();
        $saleRow = $result->fetch_assoc();
        
        if (empty($saleRow['customer_name'])) {
            $saleRow['customer_name'] = $data['customer_name'] ?? 'Walk-in Customer';
        }
        
        if (empty($saleRow['gstin'])) {
            $saleRow['gstin'] = $data['gst_number'] ?? null;
        }

        $itemsForReceipt = [];
        if ($foundItemsTable) {
            $cols = getTableColumns($conn, $dbname, $foundItemsTable);
            $linkCol = null;
            foreach (['sale_id','invoice_id','order_id'] as $cand) {
                foreach ($cols as $c) {
                    if (strtolower($c) === strtolower($cand)) { $linkCol = $c; break 2; }
                }
            }
            if ($linkCol) {
                $stmtI = $conn->prepare("SELECT si.*, p.name as product_name FROM `{$foundItemsTable}` si JOIN `products` p ON si.product_id = p.id WHERE `$linkCol` = ?");
                $stmtI->bind_param("i", $saleId);
                $stmtI->execute();
                $resultI = $stmtI->get_result();
                $itemsForReceipt = $resultI->fetch_all(MYSQLI_ASSOC);
            }
        }
        
        $company = fetchCompanyInfo($conn);
        $receipt_html = buildReceiptHtmlWithCompany($saleRow, $itemsForReceipt, $company);

        respond(200, ['success'=>true, 'sale'=>$saleRow, 'items'=>$itemsForReceipt, 'receipt_html'=>$receipt_html]);
    } catch (Exception $e) {
        $conn->rollback();
        respond(500, ['success'=>false,'message'=>$e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        respond(400, ['success' => false, 'message' => 'Sale ID is required for deletion.']);
    }

    try {
        $conn->begin_transaction();

        $foundItemsTable = findSaleItemsTable($conn, $dbname);
        if (!$foundItemsTable) {
             throw new Exception("Could not find a valid sale items table for deletion.");
        }

        $linkCol = null;
        $cols = getTableColumns($conn, $dbname, $foundItemsTable);
        foreach (['sale_id','invoice_id','order_id'] as $cand) {
            foreach ($cols as $c) {
                if (strtolower($c) === strtolower($cand)) { $linkCol = $c; break 2; }
            }
        }

        if ($linkCol) {
            $stmt = $conn->prepare("DELETE FROM `{$foundItemsTable}` WHERE `{$linkCol}` = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
        } else {
            throw new Exception("Could not determine linking column for sale items table.");
        }
        
        $stmt = $conn->prepare("DELETE FROM `sales` WHERE `id` = ?");
        $stmt->bind_param("i", $id);
            $stmt->execute();

        $conn->commit();
        respond(200, ['success' => true, 'message' => 'Sale deleted successfully.']);

    } catch (Exception $e) {
        $conn->rollback();
        respond(500, ['success' => false, 'message' => 'Failed to delete sale: ' . $e->getMessage()]);
    }

} else {
    respond(405, ['success'=>false,'message'=>'Method not allowed']);
}
?>