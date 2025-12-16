<?php
// GambleCodez Main Site
header('Content-Type: text/html; charset=UTF-8');

// Load affiliate data
$affiliatesFile = 'data/affiliates.json';
$affiliates = [];
if (file_exists($affiliatesFile)) {
    $data = json_decode(file_get_contents($affiliatesFile), true);
    if (is_array($data)) {
        // Filter out blacklisted
        $affiliates = array_filter($data, function($a) {
            return ($a['status'] ?? '') !== 'blacklisted';
        });
    }
}

// Filter functions
function filterAffiliates($affiliates, $criteria) {
    return array_filter($affiliates, $criteria);
}

// Get top picks
$topPicks = filterAffiliates($affiliates, function($a) {
    return ($a['is_top_pick'] ?? false) === true;
});

// US Sweeps (level=5, regions=usa, tags includes sweeps)
$usSweeps = filterAffiliates($affiliates, function($a) {
    $level = $a['level'] ?? 0;
    $regions = strtolower($a['regions'] ?? '');
    $tags = array_map('strtolower', $a['tags'] ?? []);
    return $level == 5 && $regions === 'usa' && in_array('sweeps', $tags);
});

// Non-US Crypto (level=4 OR tags includes crypto)
$nonUsCrypto = filterAffiliates($affiliates, function($a) {
    $level = $a['level'] ?? 0;
    $tags = array_map('strtolower', $a['tags'] ?? []);
    return $level == 4 || in_array('crypto', $tags);
});

// Faucet sites
$faucetSites = filterAffiliates($affiliates, function($a) {
    $tags = array_map('strtolower', $a['tags'] ?? []);
    return in_array('faucet', $tags);
});

// Lootbox sites
$lootboxSites = filterAffiliates($affiliates, function($a) {
    $tags = array_map('strtolower', $a['tags'] ?? []);
    return in_array('lootbox', $tags);
});

// Instant redemption
$instantSites = filterAffiliates($affiliates, function($a) {
    return ($a['instant_redemption'] ?? false) === true;
});

// Recently added (last 30 days)
$recentSites = filterAffiliates($affiliates, function($a) {
    $dateAdded = $a['date_added'] ?? '';
    if (!$dateAdded) return false;
    $addedTime = strtotime($dateAdded);
    $thirtyDaysAgo = strtotime('-30 days');
    return $addedTime > $thirtyDaysAgo;
});

// Load ads
$adsFile = 'ads/ad-space.json';
$ads = [];
if (file_exists($adsFile)) {
    $data = json_decode(file_get_contents($adsFile), true);
    if (is_array($data)) {
        $ads = $data;
    }
}

function renderAffiliateCard($affiliate) {
    $name = htmlspecialchars($affiliate['name'] ?? '');
    $url = htmlspecialchars($affiliate['url'] ?? '');
    $info = htmlspecialchars($affiliate['info'] ?? '');
    $tags = $affiliate['tags'] ?? [];
    $level = $affiliate['level'] ?? 3;
    $priority = $affiliate['priority'] ?? 50;
    $isTopPick = ($affiliate['is_top_pick'] ?? false) === true;
    $instantRedemption = ($affiliate['instant_redemption'] ?? false) === true;
    $kycRequired = ($affiliate['kyc_required'] ?? false) === true;

    $html = '<div class="affiliate-card" data-level="' . $level . '">';
    $html .= '<div class="card-header">';
    $html .= '<h3>' . $name;
    if ($isTopPick) $html .= ' <span class="top-pick-star">⭐</span>';
    $html .= '</h3>';
    $html .= '<div class="level-badge level-' . $level . '">Level ' . $level . '</div>';
    $html .= '</div>';

    if ($info) {
        $html .= '<p class="affiliate-info">' . $info . '</p>';
    }

    if (!empty($tags)) {
        $html .= '<div class="tags">';
        foreach ($tags as $tag) {
            $html .= '<span class="tag">' . htmlspecialchars($tag) . '</span>';
        }
        $html .= '</div>';
    }

    $html .= '<div class="badges">';
    if ($instantRedemption) {
        $html .= '<span class="badge instant">⚡ Instant</span>';
    }
    if ($kycRequired) {
        $html .= '<span class="badge kyc">🆔 KYC</span>';
    }
    if ($priority >= 90) {
        $html .= '<span class="badge priority">🔥 Hot</span>';
    }
    $html .= '</div>';

    $html .= '<a href="' . $url . '" target="_blank" rel="noopener" class="visit-btn">🎰 Visit Site</a>';
    $html .= '</div>';

    return $html;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GambleCodez - Casino Affiliate Network</title>
    <meta name="description" content="Top casino affiliates, sweepstakes, crypto faucets, and instant redemption sites">
    <meta name="keywords" content="casino, affiliate, sweepstakes, crypto, faucet, gambling">

    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0f172a">

    <!-- Styles -->
    <link rel="stylesheet" href="css/neon-dark.css">

    <!-- Preload critical resources -->
    <link rel="preload" href="js/gc-menu-system.js" as="script">
</head>
<body>
    <!-- Header -->
    <header id="header">
        <nav class="navbar">
            <div class="nav-brand">
                <h1 class="site-logo">GambleCodez</h1>
            </div>
            <button id="gc-menu-toggle" class="menu-toggle">☰</button>
            <div id="gc-menu-panel" class="nav-menu">
                <a href="#top-picks">🌟 Top Picks</a>
                <a href="#us-sweeps">🇺🇸 US Sweeps</a>
                <a href="#nonus-crypto">🌍 Crypto</a>
                <a href="#faucet">🚰 Faucets</a>
                <a href="#lootbox">📦 Lootbox</a>
                <a href="#instant">⚡ Instant</a>
                <a href="#recently-added">🆕 Recent</a>
                <a href="#blacklist">🚫 Blacklist</a>
                <a href="#newsletter">📧 Newsletter</a>
                <a href="#contact-us">📞 Contact</a>
            </div>
        </nav>
    </header>

    <main>
        <!-- Top Picks Section -->
        <section id="top-picks" class="affiliate-section">
            <h2>🌟 Top Picks</h2>
            <div class="affiliate-grid">
                <?php foreach ($topPicks as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($topPicks)): ?>
                    <p class="no-results">No top picks available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- US Sweeps Section -->
        <section id="us-sweeps" class="affiliate-section">
            <h2>🇺🇸 US Sweepstakes Casinos</h2>
            <div class="affiliate-grid">
                <?php foreach ($usSweeps as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($usSweeps)): ?>
                    <p class="no-results">No US sweepstakes casinos available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Non-US Crypto Section -->
        <section id="nonus-crypto" class="affiliate-section">
            <h2>🌍 Non-US Crypto Casinos</h2>
            <div class="affiliate-grid">
                <?php foreach ($nonUsCrypto as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($nonUsCrypto)): ?>
                    <p class="no-results">No crypto casinos available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Faucet Section -->
        <section id="faucet" class="affiliate-section">
            <h2>🚰 Crypto Faucets</h2>
            <div class="affiliate-grid">
                <?php foreach ($faucetSites as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($faucetSites)): ?>
                    <p class="no-results">No faucet sites available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Lootbox Section -->
        <section id="lootbox" class="affiliate-section">
            <h2>📦 Lootbox Sites</h2>
            <div class="affiliate-grid">
                <?php foreach ($lootboxSites as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($lootboxSites)): ?>
                    <p class="no-results">No lootbox sites available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Instant Section -->
        <section id="instant" class="affiliate-section">
            <h2>⚡ Instant Redemption</h2>
            <div class="affiliate-grid">
                <?php foreach ($instantSites as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($instantSites)): ?>
                    <p class="no-results">No instant redemption sites available at this time.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Recently Added Section -->
        <section id="recently-added" class="affiliate-section">
            <h2>🆕 Recently Added</h2>
            <div class="affiliate-grid">
                <?php foreach ($recentSites as $affiliate): ?>
                    <?= renderAffiliateCard($affiliate) ?>
                <?php endforeach; ?>
                <?php if (empty($recentSites)): ?>
                    <p class="no-results">No recently added sites.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Newsletter Section -->
        <section id="newsletter" class="form-section">
            <h2>📧 Newsletter Signup</h2>
            <form id="newsletter-form" method="POST" action="newsletter-signup.php">
                <div class="form-group">
                    <input type="email" name="email" placeholder="Enter your email" required>
                    <button type="submit">Subscribe</button>
                </div>
            </form>
        </section>

        <!-- Contact Section -->
        <section id="contact-us" class="form-section">
            <h2>📞 Contact Us</h2>
            <form id="contact-form" method="POST" action="admin/contact.php">
                <div class="form-group">
                    <input type="text" name="name" placeholder="Your Name" required>
                </div>
                <div class="form-group">
                    <input type="email" name="email" placeholder="Your Email" required>
                </div>
                <div class="form-group">
                    <textarea name="message" placeholder="Your Message" rows="5" required></textarea>
                </div>
                <button type="submit">Send Message</button>
            </form>
        </section>

        <!-- Blacklist Section -->
        <section id="blacklist" class="affiliate-section">
            <h2>🚫 Blacklisted Sites</h2>
            <p class="warning">⚠️ The following sites are blacklisted due to reported issues:</p>
            <div id="blacklist-content">
                <p><a href="blacklist.php" target="_blank">View Full Blacklist</a></p>
            </div>
        </section>
    </main>

    <!-- Ad Overlay -->
    <?php if (!empty($ads)): ?>
    <div id="ad-overlay" class="ad-overlay">
        <div class="ad-content">
            <button id="close-ad" class="close-ad">✕</button>
            <?php foreach ($ads as $ad): ?>
                <div class="ad-item">
                    <?php if (!empty($ad['image'])): ?>
                        <img src="<?= htmlspecialchars($ad['image']) ?>" alt="Advertisement">
                    <?php endif; ?>
                    <h3><?= htmlspecialchars($ad['headline'] ?? '') ?></h3>
                    <p><?= htmlspecialchars($ad['description'] ?? '') ?></p>
                    <a href="<?= htmlspecialchars($ad['url'] ?? '') ?>" target="_blank" class="ad-cta">
                        <?= htmlspecialchars($ad['cta'] ?? 'Learn More') ?>
                    </a>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- Footer -->
    <footer>
        <div class="footer-content">
            <p>&copy; 2025 GambleCodez. All rights reserved.</p>
            <div class="footer-links">
                <a href="admin/admin-dashboard.php?uid=ADMIN_12345">Admin Login</a>
                <a href="#blacklist">Blacklist</a>
                <a href="#contact-us">Contact</a>
            </div>
        </div>

        <!-- Gemified Carousel (Level 4 affiliates) -->
        <div id="gmfied-container" class="gemified-section">
            <h3>Featured Partners</h3>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="js/gc-menu-system.js"></script>
    <script>
        // Ad overlay functionality
        document.addEventListener('DOMContentLoaded', function() {
            const adOverlay = document.getElementById('ad-overlay');
            const closeAd = document.getElementById('close-ad');

            if (closeAd) {
                closeAd.addEventListener('click', function() {
                    adOverlay.style.display = 'none';
                });
            }

            // Auto-hide after 10 seconds
            if (adOverlay) {
                setTimeout(function() {
                    adOverlay.style.display = 'none';
                }, 10000);
            }
        });

        // Form submissions
        document.getElementById('newsletter-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Newsletter signup successful!');
        });

        document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);

            fetch('admin/contact.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    alert('Message sent successfully!');
                    e.target.reset();
                } else {
                    alert('Error: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                alert('Message sent!');
                e.target.reset();
            });
        });
    </script>

    <!-- Gemified Widget -->
    <script>
        (function() {
            window.GMFDWIDGETCONFIG = {
                trackingLinkSlug: 'y1scHuqaqHCV'
            };
            const script = document.createElement('script');
            script.src = 'https://assets.gemified.io/widgets/gmfd-widget.js';
            script.async = true;
            document.head.appendChild(script);
        })();
    </script>

    <!-- PWA Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('sw.js');
            });
        }
    </script>
</body>
</html>