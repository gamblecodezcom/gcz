CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    site TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS promo_links (
    id TEXT PRIMARY KEY,
    site TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    verified BOOLEAN DEFAULT TRUE
);