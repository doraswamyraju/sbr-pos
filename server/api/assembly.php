<?php
// server/api/assembly.php
// Packing List (Bill of Materials) & Finished Product Assembly API

$allowed_origins = ['http://localhost:3000', 'https://pos.sriddha.com', 'https://sbrpos.rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
include '../db_connect.php';
/** @var mysqli $conn */
include_once '../sms_sync_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'logs') {
                // Get assembly history logs
                $sql = "SELECT al.id, al.finished_product_id, p.name AS finished_product_name, p.sku AS finished_product_sku,
                               al.quantity_assembled, al.assembled_by_user_id, u.full_name AS assembled_by_name,
                               al.notes, al.created_at
                        FROM assembly_logs al
                        LEFT JOIN products p ON al.finished_product_id = p.id
                        LEFT JOIN users u ON al.assembled_by_user_id = u.id
                        ORDER BY al.created_at DESC LIMIT 100";
                $result = $conn->query($sql);
                $logs = [];
                if ($result && $result->num_rows > 0) {
                    while ($row = $result->fetch_assoc()) {
                        $logs[] = $row;
                    }
                }
                echo json_encode($logs);
                exit;
            }

            if ($action === 'get_bom' && isset($_GET['product_id'])) {
                $productId = intval($_GET['product_id']);
                
                // Get product info
                $pStmt = $conn->prepare("SELECT id, name, sku, category, price, stock_level, min_stock_level FROM products WHERE id = ?");
                $pStmt->bind_param("i", $productId);
                $pStmt->execute();
                $pRes = $pStmt->get_result();
                $product = $pRes->fetch_assoc();
                $pStmt->close();

                if (!$product) {
                    http_response_code(404);
                    echo json_encode(["error" => "Product not found."]);
                    exit;
                }

                // Get components
                $sql = "SELECT b.id AS bom_id, b.component_product_id, b.quantity AS required_qty,
                               p.name AS component_name, p.sku AS component_sku, p.category AS component_category,
                               p.stock_level AS current_stock, p.price AS component_price
                        FROM product_bom b
                        JOIN products p ON b.component_product_id = p.id
                        WHERE b.finished_product_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $productId);
                $stmt->execute();
                $res = $stmt->get_result();
                
                $components = [];
                $maxProducible = PHP_INT_MAX;

                while ($row = $res->fetch_assoc()) {
                    $row['required_qty'] = floatval($row['required_qty']);
                    $row['current_stock'] = intval($row['current_stock']);
                    $row['component_price'] = floatval($row['component_price']);
                    
                    if ($row['required_qty'] > 0) {
                        $producibleForThis = floor($row['current_stock'] / $row['required_qty']);
                        if ($producibleForThis < $maxProducible) {
                            $maxProducible = $producibleForThis;
                        }
                    }
                    $components[] = $row;
                }
                $stmt->close();

                if (count($components) === 0) {
                    $maxProducible = 0;
                } else if ($maxProducible === PHP_INT_MAX) {
                    $maxProducible = 0;
                }

                echo json_encode([
                    "product" => $product,
                    "components" => $components,
                    "max_producible_units" => max(0, intval($maxProducible))
                ]);
                exit;
            }

            // Default GET: List all products that have a BOM defined, or all finished goods
            $sql = "SELECT p.id, p.name, p.sku, p.category, p.price, p.stock_level, p.min_stock_level,
                           COUNT(b.id) AS component_count
                    FROM products p
                    INNER JOIN product_bom b ON p.id = b.finished_product_id
                    GROUP BY p.id
                    ORDER BY p.name ASC";
            $result = $conn->query($sql);
            $boms = [];

            if ($result && $result->num_rows > 0) {
                while ($p = $result->fetch_assoc()) {
                    $pId = intval($p['id']);
                    // Calculate max producible units
                    $cSql = "SELECT b.quantity AS required_qty, p2.stock_level AS current_stock
                             FROM product_bom b
                             JOIN products p2 ON b.component_product_id = p2.id
                             WHERE b.finished_product_id = $pId";
                    $cRes = $conn->query($cSql);
                    $maxProducible = PHP_INT_MAX;
                    $compCount = 0;

                    if ($cRes && $cRes->num_rows > 0) {
                        while ($crow = $cRes->fetch_assoc()) {
                            $compCount++;
                            $req = floatval($crow['required_qty']);
                            $cur = intval($crow['current_stock']);
                            if ($req > 0) {
                                $canMake = floor($cur / $req);
                                if ($canMake < $maxProducible) {
                                    $maxProducible = $canMake;
                                }
                            }
                        }
                    }

                    if ($compCount === 0 || $maxProducible === PHP_INT_MAX) {
                        $maxProducible = 0;
                    }

                    $p['max_producible_units'] = max(0, intval($maxProducible));
                    $boms[] = $p;
                }
            }

            echo json_encode($boms);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if ($data === null) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid JSON payload."]);
                exit;
            }

            // Action 1: Save / Update BOM recipe for a finished product
            if ($action === 'save_bom') {
                $finishedProductId = intval($data['finished_product_id'] ?? 0);
                $components = $data['components'] ?? [];

                if ($finishedProductId <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid finished product ID."]);
                    exit;
                }

                $conn->begin_transaction();
                try {
                    // Delete existing BOM components
                    $delStmt = $conn->prepare("DELETE FROM product_bom WHERE finished_product_id = ?");
                    $delStmt->bind_param("i", $finishedProductId);
                    $delStmt->execute();
                    $delStmt->close();

                    // Insert new BOM components
                    if (!empty($components) && is_array($components)) {
                        $insStmt = $conn->prepare("INSERT INTO product_bom (finished_product_id, component_product_id, quantity) VALUES (?, ?, ?)");
                        foreach ($components as $comp) {
                            $compId = intval($comp['component_product_id'] ?? 0);
                            $qty = floatval($comp['quantity'] ?? 1);
                            if ($compId > 0 && $qty > 0 && $compId !== $finishedProductId) {
                                $insStmt->bind_param("iid", $finishedProductId, $compId, $qty);
                                $insStmt->execute();
                            }
                        }
                        $insStmt->close();
                    }

                    $conn->commit();
                    echo json_encode(["status" => "success", "message" => "BOM recipe updated successfully."]);
                } catch (Throwable $e) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to save BOM: " . $e->getMessage()]);
                }
                exit;
            }

            // Action 2: Execute Assembly (Produce finished product from components)
            if ($action === 'assemble') {
                $finishedProductId = intval($data['finished_product_id'] ?? 0);
                $quantityToAssemble = intval($data['quantity'] ?? 0);
                $userId = !empty($data['user_id']) ? intval($data['user_id']) : null;
                $notes = trim($data['notes'] ?? '');

                if ($finishedProductId <= 0 || $quantityToAssemble <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid product ID or quantity to assemble."]);
                    exit;
                }

                $conn->begin_transaction();
                try {
                    // Fetch required BOM components with FOR UPDATE lock
                    $sql = "SELECT b.component_product_id, b.quantity AS required_per_unit,
                                   p.name AS component_name, p.stock_level AS current_stock
                            FROM product_bom b
                            JOIN products p ON b.component_product_id = p.id
                            WHERE b.finished_product_id = ?
                            FOR UPDATE";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $finishedProductId);
                    $stmt->execute();
                    $result = $stmt->get_result();

                    $shortages = [];
                    $componentsToDeduct = [];

                    if ($result->num_rows === 0) {
                        throw new Exception("No BOM recipe found for this product. Please configure its Packing List first.");
                    }

                    while ($row = $result->fetch_assoc()) {
                        $requiredTotal = floatval($row['required_per_unit']) * $quantityToAssemble;
                        $currentStock = intval($row['current_stock']);

                        if ($currentStock < $requiredTotal) {
                            $shortages[] = [
                                "component" => $row['component_name'],
                                "required" => $requiredTotal,
                                "available" => $currentStock,
                                "shortage" => ($requiredTotal - $currentStock)
                            ];
                        }

                        $componentsToDeduct[] = [
                            "id" => intval($row['component_product_id']),
                            "deduct_amount" => $requiredTotal
                        ];
                    }
                    $stmt->close();

                    if (!empty($shortages)) {
                        $conn->rollback();
                        http_response_code(400);
                        echo json_encode([
                            "error" => "Insufficient component inventory to assemble $quantityToAssemble units.",
                            "shortages" => $shortages
                        ]);
                        exit;
                    }

                    // Deduct each component from products stock
                    $deductStmt = $conn->prepare("UPDATE products SET stock_level = stock_level - ? WHERE id = ?");
                    foreach ($componentsToDeduct as $item) {
                        $deductQty = intval($item['deduct_amount']);
                        $deductId = $item['id'];
                        $deductStmt->bind_param("ii", $deductQty, $deductId);
                        $deductStmt->execute();
                    }
                    $deductStmt->close();

                    // Increment finished product stock
                    $incStmt = $conn->prepare("UPDATE products SET stock_level = stock_level + ? WHERE id = ?");
                    $incStmt->bind_param("ii", $quantityToAssemble, $finishedProductId);
                    $incStmt->execute();
                    $incStmt->close();

                    // Record assembly log
                    $logStmt = $conn->prepare("INSERT INTO assembly_logs (finished_product_id, quantity_assembled, assembled_by_user_id, notes) VALUES (?, ?, ?, ?)");
                    $logStmt->bind_param("iiis", $finishedProductId, $quantityToAssemble, $userId, $notes);
                    $logStmt->execute();
                    $logStmt->close();

                    $conn->commit();

                    // Sync updated stock levels for finished product & all consumed components to SMS
                    $affectedIds = array_merge([$finishedProductId], array_column($componentsToDeduct, 'id'));
                    if (!empty($affectedIds)) {
                        $idList = implode(',', array_map('intval', $affectedIds));
                        $syncQuery = $conn->query("SELECT id, name, price, stock_level, min_stock_level, category, sku, description FROM products WHERE id IN ($idList)");
                        if ($syncQuery) {
                            while ($syncRow = $syncQuery->fetch_assoc()) {
                                sync_single_product_to_sms([
                                    'id' => intval($syncRow['id']),
                                    'pos_product_id' => intval($syncRow['id']),
                                    'name' => $syncRow['name'],
                                    'price' => floatval($syncRow['price'] ?? 0),
                                    'stock_level' => intval($syncRow['stock_level'] ?? 0),
                                    'min_stock_level' => intval($syncRow['min_stock_level'] ?? 0),
                                    'category' => $syncRow['category'] ?? 'General',
                                    'sku' => $syncRow['sku'] ?? '',
                                    'description' => $syncRow['description'] ?? ''
                                ], 'upsert');
                            }
                        }
                    }

                    echo json_encode([
                        "status" => "success",
                        "message" => "Successfully assembled $quantityToAssemble unit(s) of finished product.",
                        "assembled_quantity" => $quantityToAssemble
                    ]);
                } catch (Throwable $e) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(["error" => "Assembly execution failed: " . $e->getMessage()]);
                }
                exit;
            }

            http_response_code(400);
            echo json_encode(["error" => "Unknown POST action."]);
            break;

        case 'DELETE':
            // Delete BOM recipe
            if (isset($_GET['product_id'])) {
                $pId = intval($_GET['product_id']);
                $stmt = $conn->prepare("DELETE FROM product_bom WHERE finished_product_id = ?");
                $stmt->bind_param("i", $pId);
                $stmt->execute();
                $stmt->close();
                echo json_encode(["status" => "success", "message" => "BOM recipe deleted."]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Product ID is missing."]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed."]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
