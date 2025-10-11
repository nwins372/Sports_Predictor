// Scheduler Service for automatic score updates
class SchedulerService {
  constructor() {
    this.intervals = new Map();
    this.callbacks = new Map();
    this.isActive = false;
    this.updateHours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // 11 AM to 9 PM
    this.lastUpdate = null;
    this.updateFrequency = 60 * 60 * 1000; // 1 hour in milliseconds
    this.dailyResetTime = 0; // Midnight (0:00)
    this.lastDailyReset = null;
    this.dailyResetCallbacks = new Map(); // Callbacks for daily reset
  }

  // Start the scheduler
  start() {
    if (this.isActive) {
      console.log('Scheduler is already active');
      return;
    }

    this.isActive = true;
    console.log('Starting scheduler service for hourly score updates');
    
    // Set up the main interval check
    this.mainInterval = setInterval(() => {
      this.checkAndUpdate();
    }, 60000); // Check every minute

    // Initial check
    this.checkAndUpdate();
  }

  // Stop the scheduler
  stop() {
    if (!this.isActive) {
      console.log('Scheduler is not active');
      return;
    }

    this.isActive = false;
    console.log('Stopping scheduler service');
    
    if (this.mainInterval) {
      clearInterval(this.mainInterval);
      this.mainInterval = null;
    }

    // Clear all sport-specific intervals
    this.intervals.forEach((interval, sport) => {
      clearInterval(interval);
      console.log(`Cleared interval for ${sport}`);
    });
    this.intervals.clear();
  }

  // Check if it's time to update and trigger updates
  checkAndUpdate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for daily reset at midnight
    this.checkDailyReset();
    
    // Check if current hour is in our update hours
    if (this.updateHours.includes(currentHour)) {
      // Check if we haven't updated in the last hour
      if (!this.lastUpdate || (now - this.lastUpdate) >= this.updateFrequency) {
        console.log(`Triggering score updates at ${currentHour}:00`);
        this.triggerUpdates();
        this.lastUpdate = now;
      }
    }
  }

  // Check if it's time for daily reset
  checkDailyReset() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's midnight (0:00) and we haven't reset today
    if (currentHour === this.dailyResetTime && currentMinute === 0) {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      // Only reset if we haven't reset today yet
      if (!this.lastDailyReset || this.lastDailyReset.getTime() !== today.getTime()) {
        console.log('Triggering daily reset at midnight');
        this.triggerDailyReset();
        this.lastDailyReset = today;
      }
    }
  }

  // Trigger updates for all registered sports
  triggerUpdates() {
    this.callbacks.forEach((callback, sport) => {
      try {
        console.log(`Updating scores for ${sport}`);
        callback();
      } catch (error) {
        console.error(`Error updating scores for ${sport}:`, error);
      }
    });
  }

  // Trigger daily reset for all registered sports
  triggerDailyReset() {
    this.dailyResetCallbacks.forEach((callback, sport) => {
      try {
        console.log(`Triggering daily reset for ${sport}`);
        callback();
      } catch (error) {
        console.error(`Error in daily reset for ${sport}:`, error);
      }
    });
  }

  // Register a sport for automatic updates
  registerSport(sport, updateCallback, dailyResetCallback = null) {
    if (typeof updateCallback !== 'function') {
      throw new Error('Update callback must be a function');
    }

    console.log(`Registering ${sport} for automatic score updates`);
    this.callbacks.set(sport, updateCallback);

    // Register daily reset callback if provided
    if (dailyResetCallback && typeof dailyResetCallback === 'function') {
      console.log(`Registering ${sport} for daily reset`);
      this.dailyResetCallbacks.set(sport, dailyResetCallback);
    }

    // If scheduler is active, start updates for this sport
    if (this.isActive) {
      this.startSportUpdates(sport);
    }
  }

  // Unregister a sport
  unregisterSport(sport) {
    console.log(`Unregistering ${sport} from automatic score updates`);
    this.callbacks.delete(sport);
    this.dailyResetCallbacks.delete(sport);
    
    if (this.intervals.has(sport)) {
      clearInterval(this.intervals.get(sport));
      this.intervals.delete(sport);
    }
  }

  // Start updates for a specific sport
  startSportUpdates(sport) {
    if (this.intervals.has(sport)) {
      clearInterval(this.intervals.get(sport));
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (this.updateHours.includes(currentHour)) {
        const callback = this.callbacks.get(sport);
        if (callback) {
          try {
            console.log(`Hourly update for ${sport}`);
            callback();
          } catch (error) {
            console.error(`Error in hourly update for ${sport}:`, error);
          }
        }
      }
    }, this.updateFrequency);

    this.intervals.set(sport, interval);
  }

  // Get scheduler status
  getStatus() {
    return {
      isActive: this.isActive,
      registeredSports: Array.from(this.callbacks.keys()),
      activeIntervals: this.intervals.size,
      lastUpdate: this.lastUpdate,
      updateHours: this.updateHours,
      nextUpdate: this.getNextUpdateTime(),
      dailyResetTime: this.dailyResetTime,
      lastDailyReset: this.lastDailyReset,
      registeredDailyResets: Array.from(this.dailyResetCallbacks.keys()),
      nextDailyReset: this.getNextDailyResetTime()
    };
  }

  // Get next scheduled update time
  getNextUpdateTime() {
    if (!this.isActive) return null;

    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next update hour
    const nextHour = this.updateHours.find(hour => hour > currentHour);
    
    if (nextHour) {
      const nextUpdate = new Date(now);
      nextUpdate.setHours(nextHour, 0, 0, 0);
      return nextUpdate;
    } else {
      // Next update is tomorrow at 11 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      return tomorrow;
    }
  }

  // Get next daily reset time
  getNextDailyResetTime() {
    if (!this.isActive) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If it's before midnight today
    if (currentHour < this.dailyResetTime || 
        (currentHour === this.dailyResetTime && currentMinute === 0)) {
      const today = new Date(now);
      today.setHours(this.dailyResetTime, 0, 0, 0);
      return today;
    } else {
      // Next reset is tomorrow at midnight
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(this.dailyResetTime, 0, 0, 0);
      return tomorrow;
    }
  }

  // Force an immediate update for all sports
  forceUpdate() {
    console.log('Forcing immediate score update for all sports');
    this.triggerUpdates();
    this.lastUpdate = new Date();
  }

  // Force an immediate update for a specific sport
  forceUpdateSport(sport) {
    const callback = this.callbacks.get(sport);
    if (callback) {
      console.log(`Forcing immediate score update for ${sport}`);
      try {
        callback();
      } catch (error) {
        console.error(`Error in forced update for ${sport}:`, error);
      }
    } else {
      console.warn(`No callback registered for ${sport}`);
    }
  }

  // Update the update hours
  setUpdateHours(hours) {
    if (!Array.isArray(hours)) {
      throw new Error('Update hours must be an array');
    }
    
    this.updateHours = hours.sort((a, b) => a - b);
    console.log(`Updated scheduler hours to: ${this.updateHours.join(', ')}`);
  }

  // Check if scheduler should be active based on current time
  shouldBeActive() {
    const now = new Date();
    const currentHour = now.getHours();
    return this.updateHours.includes(currentHour);
  }

  // Get time until next update
  getTimeUntilNextUpdate() {
    const nextUpdate = this.getNextUpdateTime();
    if (!nextUpdate) return null;
    
    const now = new Date();
    return nextUpdate - now;
  }

  // Format time until next update
  getFormattedTimeUntilNextUpdate() {
    const timeUntil = this.getTimeUntilNextUpdate();
    if (!timeUntil) return 'N/A';
    
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
export default schedulerService;
