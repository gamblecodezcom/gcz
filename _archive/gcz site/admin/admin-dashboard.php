<?php
require_once '.env.php';
if (!isset($_ENV['ADMIN_ID']) || $_ENV['ADMIN_ID'] !== (string)($_GET['uid'] ?? '')) {
    exit('⛔ Admin access only');
}
$uid = htmlspecialchars($_ENV['ADMIN_ID']);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>GambleCodez Admin Dashboard</title>
    <link rel="stylesheet" href="../css/neon-dark.css">
    <style>
        body { background: #0f172a; color: #fff; font-family: sans-serif; padding: 20px; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; transition: all 0.3s ease; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); border-color: #0ff; }
        .card h2 { color: #ff00cc; margin-bottom: 15px; }
        .card a { color: #cbd5e1; text-decoration: none; display: block; margin: 8px 0; padding: 8px; border-radius: 6px; transition: all 0.3s ease; }
        .card a:hover { background: rgba(0, 255, 255, 0.1); color: #0ff; }
        h1 { text-align: center; color: #0ff; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5); margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>🎰 GambleCodez Admin Dashboard</h1>

    <div class="dashboard-grid">
        <div class="card">
            <h2>🤝 Affiliates</h2>
            <a href="affiliates.php?uid=<?=$uid?>">Manage Affiliates</a>
            <a href="affiliates.php?uid=<?=$uid?>&action=export">Export Data</a>
            <a href="affiliates.php?uid=<?=$uid?>&action=import">Import CSV</a>
        </div>

        <div class="card">
            <h2>📂 Vault</h2>
            <a href="vault.php?uid=<?=$uid?>">Vault Manager</a>
            <a href="vault-view.php?uid=<?=$uid?>">Vault Viewer</a>
        </div>

        <div class="card">
            <h2>🚨 Reports</h2>
            <a href="reports.php?uid=<?=$uid?>">Review Reports</a>
        </div>

        <div class="card">
            <h2>🧾 Logs</h2>
            <a href="deploy-logs.php?uid=<?=$uid?>">Deploy Logs</a>
            <a href="clean-logs.php?pin=<?=urlencode($_ENV['DEPLOY_PIN'] ?? 'PIN12345')?>">Clean Logs</a>
        </div>

        <div class="card">
            <h2>📢 Broadcasts</h2>
            <a href="broadcasts.php?uid=<?=$uid?>">View Broadcasts</a>
            <a href="broadcast.php?uid=<?=$uid?>">Send Broadcast</a>
        </div>

        <div class="card">
            <h2>📬 Contact</h2>
            <a href="contact-view.php?uid=<?=$uid?>">View Submissions</a>
        </div>

        <div class="card">
            <h2>🚫 Blacklist</h2>
            <a href="view-blacklist.php?uid=<?=$uid?>">View JSON</a>
            <a href="../blacklist.php" target="_blank">Public Blacklist Page</a>
        </div>

        <div class="card">
            <h2>🖼 Ad Panel</h2>
            <a href="ad-manager.php?uid=<?=$uid?>">Manage Overlay Ads</a>
        </div>
    </div>
</body>
</html>