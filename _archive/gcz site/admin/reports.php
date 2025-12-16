<?php
require_once ".env.php";
if ($_ENV["ADMIN_ID"] !== (string)($_GET["uid"] ?? '')) exit("⛔  Admin only");

$affiliatesFile = __DIR__ . '/../data/affiliates.json';
$affiliates = file_exists($affiliatesFile) ? json_decode(file_get_contents($affiliatesFile), true) : [];
if (!is_array($affiliates)) $affiliates = [];

// Handle report actions
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = (int)$_GET['id'];

    foreach ($affiliates as $i => $aff) {
        if (($aff['id'] ?? 0) == $id) {
            if ($action === 'approve') {
                $affiliates[$i]['status'] = 'approved';
            } elseif ($action === 'blacklist') {
                $affiliates[$i]['status'] = 'blacklisted';
            }
            file_put_contents($affiliatesFile, json_encode($affiliates, JSON_PRETTY_PRINT), LOCK_EX);
            break;
        }
    }
    header("Location: reports.php?uid=".$_ENV['ADMIN_ID']);
    exit;
}

// Filter pending/reported affiliates
$pendingAffiliates = array_filter($affiliates, function($a) {
    return ($a['status'] ?? '') === 'pending' || isset($a['reported']);
});

$uid = htmlspecialchars($_ENV['ADMIN_ID']);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reports</title>
    <link rel="stylesheet" href="../css/neon-dark.css">
    <style>
        body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
        table{width:100%;border-collapse:collapse;margin-top:20px;background:#1e293b;border-radius:8px;overflow:hidden}
        th,td{border:1px solid #334155;padding:12px;text-align:left}
        th{background:#334155;color:#0ff}
        tr:nth-child(even){background:#1e293b}
        tr:hover{background:rgba(0,255,255,0.05)}
        .btn{padding:6px 12px;border-radius:6px;text-decoration:none;margin:0 2px;font-size:0.9rem;transition:all 0.3s ease}
        .btn-approve{background:#10b981;color:white}
        .btn-approve:hover{background:#059669;transform:translateY(-1px)}
        .btn-blacklist{background:#ef4444;color:white}
        .btn-blacklist:hover{background:#dc2626;transform:translateY(-1px)}
        .back-btn{display:inline-block;background:#334155;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;margin-bottom:20px;transition:all 0.3s ease}
        .back-btn:hover{background:#0ff;color:#000}
        h1{color:#0ff;text-shadow:0 0 20px rgba(0,255,255,0.5);text-align:center}
    </style>
</head>
<body>
    <a href="admin-dashboard.php?uid=<?=$uid?>" class="back-btn">← Back to Dashboard</a>

    <h1>🚨 Reports & Pending Affiliates</h1>

    <?php if (count($pendingAffiliates)): ?>
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>URL</th>
                <th>Status</th>
                <th>Level</th>
                <th>Actions</th>
            </tr>
            <?php foreach ($pendingAffiliates as $aff): ?>
            <tr>
                <td><?=$aff['id'] ?? ''?></td>
                <td><?=htmlspecialchars($aff['name'] ?? '')?></td>
                <td>
                    <a href="<?=htmlspecialchars($aff['url'] ?? '')?>" target="_blank" style="color:#0ff">
                        <?=htmlspecialchars(substr($aff['url'] ?? '', 0, 50))?><?=strlen($aff['url'] ?? '') > 50 ? '...' : ''?>
                    </a>
                </td>
                <td>
                    <span style="color:<?=($aff['status']??'')=='pending'?'#fbbf24':'#ef4444'?>">
                        <?=ucfirst($aff['status'] ?? 'pending')?>
                    </span>
                </td>
                <td><span class="level-badge level-<?=$aff['level']??3?>"><?=$aff['level']??3?></span></td>
                <td>
                    <a class="btn btn-approve" href="?uid=<?=$uid?>&action=approve&id=<?=$aff['id']?>" 
                       onclick="return confirm('Approve this affiliate?')">✅ Approve</a>
                    <a class="btn btn-blacklist" href="?uid=<?=$uid?>&action=blacklist&id=<?=$aff['id']?>" 
                       onclick="return confirm('Blacklist this affiliate?')">🚫 Blacklist</a>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p style="text-align:center;color:#cbd5e1;font-style:italic;padding:2rem">No pending reports or affiliates to review.</p>
    <?php endif; ?>
</body>
</html>