CREATE TABLE IF NOT EXISTS spin_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);