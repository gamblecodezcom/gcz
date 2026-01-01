-- ============================================
-- BUG REPORT SYSTEM (FINAL)
-- ============================================

-- Main bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    role TEXT,                     -- user | admin
    surface TEXT,                  -- website | telegram | bot | admin-panel | other
    issue_type TEXT,               -- ui | bug | performance | payment | login | other
    severity TEXT,                 -- low | medium | high | critical
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'open',    -- open | in_progress | resolved | closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional FK if users table exists
ALTER TABLE bug_reports
    ADD CONSTRAINT bug_reports_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bug_reports_status
    ON bug_reports (status);

CREATE INDEX IF NOT EXISTS idx_bug_reports_created
    ON bug_reports (created_at DESC);


-- Admin actions on bug reports
CREATE TABLE IF NOT EXISTS bug_report_actions (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    admin_id BIGINT,
    action TEXT NOT NULL,          -- comment | assign | close | resolve | escalate
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bug_report_actions
    ADD CONSTRAINT bug_report_actions_fk
    FOREIGN KEY (report_id)
    REFERENCES bug_reports(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bug_report_actions_report
    ON bug_report_actions (report_id);
