<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle pre-flight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$servername = "localhost";
$username = "root";
$password = ""; // Your database password
$dbname = "pos_system"; // Your database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Check if the projects table exists, if not, create it
$checkTable = "SHOW TABLES LIKE 'projects'";
$result = $conn->query($checkTable);
if ($result->num_rows == 0) {
    $createTableSQL = "CREATE TABLE projects (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        project_code VARCHAR(50),
        address TEXT,
        start_date DATE,
        end_date DATE,
        project_value DECIMAL(10, 2) DEFAULT 0.00,
        progress INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    if ($conn->query($createTableSQL) === TRUE) {
        // Table created successfully, you can optionally insert a sample project
        $sampleName = "Sample Project";
        $sampleAddress = "Tirupati, India";
        $sampleProjectCode = "SP-001";
        $insertSample = $conn->prepare("INSERT INTO projects (name, project_code, address, progress) VALUES (?, ?, ?, ?)");
        $sampleProgress = 50;
        $insertSample->bind_param("sssi", $sampleName, $sampleProjectCode, $sampleAddress, $sampleProgress);
        $insertSample->execute();
    } else {
        die(json_encode(["error" => "Error creating table: " . $conn->error]));
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM projects WHERE id = '$id'";
            $result = $conn->query($sql);
            if ($result->num_rows > 0) {
                echo json_encode($result->fetch_assoc());
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Project not found."]);
            }
        } else {
            $sql = "SELECT * FROM projects";
            $result = $conn->query($sql);
            $projects = [];
            while ($row = $result->fetch_assoc()) {
                $projects[] = $row;
            }
            echo json_encode($projects);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            $name = $conn->real_escape_string($data['name']);
            $project_code = $conn->real_escape_string($data['projectCode']);
            $address = $conn->real_escape_string($data['address']);
            $startDate = $conn->real_escape_string($data['startDate']);
            $endDate = $conn->real_escape_string($data['endDate']);
            $projectValue = $conn->real_escape_string($data['projectValue']);
            
            $stmt = $conn->prepare("INSERT INTO projects (name, project_code, address, start_date, end_date, project_value) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssd", $name, $project_code, $address, $startDate, $endDate, $projectValue);

            if ($stmt->execute()) {
                echo json_encode(["message" => "Project created successfully.", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error creating project: " . $stmt->error]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input."]);
        }
        break;

    case 'PUT':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            $data = json_decode(file_get_contents("php://input"), true);
            
            if ($data) {
                // Prepare a dynamic SQL query
                $updates = [];
                $params = [];
                $types = '';

                if (isset($data['name'])) {
                    $updates[] = 'name = ?';
                    $params[] = $data['name'];
                    $types .= 's';
                }
                if (isset($data['projectCode'])) {
                    $updates[] = 'project_code = ?';
                    $params[] = $data['projectCode'];
                    $types .= 's';
                }
                if (isset($data['address'])) {
                    $updates[] = 'address = ?';
                    $params[] = $data['address'];
                    $types .= 's';
                }
                if (isset($data['startDate'])) {
                    $updates[] = 'start_date = ?';
                    $params[] = $data['startDate'];
                    $types .= 's';
                }
                if (isset($data['endDate'])) {
                    $updates[] = 'end_date = ?';
                    $params[] = $data['endDate'];
                    $types .= 's';
                }
                if (isset($data['projectValue'])) {
                    $updates[] = 'project_value = ?';
                    $params[] = $data['projectValue'];
                    $types .= 'd';
                }
                if (isset($data['progress'])) {
                    $updates[] = 'progress = ?';
                    $params[] = $data['progress'];
                    $types .= 'i';
                }
                if (empty($updates)) {
                    http_response_code(400);
                    echo json_encode(["error" => "No data provided for update."]);
                    break;
                }

                $sql = "UPDATE projects SET " . implode(', ', $updates) . " WHERE id = ?";
                
                $stmt = $conn->prepare($sql);
                $params[] = $id;
                $types .= 'i';

                // Use a dynamic call to bind_param
                $bind_names[] = $types;
                for ($i=0; $i<count($params); $i++) {
                    $bind_name = 'bind' . $i;
                    $$bind_name = $params[$i];
                    $bind_names[] = &$$bind_name;
                }
                call_user_func_array(array($stmt, 'bind_param'), $bind_names);

                if ($stmt->execute()) {
                    echo json_encode(["message" => "Project updated successfully."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Error updating project: " . $stmt->error]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Invalid input."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID is required."]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "DELETE FROM projects WHERE id = '$id'";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(["message" => "Project deleted successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error deleting project: " . $conn->error]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID is required."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}

$conn->close();
?>