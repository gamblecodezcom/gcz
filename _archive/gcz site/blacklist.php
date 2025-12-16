<?php
// Public blacklist page
$affiliatesFile = 'data/affiliates.json';
$blacklisted = [];

if (file_exists($affiliatesFile)) {
    $data = json_decode(file_get_contents($affiliatesFile), true);
    if (is_array($data)) {
        $blacklisted = array_filter($data, function($a) {
            return ($a['status'] ?? '') === 'blacklisted';
        });
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GambleCodez Blacklist</title>
    <link rel="stylesheet" href="css/neon-dark.css">
</head>
<body>
    <header id="header">
        <nav class="navbar">
            <div class="nav-brand">
                <h1 class="site-logo"><a href="index.php" style="color:inherit;text-decoration:none">GambleCodez</a></h1>
            </div>
        </nav>
    </header>

    <main style="margin-top:80px;padding:2rem">
        <section class="affiliate-section">
            <h2>🚫 Blacklisted Sites</h2>
            <div class="warning">
                ⚠️ The following sites have been blacklisted due to reported issues including scams, non-payment, or other fraudulent activities. Avoid these sites for your safety.
            </div>

            <?php if (count($blacklisted) > 0): ?>
                <div class="affiliate-grid">
                    <?php foreach ($blacklisted as $site): ?>
                        <div class="affiliate-card" style="border-color:#ef4444;background:rgba(239,68,68,0.1)">
                            <div class="card-header">
                                <h3 style="color:#ef4444"><?=htmlspecialchars($site['name'] ?? '')?></h3>
                                <div class="level-badge" style="background:#ef4444">BLACKLISTED</div>
                            </div>
                            <p class="affiliate-info"><?=htmlspecialchars($site['info'] ?? 'No specific details provided')?></p>
                            <p style="color:#ef4444;font-weight:bold">⚠️ DO NOT USE THIS SITE</p>
                            <div style="color:#cbd5e1;font-size:0.9rem">
                                URL: <?=htmlspecialchars($site['url'] ?? '')?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <p class="no-results">No sites are currently blacklisted.</p>
            <?php endif; ?>
        </section>
    </main>

    <footer>
        <div class="footer-content">
            <p>&copy; 2025 GambleCodez. Protecting our community.</p>
            <div class="footer-links">
                <a href="index.php">← Back to Home</a>
            </div>
        </div>
    </footer>
</body>
</html>