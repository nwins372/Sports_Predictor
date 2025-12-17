# Automatic Score Updates and Win Percentage Predictions

This document describes the new features added to the Sports Predictor application for automatic score updates and win percentage predictions.

## Features Implemented

### 1. Automatic Score Updates
- **Hourly Updates**: Games are automatically updated every hour between 11 AM and 9 PM
- **Real-time Data**: Uses ESPN API to fetch live game data
- **Smart Scheduling**: Only updates during active game hours to save resources
- **Multiple Sports**: Supports NFL, NBA, and MLB

### 2. Win Percentage Predictions
- **Live Predictions**: Shows win probability for upcoming and live games
- **Past Game Analysis**: Displays predictions vs actual results for completed games
- **Team Statistics**: Uses current season win percentages and records
- **Home Field Advantage**: Accounts for home team advantage in calculations

### 3. Enhanced UI Components
- **Score Update Status**: Shows current update status and next scheduled update
- **Win Percentage Display**: Visual representation of team win probabilities
- **Live Game Indicators**: Special styling for games currently in progress
- **Prediction Accuracy**: Shows whether predictions were correct for past games

## Technical Implementation

### Files Added/Modified

#### New Services
- `src/services/schedulerService.js` - Manages automatic score updates
- `src/hooks/useScoreUpdates.js` - React hook for score update functionality

#### New Components
- `src/components/WinPercentageDisplay.jsx` - Displays win probability predictions
- `src/components/ScoreUpdateStatus.jsx` - Shows update status and controls

#### Updated Components
- `src/pages/Schedules.jsx` - Integrated score updates and win percentage display
- `src/components/ScheduleBar.jsx` - Added live data integration
- `src/pages/Schedules.css` - Added styling for new components

### Key Features

#### Scheduler Service
```javascript
// Start automatic updates
schedulerService.start();

// Register a sport for updates
schedulerService.registerSport('NFL', updateCallback);

// Force immediate update
schedulerService.forceUpdateSport('NFL');
```

#### Score Update Hook
```javascript
const { 
  todaysGames, 
  isLoading, 
  forceUpdate,
  lastUpdate 
} = useTodaysGames('NFL');
```

#### Win Percentage Display
```javascript
<WinPercentageDisplay
  homeTeam="Kansas City Chiefs"
  awayTeam="Buffalo Bills"
  homeScore={14}
  awayScore={10}
  homeWinProb={65}
  awayWinProb={35}
  gameStatus="Final"
  showActualResult={true}
/>
```

## Usage

### For Today's Games
1. Navigate to the Schedules page
2. Today's games will automatically update every hour between 11 AM and 9 PM
3. Win percentage predictions are shown for each game
4. Use the "Force Update" button to get immediate updates

### For Past Games
1. Select a team from the past games section
2. View historical games with win percentage predictions
3. See prediction accuracy (correct/incorrect) for completed games

### Score Update Status
- Green dot: Updates are active and working
- Yellow dot: Updates are in standby mode
- Gray dot: Updates are inactive
- Click to expand and see detailed status information

## Configuration

### Update Schedule
The default update hours are 11 AM to 9 PM. This can be modified in the scheduler service:

```javascript
schedulerService.setUpdateHours([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
```

### API Configuration
The system uses ESPN API as the primary data source with fallback to static data. API endpoints are configured in `src/services/sportsAPI.js`.

## Error Handling

- **API Failures**: Falls back to static data if live API is unavailable
- **Network Issues**: Retries failed requests with exponential backoff
- **Invalid Data**: Validates game data before processing
- **Cache Management**: Automatically clears stale cached data

## Performance Considerations

- **Caching**: Game data is cached to reduce API calls
- **Selective Updates**: Only updates games for the current day
- **Background Processing**: Updates run in the background without blocking UI
- **Memory Management**: Automatically cleans up old data and intervals

## Testing

Run the test file to verify functionality:

```bash
node src/test/scoreUpdateTest.js
```

This will test:
- Scheduler service registration
- Sports API data fetching
- Win percentage calculations
- Component integration

## Future Enhancements

- **Push Notifications**: Notify users of score changes
- **Custom Update Intervals**: Allow users to set their own update frequency
- **Advanced Predictions**: Use machine learning for more accurate predictions
- **Historical Analysis**: Track prediction accuracy over time
- **Multi-language Support**: Support for different languages and regions

## Troubleshooting

### Common Issues

1. **Updates Not Working**
   - Check if scheduler is active in the status display
   - Verify network connection
   - Check browser console for errors

2. **Incorrect Predictions**
   - Predictions are based on current season statistics
   - Home field advantage is factored in
   - Predictions may not account for injuries or other factors

3. **Missing Games**
   - Some games may not be available in the API
   - Check if the game date is correct
   - Verify the sport is supported (NFL, NBA, MLB)

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

This will show detailed logs in the browser console.
