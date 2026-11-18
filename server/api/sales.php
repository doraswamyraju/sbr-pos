<?php
require_once __DIR__ . '/../cors.php';
// server/api/sales.php
// Rectified for cPanel deployment with mysqli

include '../db_connect.php';

header("Content-Type: application/json; charset=utf-8");

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

// Automatically ensure required columns exist in sales and sale_items
function ensureDatabaseSchema($conn, $dbName) {
    static $ensured = false;
    if ($ensured) return;
    $ensured = true;

    try {
        // 1. Ensure columns on sales table
        $salesCols = getTableColumns($conn, $dbName, 'sales');
        if (!empty($salesCols)) {
            if (!in_array('discount', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00");
            }
            if (!in_array('payable_amount', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `payable_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00");
            }
            if (!in_array('payment_mode', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `payment_mode` VARCHAR(50) NULL DEFAULT 'cash'");
            }
            if (!in_array('upi_id', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `upi_id` VARCHAR(100) NULL");
            }
            if (!in_array('customer_name', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `customer_name` VARCHAR(255) NULL");
            }
            if (!in_array('gst_number', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `gst_number` VARCHAR(50) NULL");
            }
            if (!in_array('updated_at', $salesCols)) {
                @$conn->query("ALTER TABLE `sales` ADD `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            }

            // Backfill zero or null payable_amount for existing sales
            @$conn->query("UPDATE `sales` SET `payable_amount` = GREATEST(0, `total_amount` - IFNULL(`discount`, 0)) WHERE (`payable_amount` IS NULL OR `payable_amount` = 0.00) AND `total_amount` > 0");
        }

        // 2. Ensure columns on sale_items table
        $itemsTable = findSaleItemsTable($conn, $dbName);
        if ($itemsTable) {
            $itemCols = getTableColumns($conn, $dbName, $itemsTable);
            if (!empty($itemCols)) {
                if (!in_array('product_name', $itemCols)) {
                    @$conn->query("ALTER TABLE `{$itemsTable}` ADD `product_name` VARCHAR(255) NULL");
                }
                if (!in_array('price', $itemCols)) {
                    @$conn->query("ALTER TABLE `{$itemsTable}` ADD `price` DECIMAL(10,2) NULL");
                }
                // Backfill price from unit_price if needed
                if (in_array('unit_price', $itemCols)) {
                    @$conn->query("UPDATE `{$itemsTable}` SET `price` = `unit_price` WHERE `price` IS NULL");
                }
                // Backfill product_name from products table if needed
                @$conn->query("UPDATE `{$itemsTable}` si JOIN `products` p ON si.product_id = p.id SET si.`product_name` = p.name WHERE si.`product_name` IS NULL OR si.`product_name` = ''");
            }
        }
    } catch (Exception $ignored) {
        // Continue even if schema alters fail (e.g. insufficient privileges)
    }
}

function fetchCompanyInfo($conn) {
    global $dbname;
    $defaults = [
        'company_name' => 'Sri Balaji Renewables',
        'address' => 'No: 240, Netaji Rd, near Railway Station, Royal Nagar, Tirupati, Andhra Pradesh 517501',
        'address_line2' => '',
        'phone_number' => '9849099800',
        'email' => 'hello@sribalajirenewables.com',
        'gstin' => '37AGQPC5310B1ZV',
        'logo_path' => null,
        'default_print_format' => 'A4'
    ];

    try {
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
    } catch (Exception $e) {
        return $defaults;
    }
}

function buildReceiptHtmlWithCompany($saleRow, $items, $company) {
    $company_name = htmlspecialchars($company['company_name'] ?? 'Sri Balaji Renewables');
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
    $idx = 1;
    foreach ($items as $it) {
        $iname = htmlspecialchars($it['product_name'] ?? $it['name'] ?? $it['title'] ?? 'Item');
        $iqty = intval($it['quantity'] ?? $it['qty'] ?? 1);
        $iprice = floatval($it['price'] ?? $it['unit_price'] ?? 0);
        $itotal = $iqty * $iprice;
        $items_html .= "<tr><td style='padding:8px;border:1px solid #e2e8f0;text-align:center'>{$idx}</td><td style='padding:8px;border:1px solid #e2e8f0'>{$iname}</td><td style='padding:8px;border:1px solid #e2e8f0;text-align:center'>{$iqty}</td><td style='padding:8px;border:1px solid #e2e8f0;text-align:right'>₹" . number_format($iprice, 2) . "</td><td style='padding:8px;border:1px solid #e2e8f0;text-align:right'>₹" . number_format($itotal, 2) . "</td></tr>";
        $idx++;
    }

    $totalVal = floatval($saleRow['total_amount'] ?? $saleRow['total'] ?? 0);
    $discountVal = floatval($saleRow['discount'] ?? 0);
    $payableVal = floatval($saleRow['payable_amount'] ?? $saleRow['payable'] ?? $saleRow['grand_total'] ?? 0);
    if ($payableVal <= 0 && $totalVal > 0) {
        $payableVal = max(0, $totalVal - $discountVal);
    }

    $total = number_format($totalVal, 2);
    $discount = number_format($discountVal, 2);
    $payable = number_format($payableVal, 2);

    $logo_html = !empty($logo_path) ? "<img src='https://pos.sribalajirenewables.com/server/{$logo_path}' alt='Company Logo' style='max-height: 80px; max-width: 150px;'/>" : "";

    $receipt = "<!doctype html><html><head><meta charset='utf-8'><title>{$invoiceType} #" . htmlspecialchars($saleRow['id'] ?? '') . "</title><style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;margin:0;padding:20px;background:#fff}.invoice-card{width:100%;max-width:800px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-sizing:border-box}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th,td{padding:10px;border:1px solid #cbd5e1}th{background:#f1f5f9;text-align:left;font-weight:700;color:#334155}.company{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2563eb;padding-bottom:16px}.company .title{font-size:24px;font-weight:800;color:#1e40af;margin:0}.company .sub{font-size:12px;color:#64748b;margin-top:4px}.inv-meta{text-align:right}.inv-id{font-size:20px;font-weight:700;color:#0f172a}.bill-to{margin-top:20px;background:#f8fafc;padding:12px;border-radius:8px;font-size:13px;border:1px solid #e2e8f0}.summary-table{margin-top:20px;width:280px;margin-left:auto;font-size:13px;border:none}.summary-table td{padding:6px 10px;text-align:right;border:none}.total-row{font-size:16px;font-weight:800;color:#1e40af;border-top:2px solid #2563eb !important}</style></head><body>";
    $receipt .= "<div class='invoice-card'><div class='company'><div>{$logo_html}<h1 class='title'>{$company_name}</h1><div class='sub'>{$address}" . ($address2 ? "<br>{$address2}" : "") . "</div><div class='sub'>Phone: {$phone}" . ($email ? " | Email: {$email}" : "") . ($gst ? " | GSTIN: {$gst}" : "") . "</div></div><div class='inv-meta'><div class='inv-id'>{$invoiceType} #" . htmlspecialchars($saleRow['id'] ?? $saleRow['sale_id'] ?? $saleRow['invoice_id'] ?? '') . "</div><div style='font-size:12px;color:#64748b;margin-top:4px'>Date: " . htmlspecialchars($saleRow['created_at'] ?? $saleRow['sale_date'] ?? date('Y-m-d H:i:s')) . "</div></div></div>";
    
    $receipt .= "<div class='bill-to'><strong>Bill To:</strong> " . htmlspecialchars($customer_name) . (!empty($customer_gst) ? "<br/><strong>GSTIN:</strong> " . htmlspecialchars($customer_gst) : "") . "</div>";
    
    $receipt .= "<table><thead><tr><th style='width:40px;text-align:center'>#</th><th>Item Description</th><th style='width:60px;text-align:center'>Qty</th><th style='width:100px;text-align:right'>Price</th><th style='width:110px;text-align:right'>Total</th></tr></thead><tbody>{$items_html}</tbody></table>";
    $receipt .= "<table class='summary-table'><tr><td>Subtotal:</td><td>₹{$total}</td></tr><tr><td>Discount:</td><td>₹{$discount}</td></tr><tr class='total-row'><td>Grand Total:</td><td>₹{$payable}</td></tr></table>";
    $receipt .= "<div style='clear:both;margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;padding-top:12px'>Thank you for your business!</div></div></body></html>";
    return $receipt;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    ensureDatabaseSchema($conn, $dbname);

    if (isset($_GET['id'])) {
        $saleId = intval($_GET['id']);
        try {
            $stmt = $conn->prepare("SELECT s.*, c.full_name as customer_full_name, c.is_gst_registered, c.gstin FROM `sales` s LEFT JOIN `customers` c ON s.customer_id = c.id WHERE s.id = ? LIMIT 1");
            $stmt->bind_param("i", $saleId);
            $stmt->execute();
            $result = $stmt->get_result();
            $saleRow = $result->fetch_assoc();
            if (!$saleRow) respond(404, ['success' => false, 'message' => 'Sale not found']);

            $saleRow['customer_name'] = $saleRow['customer_full_name'] ?? ($saleRow['customer_name'] ?? 'Walk-in Customer');
            $saleRow['gst_number'] = $saleRow['gst_number'] ?? $saleRow['gstin'];
            $saleRow['is_gst_customer'] = $saleRow['is_gst_customer'] ?? $saleRow['is_gst_registered'];

            $tot = floatval($saleRow['total_amount'] ?? $saleRow['total'] ?? 0);
            $disc = floatval($saleRow['discount'] ?? 0);
            if (!isset($saleRow['payable_amount']) || floatval($saleRow['payable_amount']) <= 0) {
                $saleRow['payable_amount'] = max(0, $tot - $disc);
            }

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
                    $hasProductNameCol = in_array('product_name', $cols);
                    $hasNameCol = in_array('name', $cols);
                    $nameExpr = "COALESCE(NULLIF(p.name, ''), 'Item')";
                    if ($hasProductNameCol && $hasNameCol) {
                        $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.product_name, ''), NULLIF(si.name, ''), 'Item')";
                    } elseif ($hasProductNameCol) {
                        $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.product_name, ''), 'Item')";
                    } elseif ($hasNameCol) {
                        $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.name, ''), 'Item')";
                    }

                    $priceExpr = "0";
                    if (in_array('price', $cols) && in_array('unit_price', $cols)) {
                        $priceExpr = "COALESCE(si.price, si.unit_price, 0)";
                    } elseif (in_array('price', $cols)) {
                        $priceExpr = "COALESCE(si.price, 0)";
                    } elseif (in_array('unit_price', $cols)) {
                        $priceExpr = "COALESCE(si.unit_price, 0)";
                    }

                    $stmtItems = $conn->prepare("SELECT si.*, {$nameExpr} as product_name, {$priceExpr} as price FROM `{$foundItemsTable}` si LEFT JOIN `products` p ON si.product_id = p.id WHERE si.`$linkCol` = ?");
                    $stmtItems->bind_param("i", $saleId);
                    $stmtItems->execute();
                    $resultItems = $stmtItems->get_result();
                    $items = $resultItems->fetch_all(MYSQLI_ASSOC);

                    foreach ($items as &$it) {
                        if (!isset($it['price']) && isset($it['unit_price'])) {
                            $it['price'] = $it['unit_price'];
                        }
                        if (!isset($it['name']) && isset($it['product_name'])) {
                            $it['name'] = $it['product_name'];
                        }
                    }
                    unset($it);
                }
            }
            respond(200, ['success' => true, 'sale' => $saleRow, 'items' => $items]);
        } catch (Exception $e) {
            respond(500, ['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        try {
            $stmt = $conn->prepare("SELECT s.*, c.full_name as customer_name FROM `sales` s LEFT JOIN `customers` c ON s.customer_id = c.id ORDER BY s.id DESC LIMIT 200");
            $stmt->execute();
            $result = $stmt->get_result();
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            foreach ($rows as &$r) {
                if (empty($r['customer_name'])) {
                    $r['customer_name'] = 'Walk-in Customer';
                }
                $t = floatval($r['total_amount'] ?? 0);
                $d = floatval($r['discount'] ?? 0);
                if (!isset($r['payable_amount']) || floatval($r['payable_amount']) <= 0) {
                    $r['payable_amount'] = max(0, $t - $d);
                }
            }
            unset($r);
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
        if (isset($data['items']) && is_string($data['items'])) {
            $tmp = json_decode($data['items'], true);
            if (is_array($tmp)) $data['items'] = $tmp;
        }
    }
    if (!is_array($data)) respond(400, ['success' => false, 'message' => 'Invalid payload']);
    
    $cartItemsList = $data['cart_items'] ?? $data['items'] ?? [];
    if (!isset($data['total_amount']) || empty($cartItemsList)) {
        respond(400, ['success' => false, 'message' => 'Missing required fields: total_amount, cart_items']);
    }
    if (!isset($data['user_id'])) {
        $data['user_id'] = 1;
    }

    $tot = floatval($data['total_amount'] ?? 0);
    $dsc = floatval($data['discount'] ?? 0);
    if (!isset($data['payable_amount']) || floatval($data['payable_amount']) <= 0) {
        $data['payable_amount'] = max(0, $tot - $dsc);
    }
    $data['discount'] = $dsc;

    ensureDatabaseSchema($conn, $dbname);

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
                } elseif (is_float($data[$payloadKey]) || is_numeric($data[$payloadKey])) {
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
            $available = [];
            foreach (['sale_id'=>['sale_id','invoice_id','order_id'],'product_id'=>['product_id','pid','item_id'],'product_name'=>['product_name','name','title'],'quantity'=>['quantity','qty','q']] as $k=>$cands) {
                foreach ($cands as $cand) {
                    foreach ($itemCols as $ic) {
                        if (strtolower($ic) === strtolower($cand)) { $available[$k] = $ic; break 2; }
                    }
                }
            }

            foreach ($cartItemsList as $it) {
                $itId = $it['product_id'] ?? $it['id'] ?? $it['pid'] ?? null;
                $itName = $it['product_name'] ?? $it['name'] ?? $it['title'] ?? 'Item';
                $itQty = intval($it['quantity'] ?? $it['qty'] ?? $it['q'] ?? 1);
                $itPrice = floatval($it['price'] ?? $it['unit_price'] ?? $it['rate'] ?? 0);

                $icols = []; $ivals = []; $iparams = []; $iParamTypes = '';
                if (isset($available['sale_id'])) { $icols[]="`{$available['sale_id']}`"; $ivals[]="?"; $iparams[]=$saleId; $iParamTypes .= 'i'; }
                if (isset($available['product_id'])) { $icols[]="`{$available['product_id']}`"; $ivals[]="?"; $iparams[]=$itId; $iParamTypes .= 'i'; }
                if (isset($available['product_name'])) { $icols[]="`{$available['product_name']}`"; $ivals[]="?"; $iparams[]=$itName; $iParamTypes .= 's'; }
                if (isset($available['quantity'])) { $icols[]="`{$available['quantity']}`"; $ivals[]="?"; $iparams[]=$itQty; $iParamTypes .= 'i'; }
                
                // Populate both unit_price and price if available
                if (in_array('unit_price', $itemCols)) {
                    $icols[] = "`unit_price`"; $ivals[] = "?"; $iparams[] = $itPrice; $iParamTypes .= 'd';
                }
                if (in_array('price', $itemCols)) {
                    $icols[] = "`price`"; $ivals[] = "?"; $iparams[] = $itPrice; $iParamTypes .= 'd';
                }
                
                if (!empty($icols)) {
                    $sqlIt = "INSERT INTO `{$foundItemsTable}` (" . implode(",", $icols) . ") VALUES (" . implode(",", $ivals) . ")";
                    $stmti = $conn->prepare($sqlIt);
                    $stmti->bind_param($iParamTypes, ...$iparams);
                    try {
                        $stmti->execute();
                        $insertedItems[] = $conn->insert_id;
                    } catch (mysqli_sql_exception $ex) {
                        if (strpos($ex->getMessage(), 'foreign key') !== false && isset($available['product_id'])) {
                            $altCols = []; $altVals = []; $altParams = []; $altTypes = '';
                            foreach ($icols as $idx => $col) {
                                if (strpos($col, $available['product_id']) === false) {
                                    $altCols[] = $col;
                                    $altVals[] = $ivals[$idx];
                                    $altParams[] = $iparams[$idx];
                                    $altTypes .= $iParamTypes[$idx];
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
                        error_log("sale items insert error: " . $ex->getMessage());
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

        if (!isset($saleRow['discount'])) {
            $saleRow['discount'] = floatval($data['discount'] ?? 0);
        }
        if (!isset($saleRow['payable_amount']) || floatval($saleRow['payable_amount']) <= 0) {
            $tAmount = floatval($saleRow['total_amount'] ?? $data['total_amount'] ?? 0);
            $dAmount = floatval($saleRow['discount'] ?? 0);
            $saleRow['payable_amount'] = max(0, $tAmount - $dAmount);
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
                $hasProductNameCol = in_array('product_name', $cols);
                $hasNameCol = in_array('name', $cols);
                $nameExpr = "COALESCE(NULLIF(p.name, ''), 'Item')";
                if ($hasProductNameCol && $hasNameCol) {
                    $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.product_name, ''), NULLIF(si.name, ''), 'Item')";
                } elseif ($hasProductNameCol) {
                    $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.product_name, ''), 'Item')";
                } elseif ($hasNameCol) {
                    $nameExpr = "COALESCE(NULLIF(p.name, ''), NULLIF(si.name, ''), 'Item')";
                }

                $priceExpr = "0";
                if (in_array('price', $cols) && in_array('unit_price', $cols)) {
                    $priceExpr = "COALESCE(si.price, si.unit_price, 0)";
                } elseif (in_array('price', $cols)) {
                    $priceExpr = "COALESCE(si.price, 0)";
                } elseif (in_array('unit_price', $cols)) {
                    $priceExpr = "COALESCE(si.unit_price, 0)";
                }

                $stmtI = $conn->prepare("SELECT si.*, {$nameExpr} as product_name, {$priceExpr} as price FROM `{$foundItemsTable}` si LEFT JOIN `products` p ON si.product_id = p.id WHERE si.`$linkCol` = ?");
                $stmtI->bind_param("i", $saleId);
                $stmtI->execute();
                $resultI = $stmtI->get_result();
                $itemsForReceipt = $resultI->fetch_all(MYSQLI_ASSOC);
            }
        }

        if (empty($itemsForReceipt)) {
            $itemsForReceipt = $cartItemsList;
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
        if ($foundItemsTable) {
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
            }
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
