-- Migration: Add Top Pick Config, Ads, and Contact Messages tables
-- PostgreSQL version

-- Top Pick Configuration table
CREATE TABLE IF NOT EXISTS top_pick_config (
    id SERIAL PRIMARY KEY,
    affiliate_id BIGINT REFERENCES affiliates(id) ON DELETE SET NULL,
    hero_title VARCHAR(500) NOT NULL DEFAULT 'Top Pick',
    hero_subtitle TEXT,
    background_color VARCHAR(50) DEFAULT '#0a0a0a',
    background_image_url VARCHAR(500),
    highlight_color VARCHAR(50) DEFAULT '#00eaff',
    description_blocks JSONB DEFAULT '[]'::jsonb,
    bonus_code_section JSONB DEFAULT '{}'::jsonb,
    cta_buttons JSONB DEFAULT '[]'::jsonb,
    why_section JSONB DEFAULT '{}'::jsonb,
    pros_cons_section JSONB DEFAULT '{}'::jsonb,
    faq_section JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_top_pick_config_active ON top_pick_config(is_active) WHERE is_active = true;

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    background_color VARCHAR(50) DEFAULT '#1a1a1a',
    glow_color VARCHAR(50) DEFAULT '#00eaff',
    footer_text VARCHAR(200),
    bonus_code VARCHAR(64),
    button1_label VARCHAR(100),
    button1_url VARCHAR(500),
    button2_label VARCHAR(100),
    button2_url VARCHAR(500),
    weight INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ads_weight ON ads(weight DESC);

-- Contact Messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(256) NOT NULL,
    telegram_handle VARCHAR(100),
    cwallet_id VARCHAR(256),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);

-- Newsletter subscriptions (PostgreSQL version - if not exists)
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(256) UNIQUE NOT NULL,
    cwallet_id VARCHAR(256),
    telegram_handle VARCHAR(100),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);

-- Raffles table (PostgreSQL version - if not exists)
CREATE TABLE IF NOT EXISTS raffles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    prize VARCHAR(200) NOT NULL,
    secret_password VARCHAR(256) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    winner_user_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    passcode_hash VARCHAR(256),
    social_phrase VARCHAR(500),
    reveal_phrase BOOLEAN DEFAULT false,
    require_newsletter BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_raffles_active ON raffles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_raffles_public ON raffles(is_public) WHERE is_public = true;

-- Raffle entries table (PostgreSQL version - if not exists)
CREATE TABLE IF NOT EXISTS raffle_entries (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER REFERENCES raffles(id) ON DELETE CASCADE,
    user_id INTEGER,
    telegram_user_id BIGINT,
    email VARCHAR(256),
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(raffle_id, COALESCE(user_id, telegram_user_id, email))
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle ON raffle_entries(raffle_id);

-- Data Ripper Jobs table
CREATE TABLE IF NOT EXISTS data_ripper_jobs (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    raw_data JSONB,
    ai_review JSONB,
    ai_suggestions JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ripper_status ON data_ripper_jobs(status);
