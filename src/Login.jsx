import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Add this line to import your custom styles

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // TODO: Add login logic (Supabase/Firebase/etc.)
    const hasSports = localStorage.getItem("userSports");

    if (hasSports) {
      navigate("/profile");
    } else {
      navigate("/sports-selection");
    }
  };

  return (
    <div className="espn-login-container">
      <h2 className="espn-title">Login</h2>
      <form onSubmit={handleLogin} className="espn-form">
        <div className="espn-field">
          <label className="espn-label">Email</label>
          <input type="email" className="espn-input" required />
        </div>
        <div className="espn-field">
          <label className="espn-label">Password</label>
          <input type="password" className="espn-input" required />
        </div>
        <button type="submit" className="espn-button">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
