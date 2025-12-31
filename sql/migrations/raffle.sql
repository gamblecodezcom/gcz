CREATE TABLE IF NOT EXISTS raffles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    hidden BOOLEAN DEFAULT FALSE,
    secret BOOLEAN DEFAULT FALSE,
    secret_code TEXT,
    raffle_type TEXT DEFAULT 'manual',
    num_winners INTEGER DEFAULT 1,
    allow_repeat_winners BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    prize_type TEXT,
    prize_value TEXT,
    prize_site_id INTEGER,
    sponsor_site TEXT,
    sponsor_campaign_id INTEGER,
    entry_sources JSONB DEFAULT '["daily_checkin","wheel","secret_code","manual"]'::jsonb,
    entries_per_source JSONB DEFAULT '{"wheel":5,"manual":0,"secret_code":10,"daily_checkin":1}'::jsonb,
    winner_selection_method TEXT DEFAULT 'random',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_entries (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_winners (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    prize_type TEXT,
    cwallet_claim_url TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_prize_urls (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    assigned_to_user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS endless_raffle_links (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    next_raffle_id INTEGER REFERENCES raffles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_admin_actions (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER,
    admin_user TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE raffles ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS secret BOOLEAN DEFAULT FALSE;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS secret_code TEXT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS num_winners INTEGER DEFAULT 1;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS prize_type TEXT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS prize_value TEXT;

ALTER TABLE raffle_winners ADD COLUMN IF NOT EXISTS cwallet_claim_url TEXT;
END FILE