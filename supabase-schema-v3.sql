-- AI Project CRM Database Schema v3 - API Keys
-- Run this in your Supabase SQL Editor

-- =====================
-- API KEYS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  service TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  notes TEXT,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for api_keys updated_at
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service);
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(name);
