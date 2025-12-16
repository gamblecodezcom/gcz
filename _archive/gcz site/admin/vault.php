<?php
// vault.php — manage secure vault entries
require_once ".env.php";
if ($_ENV["ADMIN_ID"] !== (string)($_GET["uid"] ?? '')) exit("⛔  Admin only");

$path     = __DIR__ . '/../data/vault.json';
$livePath = '/var/www/admin/data/vault.json';
$vault = file_exists($path) ? json_decode(file_get_contents($path), true) : [];
if (!is_array($vault)) $vault = [];

// Save helper
function saveVault($vault,$path,$livePath){
    file_put_contents($path, json_encode($vault, JSON_PRETTY_PRINT), LOCK_EX);
    if (!is_dir(dirname($livePath))) mkdir(dirname($livePath),0755,true);
    file_put_contents($livePath, json_encode($vault, JSON_PRETTY_PRINT), LOCK_EX);
}

// Add/Edit
if ($_SERVER['REQUEST_METHOD']==='POST'){
    $id   = $_POST['id'] ?? '';
    $entry = [
        'label' => trim($_POST['label'] ?? ''),
        'value' => trim($_POST['value'] ?? ''),
        'tags'  => array_filter(array_map('trim', explode(',', $_POST['tags'] ?? ''))),
        'ts'    => date('c')
    ];
    if ($entry['label'] && $entry['value']){
        if ($id!=='') $vault[$id]=$entry; else $vault[]=$entry;
        saveVault($vault,$path,$livePath);
        header("Location: vault.php?uid=".$_ENV['ADMIN_ID']); exit;
    }
}

// Delete
if (isset($_GET['delete'])){
    $id=(int)$_GET['delete'];
    if (isset($vault[$id])){ unset($vault[$id]); $vault=array_values($vault); saveVault($vault,$path,$livePath); }
    header("Location: vault.php?uid=".$_ENV['ADMIN_ID']); exit;
}

$uid=htmlspecialchars($_ENV['ADMIN_ID']);
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"><title>Vault Manager</title>
<link rel="stylesheet" href="../css/neon-dark.css">
<style>
body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
table{width:100%;border-collapse:collapse;margin-top:20px;background:#1e293b;border-radius:8px;overflow:hidden}
th,td{border:1px solid #334155;padding:8px;text-align:left}
th{background:#334155;color:#0ff}
tr:nth-child(even){background:#1e293b}
tr:hover{background:rgba(0,255,255,0.05)}
input,textarea{width:100%;margin:6px 0;padding:8px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#fff}
button{background:#ff00cc;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:bold;cursor:pointer;transition:all 0.3s ease}
button:hover{background:#0ff;transform:translateY(-2px)}
a.btn-del{color:#f66}
.form-section{background:#1e293b;padding:20px;border-radius:12px;border:1px solid #334155;margin-bottom:20px}
.back-btn{display:inline-block;background:#334155;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;margin-bottom:20px;transition:all 0.3s ease}
.back-btn:hover{background:#0ff;color:#000}
h1{color:#0ff;text-shadow:0 0 20px rgba(0,255,255,0.5);text-align:center}
</style>
</head>
<body>
<a href="admin-dashboard.php?uid=<?=$uid?>" class="back-btn">← Back to Dashboard</a>

<h1>🔐 Vault Manager</h1>

<div class="form-section">
<h2><?=isset($_GET['edit'])?"Edit Entry":"Add Entry"?></h2>
<?php $edit=null; if(isset($_GET['edit'])){ $id=(int)$_GET['edit']; if(isset($vault[$id])) $edit=$vault[$id]+['id'=>$id]; } ?>
<form method="POST">
<?php if($edit): ?><input type="hidden" name="id" value="<?=$id?>"><?php endif; ?>
<label>Label</label><input name="label" value="<?=htmlspecialchars($edit['label']??'')?>" required>
<label>Value</label><textarea name="value" rows="3" required><?=htmlspecialchars($edit['value']??'')?></textarea>
<label>Tags (comma separated)</label><input name="tags" value="<?=htmlspecialchars(implode(', ',$edit['tags']??[]))?>">
<button type="submit"><?= $edit?"💾 Save":"➕  Add" ?></button>
</form>
</div>

<h2>Vault Entries</h2>
<?php if($vault): ?>
<table>
<tr><th>#</th><th>Label</th><th>Value</th><th>Tags</th><th>Updated</th><th>Actions</th></tr>
<?php foreach($vault as $i=>$v): ?>
<tr>
<td><?=$i?></td>
<td><?=htmlspecialchars($v['label'])?></td>
<td><code style="background:#0f172a;padding:4px;border-radius:4px"><?=htmlspecialchars(substr($v['value'], 0, 50))?><?=strlen($v['value'])>50?'...':''?></code></td>
<td><?=htmlspecialchars(implode(', ',$v['tags']??[]))?></td>
<td><?=date('M j, Y H:i', strtotime($v['ts']))?></td>
<td><a href="vault.php?uid=<?=$uid?>&edit=<?=$i?>" style="color:#0ff">✏️ Edit</a> |
<a class="btn-del" href="vault.php?uid=<?=$uid?>&delete=<?=$i?>" onclick="return confirm('Delete?')" style="color:#f66">🗑 Delete</a></td>
</tr>
<?php endforeach; ?>
</table>
<?php else: ?>
<p style="text-align:center;color:#cbd5e1;font-style:italic;padding:2rem">No entries yet.</p>
<?php endif; ?>
</body>
</html>