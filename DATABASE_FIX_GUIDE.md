# Database Fix Guide: Adding favorite_teams Column

## Issue
You're getting the error: `Could not find the 'favorite_teams' column of 'user_preferences' in the schema cache`

This happens because the `favorite_teams` column doesn't exist in your Supabase `user_preferences` table yet.

## Solution

### Step 1: Run the SQL Migration

1. Go to your Supabase dashboard
2. Navigate to the **SQL Editor** (in the left sidebar)
3. Copy and paste the contents of `database_migration.sql` into a new query
4. Click **Run** to execute the migration

### Step 2: Verify the Column Was Added

After running the migration, you can verify the column exists by running this query:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see `favorite_teams` listed as a `jsonb` column.

### Step 3: Test the Profile Functionality

1. Go back to your React app
2. Navigate to the Profile page
3. Try selecting sports and teams
4. The error should be resolved

## Expected Database Schema

After the migration, your `user_preferences` table should have these columns:

- `user_id` (UUID, Primary Key)
- `sports_prefs` (TEXT[], Array of selected sports)
- `favorite_teams` (JSONB, Object with sport->teams mapping)

## Sample Data Structure

The `favorite_teams` column will store data like this:

```json
{
  "NFL": ["Buffalo Bills", "Kansas City Chiefs"],
  "NBA": ["Los Angeles Lakers", "Golden State Warriors"],
  "MLB": ["New York Yankees", "Boston Red Sox"],
  "College Sports": ["Alabama Crimson Tide", "Georgia Bulldogs"]
}
```

## Features That Will Work After Fix

1. ✅ **Team Selection**: Users can select favorite teams for each sport
2. ✅ **Auto-Selection**: Favorite teams are automatically selected when switching sports
3. ✅ **Visual Indicators**: Favorite teams are marked with ⭐ in dropdowns
4. ✅ **Priority Ordering**: Favorite teams appear first in team selection dropdowns
5. ✅ **Database Persistence**: Team selections are saved to and loaded from the database

## Troubleshooting

If you still get errors after running the migration:

1. **Clear browser cache** - Sometimes the schema cache needs to be refreshed
2. **Check Supabase logs** - Look for any errors in the Supabase dashboard
3. **Verify table permissions** - Make sure your RLS policies allow access to the column
4. **Restart your React app** - Sometimes a restart helps with schema changes

## Alternative: Manual Column Addition

If the migration script doesn't work, you can manually add the column:

1. Go to **Table Editor** in Supabase
2. Find the `user_preferences` table
3. Click **Add Column**
4. Set:
   - **Name**: `favorite_teams`
   - **Type**: `jsonb`
   - **Default value**: `{}`
   - **Allow nullable**: No
5. Click **Save**
