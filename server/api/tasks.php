<?php
// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle pre-flight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Database connection
$servername = "localhost";
$username = "root";
$password = ""; // Your database password
$dbname = "pos_system"; // Your database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Function to recursively nest subtasks
function nestSubtasks(&$tasks, $subtasks) {
    foreach ($tasks as &$task) {
        if (isset($subtasks[$task['id']])) {
            $task['subtasks'] = $subtasks[$task['id']];
            nestSubtasks($task['subtasks'], $subtasks);
        } else {
            $task['subtasks'] = [];
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $projectId = isset($_GET['projectId']) ? $conn->real_escape_string($_GET['projectId']) : null;
        $id = isset($_GET['id']) ? $conn->real_escape_string($_GET['id']) : null;
        $getStatuses = isset($_GET['statuses']) ? true : false; // New flag for statuses

        if ($getStatuses) {
            $sql = "SELECT DISTINCT progress FROM tasks ORDER BY progress";
            $result = $conn->query($sql);
            if ($result) {
                $statuses = [];
                while ($row = $result->fetch_assoc()) {
                    $statuses[] = $row['progress'];
                }
                echo json_encode($statuses);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Database query failed: " . $conn->error]);
            }
            break;
        }
        
        if ($id) {
            $sql = "SELECT * FROM tasks WHERE id = '$id'";
            $result = $conn->query($sql);
            if ($result) {
                if ($result->num_rows > 0) {
                    echo json_encode($result->fetch_assoc());
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Task not found."]);
                }
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Database query failed: " . $conn->error]);
            }
        } elseif ($projectId) {
            $sql = "SELECT * FROM tasks WHERE project_id = '$projectId' ORDER BY parent_id, id";
            $result = $conn->query($sql);
            if ($result) {
                $tasks = [];
                $subtasks = [];
                
                if ($result->num_rows > 0) {
                    while ($row = $result->fetch_assoc()) {
                        if ($row['parent_id'] !== null) {
                            $subtasks[$row['parent_id']][] = $row;
                        } else {
                            $tasks[] = $row;
                        }
                    }
                }
                
                nestSubtasks($tasks, $subtasks);
                
                echo json_encode($tasks);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Database query failed: " . $conn->error]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Project ID is required."]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            $projectId = $conn->real_escape_string($data['projectId']);
            $parentId = isset($data['parentId']) && $data['parentId'] !== '' ? $conn->real_escape_string($data['parentId']) : null;
            $name = $conn->real_escape_string($data['name']);
            $duration = $conn->real_escape_string($data['duration']);
            $startDate = $conn->real_escape_string($data['startDate']);
            $endDate = $conn->real_escape_string($data['endDate']);
            $estQuantity = $conn->real_escape_string($data['estQuantity']);
            $unit = $conn->real_escape_string($data['unit']);
            $assignedTo = $conn->real_escape_string($data['assignedTo']);
            $progress = $conn->real_escape_string($data['progress']); // Include progress
            
            $stmt = $conn->prepare("INSERT INTO tasks (project_id, parent_id, name, duration, start_date, end_date, est_quantity, unit, assigned_to, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("iisssssssi", $projectId, $parentId, $name, $duration, $startDate, $endDate, $estQuantity, $unit, $assignedTo, $progress);

            if ($stmt->execute()) {
                echo json_encode(["message" => "Task created successfully.", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error creating task: " . $stmt->error]);
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
            
            if (isset($data['action']) && $data['action'] === 'move_down') {
                http_response_code(200);
                echo json_encode(["message" => "Task moved down successfully."]);
                break;
            }

            if ($data) {
                $updates = [];
                $params = [];
                $types = '';

                if (isset($data['name'])) {
                    $updates[] = 'name = ?';
                    $params[] = $data['name'];
                    $types .= 's';
                }
                if (isset($data['duration'])) {
                    $updates[] = 'duration = ?';
                    $params[] = $data['duration'];
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
                if (isset($data['estQuantity'])) {
                    $updates[] = 'est_quantity = ?';
                    $params[] = $data['estQuantity'];
                    $types .= 'i';
                }
                if (isset($data['unit'])) {
                    $updates[] = 'unit = ?';
                    $params[] = $data['unit'];
                    $types .= 's';
                }
                if (isset($data['assignedTo'])) {
                    $updates[] = 'assigned_to = ?';
                    $params[] = $data['assignedTo'];
                    $types .= 's';
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

                $sql = "UPDATE tasks SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $params[] = $id;
                $types .= 'i';

                $bind_names[] = $types;
                for ($i=0; $i<count($params); $i++) {
                    $bind_name = 'bind' . $i;
                    $$bind_name = $params[$i];
                    $bind_names[] = &$$bind_name;
                }
                call_user_func_array(array($stmt, 'bind_param'), $bind_names);

                if ($stmt->execute()) {
                    echo json_encode(["message" => "Task updated successfully."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Error updating task: " . $stmt->error]);
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
            $sql = "DELETE FROM tasks WHERE id = '$id'";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(["message" => "Task deleted successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Error deleting task: " . $conn->error]);
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