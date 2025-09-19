import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SportsNewsPage from "./pages/SportsNewsPage";
import Sports from "./pages/Sports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        {/* Sports news page */}
        <Route path="/sports-news" element={<SportsNewsPage />} />
        {/* Sports page */}
        <Route path="/sports" element={<Sports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
