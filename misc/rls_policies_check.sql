-- Check and update RLS policies for user_preferences table
-- Run this after adding the favorite_teams column

-- Check current RLS policies on user_preferences table
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
WHERE tablename = 'user_preferences';

-- If you need to update existing policies to include favorite_teams column:
-- (Only run these if you have existing policies that need updating)

-- Example: Update a policy that allows users to manage their own preferences
-- DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
-- CREATE POLICY "Users can manage their own preferences" ON user_preferences
--     FOR ALL USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- Verify the table structure after migration
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;
