-- Migration to add followed_players and followed_teams columns to users table
-- Run this SQL in your Supabase SQL Editor

-- Add followed_players and followed_teams columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followed_players TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS followed_teams TEXT[] DEFAULT '{}';

-- Create indexes for better performance on array queries
CREATE INDEX IF NOT EXISTS idx_users_followed_players 
ON users USING GIN (followed_players);

CREATE INDEX IF NOT EXISTS idx_users_followed_teams 
ON users USING GIN (followed_teams);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- If you need to add RLS policy for users to read/update their own followed columns:
-- CREATE POLICY "Users can update their own followed items" ON users
--     FOR UPDATE USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);

-- CREATE POLICY "Users can view their own data" ON users
--     FOR SELECT USING (auth.uid() = id);
