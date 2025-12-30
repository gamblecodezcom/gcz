-- Add two promotional ads to the GambleCodez Ads system
-- Migration: add_promotional_ads.sql

-- Ad 1: Daily Drops Promotion
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
  '🎁 Daily Drops - Fresh Casino Promos Every Day!',
  'Get exclusive bonus codes and promo links delivered daily. Never miss a drop!',
  'New drops added daily. Terms and conditions apply to all casino offers.',
  10,
  '/drops',
  true
);

-- Ad 2: Degen Wheel Promotion
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
  '🎰 Spin the Degen Wheel - Win Big Rewards!',
  'Spin daily for a chance to win crypto, casino credits, and exclusive bonuses. Free spins every 24 hours!',
  'One free spin per day. Additional spins may be earned through missions and achievements.',
  10,
  '/wheel',
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
WHERE site_description LIKE '%Daily Drops%' OR site_description LIKE '%Degen Wheel%'
ORDER BY created_at DESC;
