-- Migration to add favorite_teams column to user_preferences table
-- Run this SQL in your Supabase SQL Editor

-- Add favorite_teams column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS favorite_teams JSONB DEFAULT '{}';

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_favorite_teams 
ON user_preferences USING GIN (favorite_teams);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Optional: Update existing records to have empty favorite_teams object
UPDATE user_preferences 
SET favorite_teams = '{}' 
WHERE favorite_teams IS NULL;
