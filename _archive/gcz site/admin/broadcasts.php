<?php
require_once ".env.php";
if ($_ENV["ADMIN_ID"] !== (string)($_GET["uid"] ?? '')) exit("⛔  Admin only");

$broadcastFile = __DIR__ . '/../data/broadcasts.json';
$broadcasts = file_exists($broadcastFile) ? json_decode(file_get_contents($broadcastFile), true) : [];
if (!is_array($broadcasts)) $broadcasts = [];

// Handle new broadcast
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $broadcast = [
        'id' => uniqid(),
        'timestamp' => date('c'),
        'message' => trim($_POST['message'] ?? ''),
        'button_text' => trim($_POST['button_text'] ?? ''),
        'button_url' => trim($_POST['button_url'] ?? ''),
        'target' => trim($_POST['target'] ?? ''),
        'status' => 'sent'
    ];

    if ($broadcast['message']) {
        $broadcasts[] = $broadcast;
        file_put_contents($broadcastFile, json_encode($broadcasts, JSON_PRETTY_PRINT), LOCK_EX);
        $success = "Broadcast sent successfully!";
    }
}

// Sort by most recent first
usort($broadcasts, function($a, $b) {
    return strtotime($b['timestamp'] ?? '') - strtotime($a['timestamp'] ?? '');
});

$uid = htmlspecialchars($_ENV['ADMIN_ID']);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Broadcasts</title>
    <link rel="stylesheet" href="../css/neon-dark.css">
    <style>
        body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
        .form-section{background:#1e293b;padding:20px;border-radius:12px;border:1px solid #334155;margin-bottom:20px}
        input,textarea,select{width:100%;margin:6px 0;padding:8px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#fff}
        button{background:#ff00cc;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:bold;cursor:pointer;transition:all 0.3s ease}
        button:hover{background:#0ff;transform:translateY(-2px)}
        table{width:100%;border-collapse:collapse;margin-top:20px;background:#1e293b;border-radius:8px;overflow:hidden}
        th,td{border:1px solid #334155;padding:12px;text-align:left}
        th{background:#334155;color:#0ff}
        tr:nth-child(even){background:#1e293b}
        tr:hover{background:rgba(0,255,255,0.05)}
        .back-btn{display:inline-block;background:#334155;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;margin-bottom:20px;transition:all 0.3s ease}
        .back-btn:hover{background:#0ff;color:#000}
        h1{color:#0ff;text-shadow:0 0 20px rgba(0,255,255,0.5);text-align:center}
        .success{color:#10b981;background:rgba(16,185,129,0.1);padding:1rem;border-radius:6px;margin-bottom:20px}
    </style>
</head>
<body>
    <a href="admin-dashboard.php?uid=<?=$uid?>" class="back-btn">← Back to Dashboard</a>

    <h1>📢 Broadcasts</h1>

    <?php if (isset($success)): ?>
        <div class="success"><?=$success?></div>
    <?php endif; ?>

    <div class="form-section">
        <h2>Send New Broadcast</h2>
        <form method="POST">
            <label>Message</label>
            <textarea name="message" rows="4" placeholder="Enter your broadcast message..." required></textarea>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                <div>
                    <label>Button Text</label>
                    <input name="button_text" placeholder="Visit Site" value="🎰 Visit GambleCodez">
                </div>
                <div>
                    <label>Button URL</label>
                    <input name="button_url" placeholder="https://..." value="https://gamblecodz.com">
                </div>
            </div>

            <label>Target</label>
            <select name="target">
                <option value="GROUP_ID">👥 Telegram Group</option>
                <option value="CHANNEL_ID">📢 Telegram Channel</option>
                <option value="EMAIL">📧 Email List</option>
            </select>

            <button type="submit">🚀 Send Broadcast</button>
        </form>
    </div>

    <h2>Broadcast History</h2>
    <?php if (count($broadcasts)): ?>
        <table>
            <tr>
                <th>Date/Time</th>
                <th>Message</th>
                <th>Button</th>
                <th>Target</th>
                <th>Status</th>
            </tr>
            <?php foreach ($broadcasts as $broadcast): ?>
            <tr>
                <td><?=date('Y-m-d H:i', strtotime($broadcast['timestamp'] ?? ''))?></td>
                <td style="max-width:300px;word-wrap:break-word"><?=htmlspecialchars(substr($broadcast['message'] ?? '', 0, 100))?><?=strlen($broadcast['message'] ?? '') > 100 ? '...' : ''?></td>
                <td>
                    <?php if ($broadcast['button_text'] ?? ''): ?>
                        <a href="<?=htmlspecialchars($broadcast['button_url'] ?? '')?>" target="_blank" style="color:#0ff">
                            <?=htmlspecialchars($broadcast['button_text'] ?? '')?>
                        </a>
                    <?php endif; ?>
                </td>
                <td><?=htmlspecialchars($broadcast['target'] ?? '')?></td>
                <td><span style="color:#10b981"><?=ucfirst($broadcast['status'] ?? 'sent')?></span></td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p style="text-align:center;color:#cbd5e1;font-style:italic;padding:2rem">No broadcasts sent yet.</p>
    <?php endif; ?>
</body>
</html>