import React, { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SportsNewsPage from "./pages/SportsNewsPage";
import Sports from "./pages/Sports";
import ProfileSettings from "./pages/ProfileSettings"; 

function App() {
  // fake auth state for now (replace with real auth later)
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState({
    username: "Nick",
    email: "nick@example.com",
  });

  const handleUpdate = (updated) => {
    setUser({ ...user, ...updated });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        {/* Sports pages */}
        <Route path="/sports-news" element={<SportsNewsPage />} />
        <Route path="/sports" element={<Sports />} />

        {/* Settings page (protected) */}
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
  );
}

export default App;
