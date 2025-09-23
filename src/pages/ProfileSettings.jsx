// src/pages/ProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProfileSettings({ isLoggedIn, onUpdate }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Updated Info:", formData);

    if (onUpdate) {
      onUpdate(formData);
    }
    alert("Settings updated!");
    setFormData({ username: "", email: "", password: "" }); // clear fields
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title mb-4">Profile Settings</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username */}
            <div className="mb-3">
              <label className="form-label">New Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">New Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;
