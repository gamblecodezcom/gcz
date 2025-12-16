<?php
require_once ".env.php";
if ($_ENV["ADMIN_ID"] !== (string)($_GET["uid"] ?? '')) exit("⛔  Admin only");

$contactFile = __DIR__ . '/../data/contact.json';
$contacts = file_exists($contactFile) ? json_decode(file_get_contents($contactFile), true) : [];
if (!is_array($contacts)) $contacts = [];

// Sort by most recent first
usort($contacts, function($a, $b) {
    return strtotime($b['ts'] ?? '') - strtotime($a['ts'] ?? '');
});

$uid = htmlspecialchars($_ENV['ADMIN_ID']);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Contact Submissions</title>
    <link rel="stylesheet" href="../css/neon-dark.css">
    <style>
        body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
        table{width:100%;border-collapse:collapse;margin-top:20px;background:#1e293b;border-radius:8px;overflow:hidden}
        th,td{border:1px solid #334155;padding:12px;text-align:left;vertical-align:top}
        th{background:#334155;color:#0ff}
        tr:nth-child(even){background:#1e293b}
        tr:hover{background:rgba(0,255,255,0.05)}
        .message-cell{max-width:300px;word-wrap:break-word}
        .back-btn{display:inline-block;background:#334155;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;margin-bottom:20px;transition:all 0.3s ease}
        .back-btn:hover{background:#0ff;color:#000}
        h1{color:#0ff;text-shadow:0 0 20px rgba(0,255,255,0.5);text-align:center}
    </style>
</head>
<body>
    <a href="admin-dashboard.php?uid=<?=$uid?>" class="back-btn">← Back to Dashboard</a>

    <h1>📬 Contact Submissions</h1>

    <?php if (count($contacts)): ?>
        <table>
            <tr>
                <th>Date/Time</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>IP</th>
            </tr>
            <?php foreach ($contacts as $contact): ?>
            <tr>
                <td><?=date('Y-m-d H:i', strtotime($contact['ts'] ?? ''))?></td>
                <td><?=htmlspecialchars($contact['name'] ?? '')?></td>
                <td><a href="mailto:<?=htmlspecialchars($contact['email'] ?? '')?>" style="color:#0ff"><?=htmlspecialchars($contact['email'] ?? '')?></a></td>
                <td class="message-cell"><?=nl2br(htmlspecialchars($contact['message'] ?? ''))?></td>
                <td><?=htmlspecialchars($contact['ip'] ?? '')?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p style="text-align:center;color:#cbd5e1;font-style:italic;padding:2rem">No contact submissions yet.</p>
    <?php endif; ?>
</body>
</html>