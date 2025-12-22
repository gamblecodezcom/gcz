-- Additional indexes for performance optimization

-- Affiliates: full-text search on name and tags
ALTER TABLE affiliates ADD FULLTEXT idx_search (name, tags);

-- Conversions: compound index for date range queries
ALTER TABLE conversions ADD INDEX idx_affiliate_date (affiliate_id, occurred_at DESC);

-- Broadcasts: compound for scheduled processing
ALTER TABLE broadcasts ADD INDEX idx_pending_schedule (status, schedule_at);

-- Auto responses: optimize trigger matching
ALTER TABLE auto_responses ADD INDEX idx_active_triggers (status, trigger_type, trigger_value);

-- Activity log: composite for reporting
ALTER TABLE activity_log ADD INDEX idx_actor_action_date (actor, action, created_at DESC);
