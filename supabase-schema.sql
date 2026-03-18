-- ============================================
-- Meridian Travel — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Tokens table (GHL OAuth tokens per location)
CREATE TABLE IF NOT EXISTS tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  app_id TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  user_type TEXT DEFAULT 'Location',
  company_id TEXT,
  user_id TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '23 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, app_id)
);

-- 2. Itineraries table (stores full itinerary JSON per location)
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  -- uid() generates a 13-digit number (Date.now-based). INTEGER would overflow.
  -- Use BIGINT (64-bit) to support uid() values.
  itinerary_id BIGINT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, itinerary_id)
);

-- Index for fast lookup by location
CREATE INDEX IF NOT EXISTS idx_itineraries_location ON itineraries(location_id);

-- If the table already exists with itinerary_id INTEGER, migrate it to BIGINT.
-- (Safe for values already stored because bigint is a wider type.)
ALTER TABLE itineraries
  ALTER COLUMN itinerary_id TYPE BIGINT;

-- 3. Settings table (per-location settings: pipelines, agency profile, etc.)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL UNIQUE,
  agency_profile JSONB DEFAULT '{}',
  pipelines JSONB DEFAULT '[]',
  active_pipeline_id INTEGER DEFAULT 1,
  booking_sources JSONB DEFAULT '["GDS","Direct","Amex","Viator","Online"]',
  suppliers JSONB DEFAULT '["Delta","ANA","Emirates","Air France","Kenya Airways"]',
  custom_fields JSONB DEFAULT '[]',
  checklist_templates JSONB DEFAULT '[]',
  financial_config JSONB DEFAULT '{}',
  automation_rules JSONB DEFAULT '[]',
  dash_widgets JSONB DEFAULT '[]',
  packages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tokens_updated_at BEFORE UPDATE ON tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Enable RLS (Row Level Security) — adjust policies as needed
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
CREATE POLICY "Service role full access" ON tokens FOR ALL USING (true);
CREATE POLICY "Service role full access" ON itineraries FOR ALL USING (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true);
