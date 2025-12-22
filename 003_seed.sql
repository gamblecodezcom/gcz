-- Seed data and initial settings

-- Insert feature flags
INSERT INTO settings (k, v) VALUES
('feature_flags', JSON_OBJECT(
  'broadcast_enabled', TRUE,
  'moderation_enforced', TRUE,
  'payouts_auto_approve', FALSE,
  'ui_animations_enabled', TRUE,
  'onload_ad_enabled', TRUE
)),
('telegram', JSON_OBJECT(
  'channel_id', '@GambleCodezChannel',
  'group_id', '-1001234567890',
  'bot_username', 'GambleCodezBot'
)),
('pagination', JSON_OBJECT(
  'page_size', 6,
  'group_snippet_max', 5,
  'dm_max_list', 50
)),
('branding', JSON_OBJECT(
  'theme', 'neon-dark',
  'primary_color', '#00eaff',
  'accent_color', '#8a2be2'
))
ON DUPLICATE KEY UPDATE v = VALUES(v);

-- Sample affiliates
INSERT INTO affiliates (name, handle, email, status, region, tags, referral_code, referral_url, priority, is_top_pick, level) VALUES
('Ace', 'ace-casino', 'affiliate@ace.com', 'active', 'usa', 'casino', 'ACE001', 'https://ace.casino/r/ACE001', 10, 1, 3),
('BCH.GAMES', 'bch-games', 'partner@bch.games', 'active', 'non-us', 'casino,faucet,no-kyc,instant', 'BCH002', 'https://bch.games/r/BCH002', 8, 1, 4),
('Stake.us', 'stake-us', 'partners@stake.us', 'active', 'usa', 'casino', 'STAKE003', 'https://stake.us/r/STAKE003', 9, 1, 5),
('Roobet', 'roobet', 'affiliates@roobet.com', 'active', 'non-us', 'casino,no-kyc,instant', 'ROO004', 'https://roobet.com/r/ROO004', 7, 0, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample campaign
INSERT INTO campaigns (name, status, payout_model, cpa_amount, start_date, end_date, target_conversions) VALUES
('Q4 2024 Casino Blitz', 'active', 'cpa', 50.00, '2024-10-01', '2024-12-31', 1000)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample auto-responses
INSERT INTO auto_responses (created_by, trigger_type, trigger_value, body_html, status) VALUES
('admin', 'command', '/faucet', '<b>🚰 Faucet Casinos</b>\n\nHere are our top faucet recommendations:\n• BCH.GAMES\n• LuckyBird\n• TrustDice', 'active'),
('admin', 'command', '/crypto', '<b>💎 Crypto Casinos</b>\n\nBest crypto gambling sites:\n• Stake.com\n• Roobet\n• Shuffle.com', 'active'),
('admin', 'keyword', 'fish tables', '<b>🐠 Fish Tables</b>\n\nLooking for fish tables? Check out FishTables.io!', 'active')
ON DUPLICATE KEY UPDATE body_html = VALUES(body_html);
