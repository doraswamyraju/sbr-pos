<?php
// db_connect.php
// Updated for cPanel deployment

$servername = "localhost";
$username ="root";// "rajugda1_sbr"; // Your MySQL username from cPanel
$password = "";//"BOHPM6139n@"; // Your MySQL password from cPanel
$dbname = "pos_system";//"rajugda1_sbrpos_db"; // Your database name from cPanel

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection and handle error with a JSON response
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Database Connection Failed: " . $conn->connect_error]);
    exit();
}
?>