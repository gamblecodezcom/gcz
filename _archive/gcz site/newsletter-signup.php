<?php
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$email = trim($_POST['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

// Save to subscribers
$subscribersFile = __DIR__ . '/data/subscribers.json';
$subscribers = file_exists($subscribersFile) ? json_decode(file_get_contents($subscribersFile), true) : [];
if (!is_array($subscribers)) $subscribers = [];

// Check if already subscribed
foreach ($subscribers as $sub) {
    if (($sub['email'] ?? '') === $email) {
        echo json_encode(['ok' => false, 'error' => 'Already subscribed']);
        exit;
    }
}

// Add new subscriber
$subscribers[] = [
    'email' => $email,
    'timestamp' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'status' => 'active'
];

file_put_contents($subscribersFile, json_encode($subscribers, JSON_PRETTY_PRINT), LOCK_EX);
echo json_encode(['ok' => true, 'message' => 'Successfully subscribed']);
?>