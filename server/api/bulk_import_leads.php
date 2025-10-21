<?php
// server/api/bulk_import_leads.php
// Robust bulk import endpoint for Leads

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // local dev; tighten in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Try to locate and require common DB connector files upward in directory tree.
 * Returns array: ['found' => bool, 'file' => path|null]
 */
function find_and_require_db_file() {
    $candidates = ['config.php', 'db_connect.php', 'db.php', 'database.php', 'connect.php'];
    $base = __DIR__;
    $maxDepth = 4;
    for ($d = 0; $d <= $maxDepth; $d++) {
        foreach ($candidates as $name) {
            $path = realpath($base . str_repeat('/..', $d) . '/' . $name);
            if ($path !== false && is_file($path)) {
                try {
                    require_once $path;
                    return ['found' => true, 'file' => $path];
                } catch (Throwable $t) {
                    // continue searching if require fails
                    continue;
                }
            }
        }
    }
    // fallback: explicit server/config.php
    $explicit = realpath(dirname(__DIR__) . '/config.php');
    if ($explicit !== false && is_file($explicit)) {
        try {
            require_once $explicit;
            return ['found' => true, 'file' => $explicit];
        } catch (Throwable $t) {
            // ignore
        }
    }
    return ['found' => false, 'file' => null];
}

// Attempt to require DB connector (if present)
$dbFile = find_and_require_db_file();
$dbConnectorFound = $dbFile['found'];

// After requiring connector(s), try to discover DB handles
$pdo = null;
$mysqli_conn = null;
$foundHandle = null;

// Common variable names to check
$possiblePdoNames = ['pdo', 'db', 'dbh', 'database'];
$possibleMysqliNames = ['conn', 'mysqli', 'dbconn', 'mysql_link', 'link'];

foreach ($possiblePdoNames as $n) {
    if (isset($GLOBALS[$n]) && $GLOBALS[$n] instanceof PDO) {
        $pdo = $GLOBALS[$n];
        $foundHandle = $n;
        break;
    }
    // In some setups $db may be an object with ->pdo property
    if (isset($GLOBALS[$n]) && is_object($GLOBALS[$n]) && isset($GLOBALS[$n]->pdo) && $GLOBALS[$n]->pdo instanceof PDO) {
        $pdo = $GLOBALS[$n]->pdo;
        $foundHandle = $n . '->pdo';
        break;
    }
}

if (!$pdo) {
    foreach ($possibleMysqliNames as $n) {
        if (isset($GLOBALS[$n]) && ($GLOBALS[$n] instanceof mysqli)) {
            $mysqli_conn = $GLOBALS[$n];
            $foundHandle = $n;
            break;
        }
    }
    // some code may set $conn as mysqli object in $GLOBALS['conn']
    if (!$mysqli_conn && isset($GLOBALS['conn']) && ($GLOBALS['conn'] instanceof mysqli)) {
        $mysqli_conn = $GLOBALS['conn'];
        $foundHandle = 'conn';
    }
}

// If no handle found and no connector file, attempt to create a PDO using default local XAMPP credentials
$attemptedAutoPdo = false;
if (!$pdo && !$mysqli_conn) {
    // Try to create PDO with common local defaults
    $attemptedAutoPdo = true;
    $defaultHost = '127.0.0.1';
    $defaultDb   = 'rajugda1_sbrpos_db';
    $defaultUser = 'rajugda1_sbr';
    $defaultPass = 'BOHPM6139n@';

    try {
        $pdo = new PDO(
            "mysql:host={$defaultHost};dbname={$defaultDb};charset=utf8mb4",
            $defaultUser,
            $defaultPass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        $foundHandle = 'auto-pdo';
    } catch (PDOException $ex) {
        // leave pdo null and return clear error below
        $pdo = null;
    }
}

// Helper: get rows from JSON body or uploaded file
function get_rows_from_input() {
    // Try JSON body
    $raw = file_get_contents('php://input');
    if ($raw !== false && strlen(trim($raw)) > 0) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && isset($decoded['rows']) && is_array($decoded['rows'])) {
            return $decoded['rows'];
        }
    }

    // Fallback: file upload under 'file' key (Excel/CSV)
    if (isset($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
        $tmp = $_FILES['file']['tmp_name'];
        $name = $_FILES['file']['name'];
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if ($ext === 'csv') {
            $parsed = [];
            if (($handle = fopen($tmp, 'r')) !== false) {
                $header = fgetcsv($handle);
                if ($header === false) {
                    throw new Exception('CSV file appears empty or unreadable.');
                }
                $headerMap = array_map(function($h){ return strtolower(trim($h)); }, $header);
                while (($data = fgetcsv($handle)) !== false) {
                    $assoc = [];
                    foreach ($headerMap as $i => $h) {
                        $assoc[$h] = isset($data[$i]) ? $data[$i] : null;
                    }
                    $parsed[] = $assoc;
                }
                fclose($handle);
                return $parsed;
            } else {
                throw new Exception('Unable to open uploaded CSV file.');
            }
        }

        // XLSX fallback if PhpSpreadsheet present
        $vendor = __DIR__ . '/vendor/autoload.php';
        if (file_exists($vendor)) {
            require_once $vendor;
            try {
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
                $sheet = $spreadsheet->getActiveSheet();
                $rowsArr = $sheet->toArray(null, true, true, true);
                if (empty($rowsArr) || !isset($rowsArr[1])) {
                    throw new Exception('Spreadsheet appears empty.');
                }
                $headers = array_values($rowsArr[1]);
                $parsed = [];
                for ($r = 2; $r <= count($rowsArr); $r++) {
                    $rowData = $rowsArr[$r];
                    if (!$rowData) continue;
                    $assoc = [];
                    $colIndex = 0;
                    foreach ($headers as $colHeader) {
                        $colKey = strtolower(trim((string)$colHeader));
                        $colLetter = array_keys($rowData)[$colIndex] ?? null;
                        $assoc[$colKey] = $colLetter ? ($rowData[$colLetter] ?? null) : null;
                        $colIndex++;
                    }
                    $parsed[] = $assoc;
                }
                return $parsed;
            } catch (Throwable $ex) {
                throw new Exception('Failed to parse XLSX: ' . $ex->getMessage());
            }
        } else {
            throw new Exception('Uploaded file is not CSV and server does not have PhpSpreadsheet installed to parse XLSX.');
        }
    }

    // nothing found
    return [];
}

// Main flow
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST requests are allowed.');
    }

    // If no DB handle at this point, return a helpful error
    if (!$pdo && !$mysqli_conn) {
        $message = 'Missing DB connector. ';
        if ($dbFile['file']) {
            $message .= "A DB file was found at {$dbFile['file']} but it did not expose a usable \$pdo or mysqli connection variable.";
        } else {
            $message .= "No connector file found (server/config.php or db_connect.php).";
        }
        if ($attemptedAutoPdo) {
            $message .= " Attempted default local PDO connection but it failed (host/database/user may differ).";
        }
        // Provide guidance
        $message .= " Create server/config.php that sets up a \$pdo (PDO) or \$conn/\$mysqli (mysqli).";
        throw new Exception($message);
    }

    $rows = get_rows_from_input();
    if (!is_array($rows) || count($rows) === 0) {
        throw new Exception('No rows found in request. Send JSON { rows: [...] } or upload a CSV/XLSX file (key "file").');
    }

    // Normalize and insert rows
    $inserted = 0;
    $skipped = 0;
    $errors = [];

    // Prepare for PDO or mysqli
    $usePdo = ($pdo instanceof PDO);
    if ($usePdo) {
        $stmt = $pdo->prepare("INSERT INTO leads (date, full_name, contact_info, email, source, status, notes, address, assigned_to_user_id)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    } else {
        // mysqli: prepare statement using mysqli connection object
        // find mysqli object in globals
        $mysqli = $mysqli_conn;
        if (!$mysqli || !($mysqli instanceof mysqli)) {
            throw new Exception('No usable mysqli connection found.');
        }
        $stmt = $mysqli->prepare("INSERT INTO leads (date, full_name, contact_info, email, source, status, notes, address, assigned_to_user_id)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt === false) {
            throw new Exception('mysqli prepare failed: ' . $mysqli->error);
        }
    }

    foreach ($rows as $idx => $rawRow) {
        // Expect rawRow to be associative array; normalize keys
        if (!is_array($rawRow)) {
            $skipped++;
            $errors[] = "Row " . ($idx+1) . " skipped: invalid row format.";
            continue;
        }
        $row = [];
        foreach ($rawRow as $k => $v) {
            $key = strtolower(trim((string)$k));
            $key = str_replace(' ', '_', $key);
            $row[$key] = $v;
        }

        // Field mapping with fallbacks
        $full_name = $row['full_name'] ?? $row['name'] ?? null;
        $phone = $row['phone_number'] ?? $row['phone'] ?? $row['contact_info'] ?? $row['mobile'] ?? null;
        $email = $row['email'] ?? null;
        $source = $row['source'] ?? null;
        $notes = $row['notes'] ?? null;
        $address = $row['address'] ?? null;
        $status = $row['status'] ?? 'New';
        $assigned = $row['assigned_to_user_id'] ?? $row['assigned_to'] ?? null;
        $dateRaw = $row['date'] ?? $row['created_at'] ?? null;

        // Skip if no identity
        if (empty($full_name) && empty($email) && empty($phone)) {
            $skipped++;
            $errors[] = "Row " . ($idx+1) . " skipped: missing name/email/phone.";
            continue;
        }

        $dateNormalized = date('Y-m-d', strtotime($dateRaw ?: 'now'));
        $contact_info = $phone ?? null;

        try {
            if ($usePdo) {
                $stmt->execute([
                    $dateNormalized,
                    $full_name,
                    $contact_info,
                    $email,
                    $source,
                    $status,
                    $notes,
                    $address,
                    $assigned
                ]);
            } else {
                // mysqli bind params (s = string, i = integer)
                // assigned may be null or numeric - bind as string to be safe
                $stmt->bind_param('sssssssss',
                    $dateNormalized,
                    $full_name,
                    $contact_info,
                    $email,
                    $source,
                    $status,
                    $notes,
                    $address,
                    $assigned
                );
                if (!$stmt->execute()) {
                    throw new Exception('mysqli execute failed: ' . $stmt->error);
                }
            }
            $inserted++;
        } catch (Throwable $ex) {
            $skipped++;
            $errors[] = "Row " . ($idx+1) . " insert error: " . $ex->getMessage();
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Import finished. Inserted: {$inserted}, Skipped: {$skipped}",
        'inserted' => $inserted,
        'skipped' => $skipped,
        'errors' => $errors,
        'db_connector_file' => $dbFile['file'],
        'db_handle' => $foundHandle
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
?>