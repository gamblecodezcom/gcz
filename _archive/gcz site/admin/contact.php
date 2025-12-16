<?php
// contact-intake.php — Admin contact form handler
header('Content-Type: application/json');
require_once ".env.php";

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Sanitize inputs
$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid input']);
    exit;
}

// Paths
$dataDir     = __DIR__ . '/../data';
$contactFile = $dataDir . '/contact.json';
$liveFile    = '/var/www/admin/data/contact.json';
$queueFile   = $dataDir . '/smtp_queue.json';

// Ensure data dir exists
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

// Load existing contacts
$entries = file_exists($contactFile) ? json_decode(file_get_contents($contactFile), true) : [];
if (!is_array($entries)) $entries = [];

// Append new entry
$entry = [
    'ts'      => date('c'),
    'name'    => $name,
    'email'   => $email,
    'message' => $message,
    'ip'      => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];
$entries[] = $entry;

// Save workspace + live
file_put_contents($contactFile, json_encode($entries, JSON_PRETTY_PRINT), LOCK_EX);
if (!is_dir(dirname($liveFile))) mkdir(dirname($liveFile), 0755, true);
file_put_contents($liveFile, json_encode($entries, JSON_PRETTY_PRINT), LOCK_EX);

// Queue notification (optional)
$queue = file_exists($queueFile) ? json_decode(file_get_contents($queueFile), true) : [];
if (!is_array($queue)) $queue = [];
$queue[] = [
    'to'      => $_ENV['ADMIN_EMAIL'] ?? 'admin@gamblecodez.com',
    'subject' => "📩 New Contact Form Submission",
    'body'    => "From: {$name} <{$email}>\n\n{$message}\n\nIP: {$entry['ip']}\nTime: {$entry['ts']}"
];
file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT), LOCK_EX);

// Respond
echo json_encode(['ok' => true]);
?>