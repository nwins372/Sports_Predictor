// src/pages/ProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LanguagePreference from "../components/LanguagePreference";
import { supabase } from "../supabaseClient";
import { TranslatedText } from "../components/TranslatedText";

function ProfileSettings({ isLoggedIn, onUpdate }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [session, setSession] = useState(null);

  // Redirect if not logged in and get session
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      // Get session for language preference component
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      };
      getSession();
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
          <h2 className="card-title mb-4"><TranslatedText>Profile Settings</TranslatedText></h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username */}
            <div className="mb-3">
              <label className="form-label"><TranslatedText>New Username</TranslatedText></label>
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
              <label className="form-label"><TranslatedText>New Email</TranslatedText></label>
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
              <label className="form-label"><TranslatedText>New Password</TranslatedText></label>
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
              <TranslatedText>Save Changes</TranslatedText>
            </button>
          </form>
        </div>
      </div>

      {/* Language Preference Section */}
      {session && (
        <div className="mt-4">
          <LanguagePreference session={session} />
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
