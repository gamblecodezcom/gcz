-- GambleCodez Database Initialization
-- Run: mysql -u gcadmin -p gamblecodez < sql/001_init.sql

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    handle VARCHAR(190) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL,
    status ENUM('active','paused','banned') NOT NULL DEFAULT 'active',
    region ENUM('usa','non-us','global') NOT NULL DEFAULT 'usa',
    tags TEXT NULL COMMENT 'Comma-separated: casino,sweeps,faucet,etc',
    referral_code VARCHAR(64) NOT NULL UNIQUE,
    referral_url VARCHAR(500) NOT NULL,
    telegram_user_id BIGINT NULL,
    telegram_username VARCHAR(64) NULL,
    telegram_webapp_url VARCHAR(500) NULL,
    bonus VARCHAR(190) NULL,
    bonus_code VARCHAR(64) NULL,
    priority INT NOT NULL DEFAULT 0,
    is_top_pick TINYINT(1) NOT NULL DEFAULT 0,
    instant_redemption TINYINT(1) NOT NULL DEFAULT 0,
    kyc_required TINYINT(1) NOT NULL DEFAULT 1,
    level INT NOT NULL DEFAULT 1 COMMENT '1-5, Gemified=4',
    description TEXT NULL,
    features JSON NULL,
    conversions INT NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_region (region),
    INDEX idx_telegram (telegram_user_id),
    INDEX idx_priority (priority DESC),
    INDEX idx_top_pick (is_top_pick DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    status ENUM('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
    payout_model ENUM('cpa','revshare','hybrid') NOT NULL,
    cpa_amount DECIMAL(10,2) NULL,
    revshare_percent DECIMAL(5,2) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_conversions INT NULL,
    current_conversions INT NOT NULL DEFAULT 0,
    description TEXT NULL,
    terms TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversions table
CREATE TABLE IF NOT EXISTS conversions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    campaign_id BIGINT UNSIGNED NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
    external_tx_id VARCHAR(190) NULL,
    meta JSON NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    approved_by VARCHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (status),
    INDEX idx_occurred (occurred_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross DECIMAL(10,2) NOT NULL,
    fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net DECIMAL(10,2) NOT NULL,
    status ENUM('calculated','approved','paid','failed') NOT NULL DEFAULT 'calculated',
    payment_method VARCHAR(64) NULL,
    payment_details TEXT NULL,
    approved_at DATETIME NULL,
    approved_by VARCHAR(64) NULL,
    paid_at DATETIME NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by VARCHAR(64) NOT NULL COMMENT 'admin username or telegram_user_id',
    scope ENUM('channel','group','dm') NOT NULL,
    title VARCHAR(190) NULL,
    body_html TEXT NOT NULL,
    media JSON NULL COMMENT '{type:"photo"|"video", file_id:"...", caption:"..."}',
    buttons JSON NULL COMMENT '[{text:"Name", url:"https://..."}]',
    status ENUM('draft','scheduled','sent','paused','error') NOT NULL DEFAULT 'draft',
    schedule_at DATETIME NULL,
    recurring JSON NULL COMMENT '{freq:"daily"|"weekly", at:"HH:mm", dow:[1,3], tz:"UTC"}',
    sent_at DATETIME NULL,
    last_error TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_schedule (schedule_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto responses table
CREATE TABLE IF NOT EXISTS auto_responses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by VARCHAR(64) NOT NULL,
    trigger_type ENUM('command','keyword') NOT NULL,
    trigger_value VARCHAR(190) NOT NULL,
    match_mode ENUM('exact','contains','regex') NOT NULL DEFAULT 'exact',
    scope ENUM('group','channel','dm','any') NOT NULL DEFAULT 'any',
    body_html TEXT NOT NULL,
    media JSON NULL,
    buttons JSON NULL,
    deliver_mode ENUM('reply','dm','both') NOT NULL DEFAULT 'reply',
    status ENUM('active','paused') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_trigger (trigger_type, trigger_value, scope),
    INDEX idx_status (status),
    INDEX idx_trigger (trigger_type, trigger_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin flags table
CREATE TABLE IF NOT EXISTS admin_flags (
    telegram_user_id BIGINT UNSIGNED PRIMARY KEY,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    admin_mode TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=on, 0=off',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Telegram sessions table
CREATE TABLE IF NOT EXISTS telegram_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    telegram_user_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(64) NULL,
    first_name VARCHAR(64) NULL,
    last_name VARCHAR(64) NULL,
    email VARCHAR(190) NULL,
    region ENUM('us','nonus') NULL,
    webapp_session_id VARCHAR(64) NULL,
    consent_newsletter TINYINT(1) NOT NULL DEFAULT 0,
    meta JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_user (telegram_user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    k VARCHAR(190) PRIMARY KEY,
    v JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor VARCHAR(64) NOT NULL COMMENT 'username or telegram_user_id',
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NULL,
    entity_id BIGINT NULL,
    payload JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actor (actor),
    INDEX idx_action (action),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
