// src/pages/Profile.jsx
import React from "react";
import { Link } from "react-router-dom";

function Profile() {
  return (
    <div className="container mt-5 text-center">
      <h1>Welcome to Your Profile</h1>
      <p>Here you can view your account info and update settings.</p>
      <Link to="/profile-settings" className="btn btn-primary mt-3">
        Go to Profile Settings
      </Link>
    </div>
  );
}

export default Profile;
