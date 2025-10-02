import React, { useContext } from 'react';
import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import ColorThemeSelector from "../components/ColorThemeSelector";
import { ThemeContext } from '../context/ThemeContext';
import './Settings.css';

export default function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <>
    <div id="app-container">
      <NavBar />
      <ScheduleBar />

      <div className="container settings-page">
        <main>
          <h2>Settings</h2>
          <div className="setting-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
              <span className="slider" />
            </label>
            <div className="setting-meta">
              <div className="setting-title">Dark mode</div>
              <div className="setting-desc">Toggle site-wide dark theme. Your choice will be remembered.</div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-meta">
              <div className="setting-title">Color theme</div>
              <div className="setting-desc">Choose your preferred accent color for the website.</div>
              <ColorThemeSelector />
            </div>
          </div>
        </main>
      </div>

      <footer />
    </div>
    </>
  );
}
