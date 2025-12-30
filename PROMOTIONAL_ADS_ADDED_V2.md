# Two New Promotional Ads Added

## Summary

Successfully added two new promotional ads to the GambleCodez Ads system on 2025-12-30.

## New Ads Added

### Ad #3: Raffles Promotion
- **Title**: 🎫 Join Exclusive Raffles - Win Prizes Daily!
- **Description**: Enter our daily raffles for a chance to win crypto, casino credits, and exclusive rewards. Free entries available!
- **Link**: `/raffles`
- **Weight**: 10 (active)
- **Fine Print**: Raffle entries are free for all users. Winners are selected randomly. Terms and conditions apply.

### Ad #4: Leaderboard Promotion
- **Title**: 🏆 Climb the Leaderboard - Earn Rewards!
- **Description**: Link your casino accounts, complete missions, and compete on the leaderboard. Top players earn exclusive bonuses and prizes!
- **Link**: `/leaderboard`
- **Weight**: 10 (active)
- **Fine Print**: Leaderboard rankings update in real-time. Rewards distributed based on XP, missions completed, and activity.

## Current Active Ads

The system now has **4 active promotional ads**:

1. **Daily Drops** (`/drops`) - Weight: 10
2. **Degen Wheel** (`/wheel`) - Weight: 10
3. **Raffles** (`/raffles`) - Weight: 10 ⭐ NEW
4. **Leaderboard** (`/leaderboard`) - Weight: 10 ⭐ NEW

All ads have equal weight (10), so they will be shown with equal probability via weighted random selection.

## Database Status

- **Migration File**: `sql/migrations/add_two_promotional_ads.sql`
- **Ads Table**: 4 active ads total
- **Status**: All ads are active and ready to display

## How It Works

1. **Ad Selection**: When a user visits the site, the frontend calls `/api/ads`
2. **Weighted Random**: The backend selects an ad based on weight (all 4 ads have weight 10, so equal probability)
3. **Display**: Ad appears as a popup modal after 5 seconds
4. **Tracking**: Impressions and clicks are logged if user is authenticated
5. **Frequency Capping**: Each user sees max 1 ad per 24 hours

## Management

### View Ads
- **Admin Panel**: `/admin/ads.html`
- **API**: `GET /api/admin/ads`

### Edit Ads
- **Admin Panel**: Click "Edit" on any ad card
- **API**: `PUT /api/admin/ads/:id`

### Deactivate Ads
- **Admin Panel**: Edit ad and set `active` to false
- **API**: `PUT /api/admin/ads/:id` with `{"active": false}`

### Delete Ads
- **Admin Panel**: Click "Delete" on any ad card
- **API**: `DELETE /api/admin/ads/:id`

## Verification

You can verify the ads are active by running:

```sql
SELECT id, site_description, button_url, weight, active 
FROM ads 
WHERE active = true 
ORDER BY weight DESC, created_at DESC;
```

Or test the API endpoint:

```bash
curl http://localhost:3000/api/ads
```

## Next Steps (Optional)

1. **Custom Logos**: Replace `/icon-192.png` with custom promotional images
   - Upload via admin panel (supports image upload)
   - Or update `logo_url` field directly

2. **A/B Testing**: Adjust weights to test which ads perform better
   - Higher weight = more impressions
   - Monitor click-through rates via admin dashboard

3. **Analytics**: Review performance metrics in `/admin/ads-dashboard.html`
   - Impressions by placement
   - Click-through rates
   - Campaign performance

## Files Modified

- ✅ `sql/migrations/add_two_promotional_ads.sql` - Created migration script
- ✅ Database: `ads` table - Added 2 new records (IDs: 3, 4)

## Integration Status

- ✅ Backend API: `/api/ads` endpoint working
- ✅ Admin Panel: `/admin/ads.html` can manage all ads
- ✅ Frontend: `AdSystem.tsx` component ready to display ads
- ✅ Database: All ads stored and queryable

The new promotional ads are live and will start appearing to users on the next page load (respecting the 24-hour frequency cap).
