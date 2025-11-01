import { useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import "./LocalSports.css";

import teamLocations from '../assets/team-locations.json';

// Formula gathered from: https://mapsplatform.google.com/resources/blog/how-calculate-distances-map-maps-javascript-api/
function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LocalSports() {
  const navigate = useNavigate();
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          setError("Unable to retrieve your location.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }

  const nearbyTeams = useMemo(() => {
    if (!userLocation) {
      return []; // No location searched yet
    }
    return teamLocations.filter(team => {
      const distance = getDistanceInMiles(
        userLocation.lat,
        userLocation.lon,
        team.lat,
        team.lon
      );
      return distance <= radius;
    });
  }, [userLocation, radius]);

  return (
    <div>
      <NavBar />
      <div className="local-sports-container">
        <h1>Local Sports Search</h1>
        <p>Search for local sports teams in your area.</p>
        
        <div className="input-row">
          <button onClick={getUserLocation} className="get-location-button" type="button">Search My Location</button>
          <div className="dropdown">
              <button className="dropbtn" type="button">Select Radius</button>
              <div className="dropdown-content">
                <button type="button" onClick={() => setRadius(50)}>50 miles</button>
                <button type="button" onClick={() => setRadius(100)}>100 miles</button>
                <button type="button" onClick={() => setRadius(200)}>200 miles</button>
              </div>
          </div>
        </div>

        <div className="results-container">
          {error && <p className="error-message">{error}</p>}
          
          {userLocation && (
            <>
              <h2 className="results-city-name">Nearby Teams (within {radius} miles)</h2>
            
              {nearbyTeams.length > 0 ? (
                <>
                  <div className="team-results-grid">
                    {nearbyTeams.map(team => (
                      <div key={team.team} className="team-card">
                        <span className="team-card-league">{team.league.toUpperCase()}</span>
                        <a href={team.link} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={team.logo} 
                            alt={`${team.team} logo`} 
                            className="team-card-logo" 
                          />
                        </a>
                        <h4 className="team-card-name">{team.team}</h4>
                      </div>
                    ))}
                  </div>

                </>
              ) : (
                <p>No teams found in this area.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}