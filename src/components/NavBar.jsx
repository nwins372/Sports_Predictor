import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './NavBar.css'; 
import mg from '../assets/mag_glass.png';
import { supabase } from "../supabaseClient";

export default function NavBar() {
const [session, setSession] = useState(null);
useEffect(() => {
    // Check sessions
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listener checks for whether user logs in or out
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // cleanup
    return () => {
      try { subscription?.data?.unsubscribe(); } catch (e) {}
    };
  }, []);
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="site-title">SportsPredictor</Link>
      </div>

      <div className="navbar-center">
        <Link to="/following" className="nav-link" id="following">Following</Link>
        <Link to="/sports" className="nav-link" id="sports">Sports</Link>
        <Link to="/sports-news" className="nav-link">Sports News</Link>
        {!session && <Link to="/login" id="login-button">Login</Link>}
        <Link to="/search" className="nav-link" id="search">
          <img src={mg} alt="Search Icon" width="30" height="30" />
        </Link>
      </div>

    {/* Signout Button if logged in */}
      <div className="navbar-right">
          {session && ( <button onClick={async () => { await supabase.auth.signOut();}} className="nav-link"> Logout </button>
  )}

  {/* Profile link shown always */}
  { session && <Link to="/profile" className="nav-link" id="profile">Profile</Link> }
        {/* Settings link always available */}
        <Link to="/settings" className="nav-link" id="settings">Settings</Link>
      </div>
    </nav>
  );
}