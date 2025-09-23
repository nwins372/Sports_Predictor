// src/pages/Sports.jsx
import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import "./Sports.css";

const API_KEY = "973d749be7db3e7dd2447872f9135fa8"; // replace with your API-Sports key

// API-Sports base URL (sports can be football, basketball, baseball, tennis)
const API_URLS = {
  NFL: `https://v1.american-football.api-sports.io/games?season=2024&league=1`, // NFL league=1
  NBA: `https://v1.basketball.api-sports.io/games?season=2024&league=12`, // NBA league=12
  MLB: `https://v1.baseball.api-sports.io/games?season=2024&league=1`, // MLB league=1
  Tennis: `https://v1.tennis.api-sports.io/games?season=2024`, // Tennis varies by tour
};

function Sports() {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      const results = {};
      try {
        for (const sport of Object.keys(API_URLS)) {
          const resp = await fetch(API_URLS[sport], {
            headers: {
              "x-apisports-key": API_KEY,
            },
          });
          const data = await resp.json();
          results[sport] = data.response || [];
        }
        setSchedules(results);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const renderGames = (sport, games) => {
    if (!games || games.length === 0) {
      return <p>No upcoming games available.</p>;
    }

    return (
      <ul>
        {games.slice(0, 5).map((game, idx) => {
          // Common fields: status, date, teams
          const status = game.status?.long || game.status?.short || "TBD";
          const date = new Date(game.date || game.timestamp * 1000).toLocaleString();
          const home = game.teams?.home?.name || game.homeTeam?.name;
          const away = game.teams?.away?.name || game.awayTeam?.name;

          return (
            <li key={idx} className={status.includes("LIVE") ? "live" : ""}>
              <strong>{home}</strong> vs <strong>{away}</strong> — {date}  
              <span className="status">({status})</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <NavBar />
      <div className="sports-container">
        <h1>Upcoming & Live Games</h1>

        {loading ? (
          <p>Loading schedules...</p>
        ) : (
          <div className="schedules-grid">
            {Object.entries(schedules).map(([sport, games]) => (
              <div key={sport} className="sport-section">
                <h2>{sport}</h2>
                {renderGames(sport, games)}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Sports;
