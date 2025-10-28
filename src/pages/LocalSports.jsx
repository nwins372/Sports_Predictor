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
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(50);
  const [searchCoords, setSearchCoords] = useState(null);
  const [error, setError] = useState(null);
  
  const [foundCityName, setFoundCityName] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault(); 
    setError(null);
    setSearchCoords(null);
    setFoundCityName(null); 

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const result = data.results[0];
        const location = result.geometry.location; // { lat, lng }
        
        setSearchCoords({ lat: location.lat, lon: location.lng });

        setFoundCityName(result.formatted_address);
        
      } else {
        setError(data.error_message || "Could not find that location.");
      }
    } catch (err) {
      setError("Failed to fetch location data.");
    }
  };

  const nearbyTeams = useMemo(() => {
    if (!searchCoords) {
      return []; // No location searched yet
    }
    return teamLocations.filter(team => {
      const distance = getDistanceInMiles(
        searchCoords.lat,
        searchCoords.lon,
        team.lat,
        team.lon
      );
      return distance <= radius;
    });
  }, [searchCoords, radius]);

  return (
    <div>
      <NavBar />
      <div className="local-sports-container">
        <h1>Local Sports Search</h1>
        <p>Please enter a city, and we will return sports teams nearby!</p>
        
        <form className="local-sports-form" onSubmit={handleSearch}>
          <div className="input-row">
            <input
              type="text"
              name="city"
              placeholder="Enter city name (e.g., Los Angeles, CA)"
              required
              value={city}
              onChange={e => setCity(e.target.value)}
              className="local-sports-input"
            />
            <button type="submit">Search</button>
            <div className="dropdown">
                <button className="dropbtn" type="button">Select Radius</button>
                <div className="dropdown-content">
                  <button type="button" onClick={() => setRadius(50)}>50 miles</button>
                  <button type="button" onClick={() => setRadius(100)}>100 miles</button>
                  <button type="button" onClick={() => setRadius(100)}>200 miles</button>
                </div>
            </div>
          </div>
        </form>

        <div className="results-container">
          {error && <p className="error-message">{error}</p>}
          
          {searchCoords && (
            <>
              <h2 className="results-city-name">Showing results for: {foundCityName}</h2>
            
              {nearbyTeams.length > 0 ? (
                <>
                  <h3>Nearby Teams (within {radius} miles)</h3>
                  
                  <div className="team-results-grid">
                    {nearbyTeams.map(team => (
                      <div key={team.team} className="team-card">
                        <span className="team-card-league">{team.league.toUpperCase()}</span>
                        <img 
                            src={team.logo} 
                            alt={`${team.team} logo`} 
                            className="team-card-logo" 
                        />
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