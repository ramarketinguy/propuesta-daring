PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date ON analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_date ON analytics_events(visitor_id, created_at);
