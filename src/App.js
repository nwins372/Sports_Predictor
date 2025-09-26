import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Player from './pages/Player';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './supabaseClient';
import { useEffect, useState } from 'react';
import SportsNewsPage from './pages/SportsNewsPage';
import ProfileSettings from './pages/ProfileSettings';

const isLoggedIn = supabase.auth.getSession().then(({ data: { session } }) => !!session);
const user = supabase.auth.getUser().then(({ data: { user } }) => user);

const handleUpdate = (updatedInfo) => {
  // Handle the updated user information here
  console.log('User info updated:', updatedInfo);
};

function App() {
const [, setSession] = useState(null);

document.title = "Sports Predictor";

useEffect(() => {
    // Check sessions
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listener checks for whether user logs in or out
    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // cleanup
    return () => { try { listener?.data?.unsubscribe?.(); } catch (e) {} };
  }, []);

  return (
    <ThemeProvider>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
  <Route path="/team/:abbr" element={<Team />} />
  <Route path="/player/:id" element={<Player />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/sports-news" element={<SportsNewsPage />} />
        <Route
          path="/profile-settings"
          element={
            <ProfileSettings
              isLoggedIn={isLoggedIn}
              user={user}
              onUpdate={handleUpdate}
            />
          }
        />
    </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
