import { useState, useMemo, useEffect } from "react";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import "./LocalSports.css";

import teamLocations from '../assets/team-locations.json';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Load Google Maps JavaScript API with Places library
const loadGoogleMapsScript = async () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

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

// Searches for sports venues near the given latitude and longitude
// Using Google Maps JavaScript API with Places library
async function searchLocalSportsVenues(lat, lng, radiusMeters) {
  if (!MAPS_API_KEY) {
    console.error("Google Maps API key is not configured");
    return [];
  }

  // Ensure Google Maps API is loaded
  try {
    await loadGoogleMapsScript();
  } catch (error) {
    console.error("Failed to load Google Maps API:", error);
    return [];
  }

  return new Promise((resolve) => {
    // Create a temporary map element (required for PlacesService)
    const map = new window.google.maps.Map(document.createElement('div'));
    const service = new window.google.maps.places.PlacesService(map);

    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: radiusMeters,
      type: 'stadium'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else {
        console.warn('Places API returned status:', status);
        resolve([]);
      }
    });
  });
}

export default function LocalSports() {
  const navigate = useNavigate();
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [venues, setVenues] = useState([]);
  const [address, setAddress] = useState("");
  const [foundAddress, setFoundAddress] = useState(null);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps API on component mount
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setMapsLoaded(true);
        console.log('Google Maps API loaded successfully');
      })
      .catch((err) => {
        console.error('Failed to load Google Maps API:', err);
        setError('Failed to load Google Maps API. Please check your API key.');
      });
  }, []);

  // Update venues when location or radius changes
  useEffect(() => {
    const updateVenues = async () => {
      if (!userLocation || !mapsLoaded) return;

      setLoadingVenues(true);
      try {
        // Convert miles to meters for the Places API
        const radiusInMeters = radius * 1609.34;
        const foundVenues = await searchLocalSportsVenues(
          userLocation.lat,
          userLocation.lon,
          radiusInMeters
        );
        setVenues(foundVenues);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setError('Failed to fetch nearby venues.');
      } finally {
        setLoadingVenues(false);
      }
    };

    updateVenues();
  }, [userLocation, radius, mapsLoaded]); // Dependencies: re-run when these change

  const handleSearch = async (event) => {
    event.preventDefault(); 
    setError(null);
    setUserLocation(null);
    setFoundAddress(null); 

    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const result = data.results[0];
        const location = result.geometry.location; // { lat, lng }
        
        setUserLocation({ lat: location.lat, lon: location.lng });
        setFoundAddress(result.formatted_address);
        // The useEffect hook will handle fetching venues
      } else {
        setError(data.error_message || "Could not find that location.");
      }
    } catch (err) {
      setError("Failed to fetch location data.");
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          // The useEffect hook will handle fetching venues
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
      <div className="local-sports-container">
        <h1>Local Sports Search</h1>
        <p>Search for local sports teams and venues in your area.</p>
        
        <form className="local-sports-form" onSubmit={handleSearch}>
          <div className="input-row">
            <input
              type="text"
              name="address"
              placeholder="Enter a address (ex: 123 Main St, City, State)"

              value={address}
              onChange={e => setAddress(e.target.value)}
              className="local-sports-input"
            />
            <button type="button" className="myloc" onClick={getUserLocation}>
              Search My Location
            </button>
            <button type="submit">Search</button>
            <div className="dropdown">
                <button className="dropbtn" type="button">Select Radius</button>
                <div className="dropdown-content">
                  <button type="button" onClick={() => setRadius(10)}>10 miles</button>
                  <button type="button" onClick={() => setRadius(25)}>25 miles</button>
                  <button type="button" onClick={() => setRadius(50)}>50 miles</button>
                </div>
            </div>
          </div>
        </form>

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

              {/* Display nearby sports venues from Google Places API */}
              {loadingVenues && <p>Loading nearby venues...</p>}
              
              {!loadingVenues && venues.length > 0 && (
                <>
                  <h2 className="results-city-name" style={{ marginTop: '40px' }}>
                    Nearby Sports Venues (within {radius} miles)
                  </h2>
                  <div className="team-results-grid">
                    {venues.map((venue, index) => (
                      <div key={venue.place_id || index} className="team-card">
                        <h3 className="team-card-name">{venue.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '8px' }}>
                          {venue.vicinity}
                        </p>
                        {venue.rating && (
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                            ⭐ {venue.rating} {venue.user_ratings_total && `(${venue.user_ratings_total} reviews)`}
                          </p>
                        )}
                        {venue.opening_hours && (
                          <p style={{ fontSize: '0.75rem', color: venue.opening_hours.open_now ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                            {venue.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {!loadingVenues && userLocation && venues.length === 0 && (
                <p style={{ marginTop: '20px', color: '#94a3b8' }}>
                  No sports venues found nearby. Try adjusting your search radius.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}