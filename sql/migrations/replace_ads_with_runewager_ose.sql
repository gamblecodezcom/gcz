-- Replace all ads with Runewager and OSE ads only
-- Migration: replace_ads_with_runewager_ose.sql
-- Date: 2025-12-30

-- Delete all existing ads (Daily Drops, Degen Wheel, and any others)
DELETE FROM ads;

-- Create Runewager ad
INSERT INTO ads (
  logo_url,
  site_description,
  bonus_code_description,
  fine_print,
  weight,
  button_url,
  active
) VALUES (
  'https://www.google.com/s2/favicons?sz=256&domain=runewager.com',
  '🔥 Runewager - GambleCodez TOP PICK!',
  'Wager 3,000 SC in 7 days for 30 SC bonus. Blazing fast redemptions, global access, giveaways, updated slots, originals, Lootbox sportsbook.',
  'PROMO AVAILABLE ONLY ONCE PER ACC. DM @GambleCodez on TG for support. Terms and conditions apply.',
  10,
  'https://runewager.com/?r=GambleCodez',
  true
);

-- Create OSEsweeps ad
INSERT INTO ads (
  logo_url,
  site_description,
  bonus_code_description,
  fine_print,
  weight,
  button_url,
  active
) VALUES (
  'https://www.google.com/s2/favicons?sz=256&domain=osesweeps.com',
  '🎁 OSEsweeps - Exclusive Signup Bonus!',
  'Use code GambleCodez at signup for 50% off first purchase. Use GCODEZ5 for 5% off future purchases.',
  'New customer offer. Terms and conditions apply. Must be 18+ to play.',
  10,
  'https://osesweeps.com/',
  true
);

-- Verify only Runewager and OSE ads remain active
SELECT 
  id,
  logo_url,
  site_description,
  bonus_code_description,
  weight,
  button_url,
  active,
  created_at
FROM ads
WHERE active = true
ORDER BY id;

-- Show weighted rotation summary
SELECT 
  COUNT(*) as total_active_ads,
  SUM(weight) as total_weight,
  string_agg(site_description, ', ' ORDER BY id) as active_ads
FROM ads
WHERE active = true;
