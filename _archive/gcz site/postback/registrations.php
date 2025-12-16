<?php
header('Content-Type: application/json');
$input = file_get_contents('php://input');
$logFile = __DIR__ . '/../data/postback-log.json';
$logs = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
if (!is_array($logs)) $logs = [];
$logEntry = ['type' => 'registration', 'timestamp' => date('c'), 'raw_data' => $input, 'headers' => getallheaders()];
$logs[] = $logEntry;
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX);
if ($data = json_decode($input, true)) {
    $conversionsFile = __DIR__ . '/../data/conversions.json';
    $conversions = file_exists($conversionsFile) ? json_decode(file_get_contents($conversionsFile), true) : [];
    if (!is_array($conversions)) $conversions = [];
    $conversion = ['id' => $data['id'] ?? uniqid(), 'type' => 'registration', 'eventDate' => $data['eventDate'] ?? date('c'), 'affiliateClickId' => $data['affiliateClickId'] ?? '', 'offerId' => $data['offerId'] ?? '', 'dealId' => $data['dealId'] ?? '', 'countryCode' => $data['countryCode'] ?? '', 'state' => $data['state'] ?? ''];
    $conversions[] = $conversion;
    file_put_contents($conversionsFile, json_encode($conversions, JSON_PRETTY_PRINT), LOCK_EX);
}
http_response_code(200);
echo json_encode(['status' => 'ok', 'message' => 'Registration postback received']);
?>