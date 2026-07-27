-- Migration: Add Google OAuth support
-- Run this in your Supabase SQL editor or psql

-- 1. Add Google OAuth columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Make password, phone_number, and aadhar_number nullable
--    (Google users won't have these initially)
ALTER TABLE users
  ALTER COLUMN password DROP NOT NULL,
  ALTER COLUMN phone_number DROP NOT NULL,
  ALTER COLUMN aadhar_number DROP NOT NULL;

-- 3. Add index for faster google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Verify changes
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;
