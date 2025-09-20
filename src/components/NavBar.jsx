import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './NavBar.css'; 
import mg from '../assets/mag_glass.png';
import { supabase } from "../supabaseClient";

function NavBar() {
const [session, setSession] = useState(null);
useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for changes (login, logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
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
        {!session && <Link to="/login">Login</Link>}
      </div>

      <div className="navbar-right">
        <span className="icon-placeholder" id="more-features">More</span>
        <Link to="/search" className="icon-placeholder" id="search">
          <img src={mg} alt="Search Icon" width="30" height="30" />
        </Link>
        {session ? (
          <Link to="/profile" className="icon-placeholder" id="profile">Profile</Link>
        ) : null}
      </div>
    </nav>
  );
}

export default NavBar;
