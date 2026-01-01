-- ============================================================
-- UPDATE ENTRY_SOURCES DEFAULT VALUE
-- Updates the default JSONB value for entry_sources column
-- to match the specification with proper spacing
-- ============================================================

ALTER TABLE raffles 
ALTER COLUMN entry_sources 
SET DEFAULT '["daily_checkin", "wheel", "secret_code", "manual"]'::jsonb;
