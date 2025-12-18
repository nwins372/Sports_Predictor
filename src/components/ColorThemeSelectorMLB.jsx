import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import './ColorThemeSelector.css';

const MLBcolorThemes = [
  { id: 'AZD', name: 'Charcoal Red', color: '#9b2743' },
  { id: 'ATLB', name: 'Braves Blue', color: '#a71930' },
  { id: 'BORI', name: 'Baltimore Orange', color: '#241773' },
  { id: 'BRS', name: 'Boston Red', color: '#00338d' },
  { id: 'CHI', name: 'Chicago Blue', color: '#007fc8' },
  { id: 'CWS', name: 'White', color: '#c83803' },
  { id: 'CINR', name: 'Red', color: '#fb4f14' },
  { id: 'CLEG', name: 'Gaurdian Red', color: '#e31937' },
  { id: 'COL', name: 'Rocky Purple', color: '#33006f' },
  { id: 'DTIG', name: 'Navy', color: '#0c2340' },
  { id: 'HOUAS', name: 'Trash Orange', color: '#f4911e' },
  { id: 'KCR', name: 'Royal Blue', color: '#004687' },
  { id: 'LAA', name: 'Angel Red', color: '#ba0021' },
  { id: 'LAA', name: 'Dodger Blue', color: '#005a9c' },
  { id: 'MIM', name: 'Miami Night Blue', color: '#00a3e0' },
  { id: 'MIL', name: 'Brewer Blue', color: '#12284b' },
  { id: 'MTC', name: 'Twin City Red', color: '#d31145' },
  { id: 'NYM', name: 'Mets Blue', color: '#002d72' },
  { id: 'NYY', name: 'Yankee Gray', color: '#c4ced3' },
  { id: 'OAK', name: 'Coliseum Green', color: '#003831' },
  { id: 'PHIL', name: 'Phanatic Green', color: '#5feb64ff' },
  { id: 'PITP', name: 'Pirate Gold', color: '#fdb827' },
  { id: 'SD', name: 'Padre Gold', color: '#ffc425' },
  { id: 'SFG', name: 'Giants Beige', color: '#efd19f' },
  { id: 'SEAM', name: 'Northwest Green', color: '#005c5c' },
  { id: 'STL', name: 'Cardinal Red', color: '#c41e3a' },
  { id: 'TBR', name: 'Ray Blue', color: '#8fbce6' },
  { id: 'TEX', name: 'Texas Blue', color: '#003278' },
  { id: 'TBJ', name: 'Jay Blue', color: '#134a8e' },
  { id: 'NATS', name: 'Nationals Red', color: '#ab0003'},
]
export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useContext(ThemeContext);

  return (
    <div className="color-theme-selector">
      <div className="color-theme-grid">
        {MLBcolorThemes.map((theme) => (
          <button
            key={theme.id}
            className={`color-theme-option ${colorTheme === theme.id ? 'active' : ''}`}
            onClick={() => setColorTheme(theme.id)}
            style={{ '--theme-color': theme.color }}
            title={theme.name}
            aria-label={`Select ${theme.name} theme`}
          >
            <div className="color-circle" />
            {colorTheme === theme.id && (
              <div className="checkmark">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
