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
import Transactions from './pages/Transactions';
import Following from './pages/Following';
import MockDraft from './pages/MockDraft';
import TradeMachine from './pages/TradeMachine';
import NavBar from './components/NavBar';
import { ThemeProvider } from './context/ThemeContext';
import { TranslationProvider } from './context/TranslationContext';
import { supabase } from './supabaseClient';
import { useEffect, useState } from 'react';
import SportsNewsPage from './pages/SportsNewsPage';
import ProfileSettings from './pages/ProfileSettings';
import Schedules from './pages/Schedules';
import Statistics from './pages/Statistics';
import LocalSports from './pages/LocalSports';

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
      <TranslationProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/team/:league/:abbr" element={<Team />} />
            {/* backward-compatible route (no league) */}
            <Route path="/team/:abbr" element={<Team />} />
            <Route path="/player/:league/:id" element={<Player />} />
            {/* backward-compatible route (no league) */}
            <Route path="/player/:id" element={<Player />} />
            <Route path="/mock-draft" element={<MockDraft />} />
            <Route path="/trade-machine" element={<TradeMachine />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/following" element={<Following />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/sports-news" element={<SportsNewsPage />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/statistics" element={<Statistics />} />
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
            <Route path="/local-sports" element={<LocalSports />} />
          </Routes>
        </BrowserRouter>
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default App;
