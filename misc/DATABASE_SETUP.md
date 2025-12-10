# Database Setup for Team Selection Feature

## Required Database Schema Changes

To support the new team selection feature, the `user_preferences` table needs to include a `favorite_teams` column.

### SQL Migration

```sql
-- Add favorite_teams column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN favorite_teams JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX idx_user_preferences_favorite_teams 
ON user_preferences USING GIN (favorite_teams);
```

### Expected Data Structure

The `favorite_teams` column should store a JSON object with the following structure:

```json
{
  "NFL": ["Buffalo Bills", "Kansas City Chiefs"],
  "NBA": ["Los Angeles Lakers", "Golden State Warriors"],
  "MLB": ["New York Yankees", "Boston Red Sox"],
  "College Sports": ["Alabama Crimson Tide", "Georgia Bulldogs"]
}
```

### Features Implemented

1. **Team Selection UI**: Users can select favorite teams for each sport in their profile
2. **Auto-Selection**: Favorite teams are automatically selected when switching sports on the Home page
3. **Visual Indicators**: Favorite teams are marked with ⭐ in dropdown menus
4. **Priority Ordering**: Favorite teams appear first in team selection dropdowns
5. **Database Persistence**: Team selections are saved to and loaded from the database

### Testing

To test the feature:

1. Log in to the application
2. Go to Profile page
3. Select sports and favorite teams
4. Save preferences
5. Go to Home page and verify favorite teams are auto-selected
6. Check that favorite teams appear with ⭐ in dropdowns

### Database Tables Used

- `user_preferences`: Stores user's sports preferences and favorite teams
  - `user_id`: UUID (primary key)
  - `sports_prefs`: TEXT[] (array of selected sports)
  - `favorite_teams`: JSONB (object with sport->teams mapping)
