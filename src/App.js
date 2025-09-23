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

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
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
  );
}

export default App;
