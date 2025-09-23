import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SportsNewsPage from "./pages/SportsNewsPage";
import Sports from "./pages/Sports";
import ProfileSettings from "./pages/ProfileSettings"; 
import { supabase } from "./supabaseClient";
import { useState, useEffect } from 'react';

function App() {
const [session, setSession] = useState(null);  
useEffect(() => {
    // Check sessions
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listener checks for whether user logs in or out
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/sports-news" element={<SportsNewsPage />} />
      {!session && <Route path="/profile-settings" element={<ProfileSettings />} ></Route> }
        
    </Routes>
    </BrowserRouter>
  );
}

export default App;
