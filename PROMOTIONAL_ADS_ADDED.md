# Promotional Ads Added to GambleCodez

## Summary

Two promotional ads have been successfully added to the GambleCodez Ads system. These ads will be displayed to users via the weighted random selection system in the frontend.

## Ads Added

### Ad #1: Daily Drops Promotion
- **ID**: 1
- **Title**: 🎁 Daily Drops - Fresh Casino Promos Every Day!
- **Description**: Get exclusive bonus codes and promo links delivered daily. Never miss a drop!
- **Fine Print**: New drops added daily. Terms and conditions apply to all casino offers.
- **Weight**: 10 (higher weight = more likely to be shown)
- **Button URL**: `/drops`
- **Logo**: `/icon-192.png`
- **Status**: Active ✅

### Ad #2: Degen Wheel Promotion
- **ID**: 2
- **Title**: 🎰 Spin the Degen Wheel - Win Big Rewards!
- **Description**: Spin daily for a chance to win crypto, casino credits, and exclusive bonuses. Free spins every 24 hours!
- **Fine Print**: One free spin per day. Additional spins may be earned through missions and achievements.
- **Weight**: 10 (higher weight = more likely to be shown)
- **Button URL**: `/wheel`
- **Logo**: `/icon-192.png`
- **Status**: Active ✅

## Technical Details

### Database
- **Table**: `ads`
- **Migration File**: `sql/migrations/add_promotional_ads.sql`
- **Fields Used**:
  - `logo_url`: Image URL for the ad
  - `site_description`: Main title/headline
  - `bonus_code_description`: Detailed description
  - `fine_print`: Terms and conditions
  - `weight`: Selection weight (10 = high priority)
  - `button_url`: Destination URL when clicked
  - `active`: Boolean flag (true = active)

### API Integration
- **Public Endpoint**: `GET /api/ads` - Returns weighted random ad
- **Admin Endpoint**: `GET /api/admin/ads` - Lists all ads
- **Click Tracking**: `POST /api/ads/:id/click` - Tracks ad clicks

### Frontend Integration
- **Component**: `AdSystem.tsx` (located in `frontend/src/components/Ads/`)
- **Display**: Popup modal shown after 5 seconds on page load
- **Frequency**: Once per 24 hours per user (stored in localStorage)
- **Selection**: Weighted random based on `weight` field

## How It Works

1. **Ad Selection**: When a user visits the site, the frontend calls `/api/ads`
2. **Weighted Random**: The backend selects an ad based on weight (both ads have weight 10, so equal probability)
3. **Display**: Ad appears as a popup modal after 5 seconds
4. **Tracking**: Impressions and clicks are logged if user is authenticated
5. **Frequency Capping**: Each user sees max 1 ad per 24 hours

## Management

### View Ads
- Admin Panel: `/admin/ads.html`
- API: `GET /api/admin/ads`

### Edit Ads
- Admin Panel: Click "Edit" on any ad card
- API: `PUT /api/admin/ads/:id`

### Deactivate Ads
- Admin Panel: Edit ad and set `active` to false
- API: `PUT /api/admin/ads/:id` with `{"active": false}`

### Delete Ads
- Admin Panel: Click "Delete" on any ad card
- API: `DELETE /api/admin/ads/:id`

## Next Steps (Optional)

1. **Custom Logos**: Replace `/icon-192.png` with custom promotional images
   - Upload via admin panel (supports image upload)
   - Or update `logo_url` field directly

2. **A/B Testing**: Adjust weights to test which ad performs better
   - Higher weight = more impressions
   - Monitor click-through rates via admin dashboard

3. **Additional Ads**: Add more promotional ads for:
   - Raffles feature
   - Affiliates program
   - Special events/promotions

4. **Analytics**: Review performance metrics in `/admin/ads-dashboard.html`
   - Impressions by placement
   - Click-through rates
   - Campaign performance

## Files Modified

- ✅ `sql/migrations/add_promotional_ads.sql` - Created migration script
- ✅ Database: `ads` table - Added 2 new records

## Verification

Both ads are active and can be retrieved via:
```sql
SELECT * FROM ads WHERE active = true;
```

The ads will automatically appear in the frontend ad system when users visit the site.
