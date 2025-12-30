-- Add two new promotional ads to the GambleCodez Ads system
-- Migration: add_two_promotional_ads.sql
-- Date: 2025-12-30

-- Ad 1: Raffles Promotion
INSERT INTO ads (
  logo_url,
  site_description,
  bonus_code_description,
  fine_print,
  weight,
  button_url,
  active
) VALUES (
  '/icon-192.png',
  '🎫 Join Exclusive Raffles - Win Prizes Daily!',
  'Enter our daily raffles for a chance to win crypto, casino credits, and exclusive rewards. Free entries available!',
  'Raffle entries are free for all users. Winners are selected randomly. Terms and conditions apply.',
  10,
  '/raffles',
  true
);

-- Ad 2: Affiliates & Leaderboard Promotion
INSERT INTO ads (
  logo_url,
  site_description,
  bonus_code_description,
  fine_print,
  weight,
  button_url,
  active
) VALUES (
  '/icon-192.png',
  '🏆 Climb the Leaderboard - Earn Rewards!',
  'Link your casino accounts, complete missions, and compete on the leaderboard. Top players earn exclusive bonuses and prizes!',
  'Leaderboard rankings update in real-time. Rewards distributed based on XP, missions completed, and activity.',
  10,
  '/leaderboard',
  true
);

-- Verify the ads were created
SELECT 
  id,
  logo_url,
  site_description,
  weight,
  button_url,
  active,
  created_at
FROM ads
WHERE site_description LIKE '%Raffles%' OR site_description LIKE '%Leaderboard%'
ORDER BY created_at DESC;
