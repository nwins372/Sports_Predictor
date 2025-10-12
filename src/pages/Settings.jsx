import React, { useContext, useEffect, useState } from 'react';
import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import ColorThemeSelector from "../components/ColorThemeSelector";
import { ThemeContext } from '../context/ThemeContext';
import './Settings.css';
import { supabase } from '../supabaseClient';
import nbaAsset from '../assets/nba25.json';
import espnApi from '../utils/espnApi';

export default function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [league, setLeague] = useState('nba');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(() => {
    try { return JSON.parse(localStorage.getItem('team_pref')) || null; } catch { return null; }
  });

  useEffect(() => {
    async function loadTeams() {
      // Use the espnApi helper which prefers checked-in JSON under /db/espn/{league}
      try {
        const list = await espnApi.listTeams(league);
        if (Array.isArray(list) && list.length > 0) {
          setTeams(list.map(t => ({ id: t.id || t.uid || t.teamId || t.raw?.id, name: t.name || t.displayName || t.shortDisplayName || t.raw?.displayName || t.fullName || t.location || t.teamName, abbr: t.abbreviation || t.raw?.abbreviation })));
          return;
        }
      } catch (e) {
        // ignore and fall back to asset
      }

      // asset fallback: derive unique team names from nbaAsset where available
      try {
        const names = Array.from(new Set(nbaAsset.flatMap(e => [e.HomeTeam, e.AwayTeam]).filter(Boolean)));
        setTeams(names.map((n, i) => ({ id: String(i+1), name: n, abbr: n.split(' ').pop() })));
      } catch (e) {
        setTeams([]);
      }
    }

    loadTeams();
  }, [league]);

  useEffect(() => {
    // persist localStorage and supabase
    if (!selectedTeam) return;
    try { localStorage.setItem('team_pref', JSON.stringify(selectedTeam)); } catch {}

    // if a user is logged in, write to preferences table
    (async () => {
      try {
        const user = await supabase.auth.getUser?.();
        const userId = user?.data?.user?.id || user?.user?.id;
        if (!userId) return;
        await supabase.from('preferences').upsert({ user_id: userId, data: { favorite_team: selectedTeam } }, { onConflict: 'user_id' });
      } catch (e) { /* ignore supabase errors for now */ }
    })();
  }, [selectedTeam]);

  return (
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
  );
}
