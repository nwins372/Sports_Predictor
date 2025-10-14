import { useState, useEffect, useCallback, useRef } from 'react';
import schedulerService from '../services/schedulerService';
import sportsAPI from '../services/sportsAPI';

// Custom hook for managing automatic score updates
export const useScoreUpdates = (sport, enabled = true) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [error, setError] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const updateCallbackRef = useRef(null);

  // Update callback function
  const updateScores = useCallback(async () => {
    if (isUpdating) {
      console.log(`Score update already in progress for ${sport}`);
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      console.log(`Starting score update for ${sport}`);
      
      // Fetch fresh data from the API
      let freshData = [];
      switch (sport.toLowerCase()) {
        case 'nfl':
          freshData = await sportsAPI.fetchNFLData();
          break;
        case 'nba':
          freshData = await sportsAPI.fetchNBAData();
          break;
        case 'mlb':
          freshData = await sportsAPI.fetchMLBData();
          break;
        default:
          console.warn(`Unknown sport: ${sport}`);
          return;
      }

      // Filter for today's games
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysGames = freshData.filter(game => {
        const gameDate = new Date(game.DateUtc);
        return gameDate >= today && gameDate < tomorrow;
      });

      console.log(`Found ${todaysGames.length} games for today in ${sport}`);

      // Update the callback with fresh data
      if (updateCallbackRef.current) {
        updateCallbackRef.current(todaysGames);
      }

      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      
      console.log(`Successfully updated scores for ${sport}`);
    } catch (err) {
      console.error(`Error updating scores for ${sport}:`, err);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }, [sport, isUpdating]);

  // Register with scheduler service
  useEffect(() => {
    if (!enabled || !sport) return;

    console.log(`Registering ${sport} with scheduler service`);
    
    // Create daily reset callback that forces a fresh update
    const dailyResetCallback = () => {
      console.log(`Daily reset triggered for ${sport} - forcing fresh data load`);
      updateScores();
    };
    
    schedulerService.registerSport(sport, updateScores, dailyResetCallback);

    // Get initial scheduler status
    setSchedulerStatus(schedulerService.getStatus());

    return () => {
      console.log(`Unregistering ${sport} from scheduler service`);
      schedulerService.unregisterSport(sport);
    };
  }, [sport, enabled, updateScores]);

  // Start scheduler when component mounts
  useEffect(() => {
    if (enabled) {
      schedulerService.start();
    }

    return () => {
      // Don't stop the scheduler here as other components might be using it
      // The scheduler will be stopped when the last component unregisters
    };
  }, [enabled]);

  // Update scheduler status periodically
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setSchedulerStatus(schedulerService.getStatus());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(statusInterval);
  }, []);

  // Set the callback function for receiving updated data
  const setUpdateCallback = useCallback((callback) => {
    updateCallbackRef.current = callback;
  }, []);

  // Force an immediate update
  const forceUpdate = useCallback(() => {
    schedulerService.forceUpdateSport(sport);
  }, [sport]);

  // Get time until next update
  const getTimeUntilNextUpdate = useCallback(() => {
    return schedulerService.getFormattedTimeUntilNextUpdate();
  }, []);

  return {
    isUpdating,
    lastUpdate,
    updateCount,
    error,
    schedulerStatus,
    setUpdateCallback,
    forceUpdate,
    getTimeUntilNextUpdate,
    updateScores
  };
};

// Hook for managing today's games specifically
export const useTodaysGames = (sport) => {
  const [todaysGames, setTodaysGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const { setUpdateCallback, ...scoreUpdateProps } = useScoreUpdates(sport, true);

  // Set up the callback to receive updated games
  useEffect(() => {
    setUpdateCallback((games) => {
      setTodaysGames(games);
      setIsLoading(false);
    });
  }, [setUpdateCallback]);

  // Function to load games for a specific date
  const loadGamesForDate = useCallback(async (date) => {
    setIsLoading(true);
    setError(null);

    try {
      let games = [];
      switch (sport.toLowerCase()) {
        case 'nfl':
          games = await sportsAPI.fetchNFLData();
          break;
        case 'nba':
          games = await sportsAPI.fetchNBAData();
          break;
        case 'mlb':
          games = await sportsAPI.fetchMLBData();
          break;
        default:
          throw new Error(`Unknown sport: ${sport}`);
      }

      // Filter for the specified date's games
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const filteredGames = games.filter(game => {
        const gameDate = new Date(game.DateUtc);
        return gameDate >= targetDate && gameDate < nextDay;
      });

      setTodaysGames(filteredGames);
      setIsLoading(false);
      
      console.log(`Loaded ${filteredGames.length} games for ${targetDate.toDateString()} in ${sport}`);
    } catch (err) {
      console.error(`Error loading games for ${date.toDateString()} in ${sport}:`, err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [sport]);

  // Initial load
  useEffect(() => {
    if (sport) {
      loadGamesForDate(currentDate);
    }
  }, [sport, currentDate, loadGamesForDate]);

  // Set up midnight update functionality
  useEffect(() => {
    const checkForDateChange = () => {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      // Check if the date has changed
      if (today.getTime() !== currentDate.getTime()) {
        console.log('Date changed detected - updating to new day');
        setCurrentDate(today);
        // The useEffect above will trigger loadGamesForDate with the new date
      }
    };

    // Check every minute for date changes
    const dateCheckInterval = setInterval(checkForDateChange, 60000);
    
    // Also check immediately when the component mounts
    checkForDateChange();

    return () => clearInterval(dateCheckInterval);
  }, [currentDate]);

  return {
    todaysGames,
    isLoading,
    error,
    ...scoreUpdateProps
  };
};

export default useScoreUpdates;
