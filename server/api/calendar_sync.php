<?php
// C:\xampp\htdocs\pos-system\server\api\calendar_sync.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

session_start();
require_once __DIR__ . '/vendor/autoload.php';
include '../db_connect.php';

// Google Client setup
$client = new Google_Client();
$client->setApplicationName('SBR POS System');
$client->setAuthConfig(__DIR__ . '/client_secret.json');
$client->setAccessType('offline');
$client->addScope(Google_Service_Calendar::CALENDAR_EVENTS); // Use CALENDAR_EVENTS scope for event management
$client->setRedirectUri('https://rajugariventures.com/sbr-pos/server/api/calendar_sync.php');

$method = $_SERVER['REQUEST_METHOD'];

// Handle OAuth 2.0 callback
if ($method === 'GET' && isset($_GET['code'])) {
    $authCode = $_GET['code'];
    try {
        $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
        $refreshToken = $accessToken['refresh_token'] ?? null;
        
        // Assume user_id is passed in the state parameter during auth
        // For simplicity, we'll assume a hardcoded user for now.
        // In a real application, you'd retrieve the user ID from the session or a secure state token.
        $userId = 1; // Replace with actual user ID from your session management

        // Store tokens in the database
        $sql = "INSERT INTO user_google_tokens (user_id, access_token, refresh_token) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iss", $userId, $accessToken['access_token'], $refreshToken);
        $stmt->execute();
        $stmt->close();
        
        echo json_encode(["message" => "Google Calendar connected successfully."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Authentication failed: " . $e->getMessage()]);
    }
    exit();
}

// Handle POST request to create a calendar event
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $leadId = $data['lead_id'];
    $summary = $data['summary'];
    $description = $data['description'];
    $startTime = $data['start_time'];
    $endTime = $data['end_time'];
    $userId = $data['user_id'];

    // Retrieve tokens from the database for the given user
    $sql = "SELECT access_token, refresh_token FROM user_google_tokens WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $tokens = $result->fetch_assoc();
    $stmt->close();

    if (!$tokens) {
        http_response_code(401);
        echo json_encode(["error" => "User not authenticated with Google Calendar."]);
        exit();
    }

    $client->setAccessToken($tokens['access_token']);

    // Check if the token is expired and refresh it if necessary
    if ($client->isAccessTokenExpired()) {
        if ($tokens['refresh_token']) {
            $client->fetchAccessTokenWithRefreshToken($tokens['refresh_token']);
            $newAccessToken = $client->getAccessToken();

            // Update the new access token in the database
            $sql = "UPDATE user_google_tokens SET access_token = ? WHERE user_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("si", $newAccessToken['access_token'], $userId);
            $stmt->execute();
            $stmt->close();
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Refresh token is missing. Please re-authenticate."]);
            exit();
        }
    }
    
    $service = new Google_Service_Calendar($client);
    $calendarId = 'primary'; // Use primary calendar

    $event = new Google_Service_Calendar_Event([
        'summary' => $summary,
        'description' => $description,
        'start' => [
            'dateTime' => date('c', strtotime($startTime)),
            'timeZone' => 'Asia/Kolkata',
        ],
        'end' => [
            'dateTime' => date('c', strtotime($endTime)),
            'timeZone' => 'Asia/Kolkata',
        ],
        'reminders' => [
            'useDefault' => FALSE,
            'overrides' => [
                ['method' => 'email', 'minutes' => 24 * 60],
                ['method' => 'popup', 'minutes' => 10],
            ],
        ],
    ]);

    try {
        $createdEvent = $service->events->insert($calendarId, $event);
        echo json_encode(["message" => "Event created successfully.", "eventId" => $createdEvent->id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create calendar event: " . $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["message" => "Method not allowed."]);

$conn->close();
?>