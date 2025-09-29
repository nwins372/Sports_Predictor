import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import "./Schedules.css";

// Detailed game/match schedules for each sport
const GAME_SCHEDULES = {
  NFL: [
    // Week 1 Games
    { name: "Chiefs vs Bills", date: "2024-09-08", time: "8:20 PM", location: "Arrowhead Stadium, Kansas City", type: "Regular Season", week: "Week 1" },
    { name: "Eagles vs Cowboys", date: "2024-09-08", time: "4:25 PM", location: "Lincoln Financial Field, Philadelphia", type: "Regular Season", week: "Week 1" },
    { name: "Ravens vs Bengals", date: "2024-09-08", time: "1:00 PM", location: "M&T Bank Stadium, Baltimore", type: "Regular Season", week: "Week 1" },
    { name: "49ers vs Lions", date: "2024-09-08", time: "1:00 PM", location: "Levi's Stadium, Santa Clara", type: "Regular Season", week: "Week 1" },
    { name: "Dolphins vs Patriots", date: "2024-09-08", time: "1:00 PM", location: "Hard Rock Stadium, Miami", type: "Regular Season", week: "Week 1" },
    
    // Week 2 Games
    { name: "Bills vs Dolphins", date: "2024-09-15", time: "1:00 PM", location: "Highmark Stadium, Buffalo", type: "Regular Season", week: "Week 2" },
    { name: "Chiefs vs Ravens", date: "2024-09-15", time: "4:25 PM", location: "Arrowhead Stadium, Kansas City", type: "Regular Season", week: "Week 2" },
    { name: "Cowboys vs Eagles", date: "2024-09-15", time: "8:20 PM", location: "AT&T Stadium, Arlington", type: "Regular Season", week: "Week 2" },
    
    // Playoffs
    { name: "Wild Card Round", date: "2025-01-11", time: "TBD", location: "Various", type: "Playoffs", week: "Wild Card" },
    { name: "Divisional Round", date: "2025-01-18", time: "TBD", location: "Various", type: "Playoffs", week: "Divisional" },
    { name: "Conference Championships", date: "2025-01-26", time: "TBD", location: "Various", type: "Playoffs", week: "Conference" },
    { name: "Super Bowl LIX", date: "2025-02-09", time: "6:30 PM", location: "New Orleans, LA", type: "Championship", week: "Super Bowl" }
  ],
  NBA: [
    // Opening Night
    { name: "Lakers vs Warriors", date: "2024-10-22", time: "10:00 PM", location: "Crypto.com Arena, Los Angeles", type: "Regular Season", week: "Opening Night" },
    { name: "Celtics vs Heat", date: "2024-10-22", time: "7:30 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Opening Night" },
    
    // Key Matchups
    { name: "Lakers vs Celtics", date: "2024-12-25", time: "5:00 PM", location: "Crypto.com Arena, Los Angeles", type: "Regular Season", week: "Christmas Day" },
    { name: "Warriors vs Lakers", date: "2024-12-25", time: "8:00 PM", location: "Chase Center, San Francisco", type: "Regular Season", week: "Christmas Day" },
    { name: "Nuggets vs Lakers", date: "2024-11-15", time: "10:00 PM", location: "Ball Arena, Denver", type: "Regular Season", week: "Week 3" },
    { name: "Celtics vs Bucks", date: "2024-11-20", time: "7:30 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Week 4" },
    
    // All-Star Weekend
    { name: "NBA All-Star Game", date: "2025-02-16", time: "8:00 PM", location: "Chase Center, San Francisco", type: "All-Star", week: "All-Star Weekend" },
    { name: "3-Point Contest", date: "2025-02-15", time: "8:00 PM", location: "Chase Center, San Francisco", type: "All-Star", week: "All-Star Weekend" },
    { name: "Slam Dunk Contest", date: "2025-02-15", time: "9:00 PM", location: "Chase Center, San Francisco", type: "All-Star", week: "All-Star Weekend" },
    
    // Playoffs
    { name: "Play-In Tournament", date: "2025-04-15", time: "TBD", location: "Various", type: "Playoffs", week: "Play-In" },
    { name: "First Round", date: "2025-04-20", time: "TBD", location: "Various", type: "Playoffs", week: "First Round" },
    { name: "Conference Semifinals", date: "2025-05-06", time: "TBD", location: "Various", type: "Playoffs", week: "Semifinals" },
    { name: "Conference Finals", date: "2025-05-20", time: "TBD", location: "Various", type: "Playoffs", week: "Conference Finals" },
    { name: "NBA Finals", date: "2025-06-05", time: "TBD", location: "TBD", type: "Championship", week: "NBA Finals" }
  ],
  MLB: [
    // Opening Day
    { name: "Yankees vs Red Sox", date: "2024-03-28", time: "1:05 PM", location: "Yankee Stadium, New York", type: "Regular Season", week: "Opening Day" },
    { name: "Dodgers vs Padres", date: "2024-03-28", time: "4:10 PM", location: "Dodger Stadium, Los Angeles", type: "Regular Season", week: "Opening Day" },
    { name: "Braves vs Phillies", date: "2024-03-28", time: "7:20 PM", location: "Truist Park, Atlanta", type: "Regular Season", week: "Opening Day" },
    
    // Key Series
    { name: "Yankees vs Astros", date: "2024-04-15", time: "7:05 PM", location: "Yankee Stadium, New York", type: "Regular Season", week: "Week 3" },
    { name: "Dodgers vs Giants", date: "2024-04-20", time: "7:10 PM", location: "Dodger Stadium, Los Angeles", type: "Regular Season", week: "Week 3" },
    { name: "Red Sox vs Yankees", date: "2024-06-14", time: "7:05 PM", location: "Fenway Park, Boston", type: "Regular Season", week: "Week 12" },
    
    // All-Star Weekend
    { name: "MLB All-Star Game", date: "2024-07-16", time: "8:00 PM", location: "Globe Life Field, Arlington", type: "All-Star", week: "All-Star Weekend" },
    { name: "Home Run Derby", date: "2024-07-15", time: "8:00 PM", location: "Globe Life Field, Arlington", type: "All-Star", week: "All-Star Weekend" },
    
    // Playoffs
    { name: "Wild Card Series", date: "2024-10-01", time: "TBD", location: "Various", type: "Playoffs", week: "Wild Card" },
    { name: "Division Series", date: "2024-10-05", time: "TBD", location: "Various", type: "Playoffs", week: "Division Series" },
    { name: "Championship Series", date: "2024-10-15", time: "TBD", location: "Various", type: "Playoffs", week: "Championship Series" },
    { name: "World Series", date: "2024-10-26", time: "8:00 PM", location: "TBD", type: "Championship", week: "World Series" }
  ],
  "College Sports": [
    // College Football
    { name: "Alabama vs Georgia", date: "2024-09-07", time: "7:30 PM", location: "Bryant-Denny Stadium, Tuscaloosa", type: "Regular Season", week: "Week 1" },
    { name: "Ohio State vs Michigan", date: "2024-11-30", time: "12:00 PM", location: "Ohio Stadium, Columbus", type: "Regular Season", week: "Rivalry Week" },
    { name: "USC vs Notre Dame", date: "2024-10-12", time: "7:30 PM", location: "Los Angeles Memorial Coliseum", type: "Regular Season", week: "Week 7" },
    { name: "Auburn vs Alabama", date: "2024-11-30", time: "3:30 PM", location: "Jordan-Hare Stadium, Auburn", type: "Regular Season", week: "Iron Bowl" },
    
    // March Madness
    { name: "First Round", date: "2024-03-21", time: "TBD", location: "Various", type: "Tournament", week: "First Round" },
    { name: "Sweet 16", date: "2024-03-28", time: "TBD", location: "Various", type: "Tournament", week: "Sweet 16" },
    { name: "Elite 8", date: "2024-03-30", time: "TBD", location: "Various", type: "Tournament", week: "Elite 8" },
    { name: "Final Four", date: "2024-04-06", time: "TBD", location: "State Farm Stadium, Glendale", type: "Tournament", week: "Final Four" },
    { name: "National Championship", date: "2024-04-08", time: "9:00 PM", location: "State Farm Stadium, Glendale", type: "Championship", week: "National Championship" },
    
    // College Basketball
    { name: "Duke vs North Carolina", date: "2024-12-07", time: "7:00 PM", location: "Cameron Indoor Stadium, Durham", type: "Regular Season", week: "Week 3" },
    { name: "Kentucky vs Louisville", date: "2024-12-21", time: "2:00 PM", location: "Rupp Arena, Lexington", type: "Regular Season", week: "Week 6" },
    { name: "UCLA vs USC", date: "2024-12-14", time: "8:00 PM", location: "Pauley Pavilion, Los Angeles", type: "Regular Season", week: "Week 5" }
  ],
  Olympics: [
    { name: "Summer Olympics", date: "2024-07-26", location: "Paris, France", type: "Olympics" },
    { name: "Winter Olympics", date: "2026-02-06", location: "Milan-Cortina, Italy", type: "Olympics" },
    { name: "Paralympic Games", date: "2024-08-28", location: "Paris, France", type: "Paralympics" }
  ],
  Soccer: [
    // Premier League
    { name: "Manchester City vs Arsenal", date: "2024-08-17", time: "12:30 PM", location: "Etihad Stadium, Manchester", type: "Regular Season", week: "Matchday 1" },
    { name: "Liverpool vs Chelsea", date: "2024-08-18", time: "4:30 PM", location: "Anfield, Liverpool", type: "Regular Season", week: "Matchday 1" },
    { name: "Manchester United vs Tottenham", date: "2024-08-24", time: "3:00 PM", location: "Old Trafford, Manchester", type: "Regular Season", week: "Matchday 2" },
    
    // La Liga
    { name: "Real Madrid vs Barcelona", date: "2024-10-27", time: "4:00 PM", location: "Santiago Bernabéu, Madrid", type: "Regular Season", week: "El Clásico" },
    { name: "Barcelona vs Atletico Madrid", date: "2024-09-15", time: "3:00 PM", location: "Camp Nou, Barcelona", type: "Regular Season", week: "Matchday 4" },
    
    // Champions League
    { name: "Real Madrid vs PSG", date: "2024-09-17", time: "9:00 PM", location: "Santiago Bernabéu, Madrid", type: "Regular Season", week: "Group Stage" },
    { name: "Manchester City vs Bayern Munich", date: "2024-09-18", time: "9:00 PM", location: "Etihad Stadium, Manchester", type: "Regular Season", week: "Group Stage" },
    { name: "Champions League Final", date: "2025-05-31", time: "9:00 PM", location: "Wembley Stadium, London", type: "Championship", week: "Final" },
    
    // World Cup
    { name: "USA vs Mexico", date: "2026-06-11", time: "8:00 PM", location: "MetLife Stadium, New York", type: "World Cup", week: "Group Stage" },
    { name: "Brazil vs Argentina", date: "2026-06-15", time: "3:00 PM", location: "Rose Bowl, Pasadena", type: "World Cup", week: "Group Stage" }
  ],
  NHL: [
    // Opening Night
    { name: "Maple Leafs vs Canadiens", date: "2024-10-10", time: "7:00 PM", location: "Scotiabank Arena, Toronto", type: "Regular Season", week: "Opening Night" },
    { name: "Rangers vs Islanders", date: "2024-10-10", time: "7:30 PM", location: "Madison Square Garden, New York", type: "Regular Season", week: "Opening Night" },
    
    // Key Matchups
    { name: "Bruins vs Maple Leafs", date: "2024-11-15", time: "7:00 PM", location: "TD Garden, Boston", type: "Regular Season", week: "Week 6" },
    { name: "Oilers vs Flames", date: "2024-10-26", time: "10:00 PM", location: "Rogers Place, Edmonton", type: "Regular Season", week: "Battle of Alberta" },
    { name: "Penguins vs Capitals", date: "2024-12-07", time: "7:00 PM", location: "PPG Paints Arena, Pittsburgh", type: "Regular Season", week: "Week 10" },
    
    // All-Star Weekend
    { name: "NHL All-Star Game", date: "2025-02-01", time: "3:00 PM", location: "SAP Center, San Jose", type: "All-Star", week: "All-Star Weekend" },
    { name: "Skills Competition", date: "2025-01-31", time: "7:00 PM", location: "SAP Center, San Jose", type: "All-Star", week: "All-Star Weekend" },
    
    // Playoffs
    { name: "First Round", date: "2025-04-15", time: "TBD", location: "Various", type: "Playoffs", week: "First Round" },
    { name: "Second Round", date: "2025-05-01", time: "TBD", location: "Various", type: "Playoffs", week: "Second Round" },
    { name: "Conference Finals", date: "2025-05-15", time: "TBD", location: "Various", type: "Playoffs", week: "Conference Finals" },
    { name: "Stanley Cup Final", date: "2025-06-02", time: "8:00 PM", location: "TBD", type: "Championship", week: "Stanley Cup Final" }
  ],
  Tennis: [
    // Grand Slams
    { name: "Australian Open Final", date: "2024-01-28", time: "3:30 AM", location: "Rod Laver Arena, Melbourne", type: "Grand Slam", week: "Final" },
    { name: "French Open Final", date: "2024-06-09", time: "3:00 PM", location: "Court Philippe-Chatrier, Paris", type: "Grand Slam", week: "Final" },
    { name: "Wimbledon Final", date: "2024-07-14", time: "9:00 AM", location: "Centre Court, London", type: "Grand Slam", week: "Final" },
    { name: "US Open Final", date: "2024-09-08", time: "4:00 PM", location: "Arthur Ashe Stadium, New York", type: "Grand Slam", week: "Final" },
    
    // ATP Masters
    { name: "Indian Wells Final", date: "2024-03-17", time: "4:00 PM", location: "Indian Wells Tennis Garden, California", type: "Masters 1000", week: "Final" },
    { name: "Miami Open Final", date: "2024-03-31", time: "4:00 PM", location: "Hard Rock Stadium, Miami", type: "Masters 1000", week: "Final" },
    { name: "Monte Carlo Masters", date: "2024-04-14", time: "2:00 PM", location: "Monte Carlo Country Club, Monaco", type: "Masters 1000", week: "Final" }
  ],
  Golf: [
    // Major Championships
    { name: "Masters Tournament", date: "2024-04-14", time: "2:00 PM", location: "Augusta National Golf Club, Georgia", type: "Major", week: "Final Round" },
    { name: "PGA Championship", date: "2024-05-19", time: "2:00 PM", location: "Valhalla Golf Club, Kentucky", type: "Major", week: "Final Round" },
    { name: "US Open", date: "2024-06-16", time: "3:00 PM", location: "Pinehurst Resort, North Carolina", type: "Major", week: "Final Round" },
    { name: "British Open", date: "2024-07-21", time: "9:00 AM", location: "Royal Troon Golf Club, Scotland", type: "Major", week: "Final Round" },
    
    // PGA Tour Events
    { name: "Players Championship", date: "2024-03-17", time: "2:00 PM", location: "TPC Sawgrass, Florida", type: "PGA Tour", week: "Final Round" },
    { name: "Memorial Tournament", date: "2024-06-09", time: "2:00 PM", location: "Muirfield Village, Ohio", type: "PGA Tour", week: "Final Round" },
    { name: "FedEx Cup Playoffs", date: "2024-08-25", time: "2:00 PM", location: "East Lake Golf Club, Georgia", type: "PGA Tour", week: "Tour Championship" }
  ]
};

function Schedules() {
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    filterEvents();
  }, [selectedSport, selectedDate]);

  const filterEvents = () => {
    let events = [];
    
    if (selectedSport === "All") {
      Object.values(GAME_SCHEDULES).forEach(sportEvents => {
        events = [...events, ...sportEvents];
      });
    } else {
      events = GAME_SCHEDULES[selectedSport] || [];
    }

    // Filter by date if selected
    if (selectedDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        const selectedDateObj = new Date(selectedDate);
        return eventDate >= selectedDateObj;
      });
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    setFilteredEvents(events);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'Championship': '#e63946',
      'Playoffs': '#f77f00',
      'Regular Season': '#3b82f6',
      'All-Star': '#8338ec',
      'Draft': '#06d6a0',
      'Tournament': '#f72585',
      'Olympics': '#ffbe0b',
      'World Cup': '#fb5607',
      'Grand Slam': '#8338ec',
      'Major': '#06d6a0',
      'Awards': '#8ecae6',
      'Paralympics': '#219ebc'
    };
    return colors[type] || '#6c757d';
  };

  const getSportIcon = (sport) => {
    const icons = {
      'NFL': '🏈',
      'NBA': '🏀',
      'MLB': '⚾',
      'NHL': '🏒',
      'College Sports': '🎓',
      'Olympics': '🥇',
      'Soccer': '⚽',
      'Tennis': '🎾',
      'Golf': '⛳'
    };
    return icons[sport] || '🏆';
  };

  return (
    <>
      <NavBar />
      <ScheduleBar />
      
      <div className="container mt-4">
        <div className="schedules-header">
          <h1 className="text-center mb-4" style={{ color: "#e63946", fontFamily: "Arial Black, sans-serif" }}>
            Detailed Game & Match Schedules
          </h1>
          
          <div className="filters-section">
            <div className="row">
              <div className="col-md-6">
                <div className="filter-group">
                  <label className="filter-label">Sport:</label>
                  <select 
                    className="filter-select"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="All">All Sports</option>
                    {Object.keys(GAME_SCHEDULES).map(sport => (
                      <option key={sport} value={sport}>
                        {getSportIcon(sport)} {sport}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="filter-group">
                  <label className="filter-label">From Date:</label>
                  <input 
                    type="date"
                    className="filter-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <h3>No events found for the selected criteria</h3>
              <p>Try adjusting your filters or selecting a different date range.</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={index} className="event-card">
                <div className="event-header">
                  <div className="event-type" style={{ backgroundColor: getEventTypeColor(event.type) }}>
                    {event.type}
                  </div>
                  <div className="event-date">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                <div className="event-content">
                  <h3 className="event-name">{event.name}</h3>
                  <div className="event-location">
                    <span className="location-icon">📍</span>
                    {event.location}
                  </div>
                  {event.time && (
                    <div className="event-time">
                      <span className="time-icon">🕐</span>
                      {event.time}
                    </div>
                  )}
                  {event.week && (
                    <div className="event-week">
                      <span className="week-icon">📅</span>
                      {event.week}
                    </div>
                  )}
                  {event.endDate && (
                    <div className="event-duration">
                      <span className="duration-icon">📅</span>
                      {formatDate(event.date)} - {formatDate(event.endDate)}
                    </div>
                  )}
                </div>
                
                <div className="event-footer">
                  <div className="countdown">
                    {(() => {
                      const eventDate = new Date(event.date);
                      const today = new Date();
                      const diffTime = eventDate - today;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) {
                        return <span className="past-event">Past Event</span>;
                      } else if (diffDays === 0) {
                        return <span className="today-event">Today!</span>;
                      } else if (diffDays === 1) {
                        return <span className="tomorrow-event">Tomorrow</span>;
                      } else {
                        return <span className="upcoming-event">{diffDays} days away</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="stats-section mt-5">
          <div className="row">
            <div className="col-md-4">
              <div className="stat-card">
                <h4>Total Events</h4>
                <div className="stat-number">{filteredEvents.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h4>Upcoming Events</h4>
                <div className="stat-number">
                  {filteredEvents.filter(event => new Date(event.date) >= new Date()).length}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <h4>This Month</h4>
                <div className="stat-number">
                  {filteredEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() && 
                           eventDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Schedules;
