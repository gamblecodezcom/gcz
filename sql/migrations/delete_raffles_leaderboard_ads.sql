-- Delete Raffles and Leaderboard promotional ads
-- Migration: delete_raffles_leaderboard_ads.sql
-- Date: 2025-12-30

-- Delete Raffles ad
DELETE FROM ads 
WHERE site_description LIKE '%Raffles%' 
  AND button_url = '/raffles';

-- Delete Leaderboard ad
DELETE FROM ads 
WHERE site_description LIKE '%Leaderboard%' 
  AND button_url = '/leaderboard';

-- Verify deletions and show remaining active ads
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
ORDER BY weight DESC, created_at DESC;
