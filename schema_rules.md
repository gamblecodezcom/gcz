# 🧠 GAMBLECODEZ — AFFILIATES MASTER SCHEMA (FINAL)

Authoritative reference for all GambleCodez affiliate imports, validation tools, SQL schema, and CSV headers.  
This file must be used by any CLI importers, validation bots, or admin CRUD panels.

────────────────────────────────────────────
📦 SQL TABLE: affiliates_master
────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliates_master (
  name TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  priority INTEGER NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  level INTEGER NOT NULL,
  date_added DATE NOT NULL,
  bonus_code TEXT,
  bonus_description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  resolved_domain TEXT NOT NULL,
  redemption_speed TEXT NOT NULL,
  redemption_minimum NUMERIC NOT NULL,
  redemption_type TEXT NOT NULL,
  created_by TEXT NOT NULL,
  source TEXT NOT NULL
);

────────────────────────────────────────────
🧩 CSV HEADERS (Canonical)
────────────────────────────────────────────

name,affiliate_url,priority,category,status,level,date_added,bonus_code,bonus_description,icon_url,resolved_domain,redemption_speed,redemption_minimum,redemption_type,created_by,source

────────────────────────────────────────────
✅ VALIDATION RULES
────────────────────────────────────────────

- Must have **exactly 16** columns per row.
- Must **not contain empty required fields**:
  - `name`, `affiliate_url`, `priority`, `category`, `status`, `level`, `date_added`, `bonus_description`, `icon_url`, `resolved_domain`, `redemption_speed`, `redemption_minimum`, `redemption_type`, `created_by`, `source`
- `bonus_code` is optional.
- Wrap any fields with commas in **double quotes**.
- `priority` and `level` must be valid integers.
- `date_added` must be in `YYYY-MM-DD` format.
- `redemption_minimum` must be a number (decimal OK).

────────────────────────────────────────────
🛡️ NORMALIZATION RULES
────────────────────────────────────────────

**Accepted Categories**:
- `Top Picks`
- `US Sweeps`
- `Crypto`
- `Faucet`
- `Lootbox`
- `Instant`
- `Recently Added`
- `Blacklist`
- `Test`

**Accepted Statuses**:
- `active`
- `paused`
- `removed`
- `blacklisted`

**Accepted Redemption Types**:
- `instant`
- `manual`
- `delayed`
- `tiered`

**Default Creator**: `AI Agent`
**Default Source**: `Manual Entry`

────────────────────────────────────────────
🔁 SQL MIGRATION COMMAND
────────────────────────────────────────────

Run this to add any missing fields:

```sql
ALTER TABLE affiliates_master
  ADD COLUMN IF NOT EXISTS resolved_domain TEXT,
  ADD COLUMN IF NOT EXISTS redemption_speed TEXT,
  ADD COLUMN IF NOT EXISTS redemption_minimum NUMERIC,
  ADD COLUMN IF NOT EXISTS redemption_type TEXT,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT;
