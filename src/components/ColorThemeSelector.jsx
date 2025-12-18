import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import './ColorThemeSelector.css';

const colorThemes = [
  { id: 'blue', name: 'Blue', color: '#2563eb' },
  { id: 'green', name: 'Green', color: '#059669' },
  { id: 'purple', name: 'Purple', color: '#7c3aed' },
  { id: 'orange', name: 'Orange', color: '#ea580c' },
  { id: 'pink', name: 'Pink', color: '#db2777' },
  { id: 'teal', name: 'Teal', color: '#0891b2' },
  { id: 'red', name: 'Red', color: '#dc2626' },
  { id: 'indigo', name: 'Indigo', color: '#4f46e5' }
];

const NFLcolorThemes = [
  { id: 'AZ', name: 'Cardinal Red', color: '#9b2743' },
  { id: 'ATL', name: 'Falcon Red', color: '#a71930' },
  { id: 'BAL', name: 'Raven Purple', color: '#241773' },
  { id: 'BUF', name: 'Bills Blue', color: '#00338d' },
  { id: 'CAR', name: 'Carolina Blue', color: '#007fc8' },
  { id: 'CHI', name: 'Bear Orange', color: '#c83803' },
  { id: 'CIN', name: 'Bengal Orange', color: '#fb4f14' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'DAL', name: 'Jerry Blue', color: '#003594' },
  { id: 'DEN', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' }
]

const NBAcolorThemes = [
  { id: 'AZ', name: 'Cardinal Red', color: '#9b2743' },
  { id: 'ATL', name: 'Falcon Red', color: '#a71930' },
  { id: 'BAL', name: 'Raven Purple', color: '#241773' },
  { id: 'BUF', name: 'Bills Blue', color: '#00338d' },
  { id: 'CAR', name: 'Carolina Blue', color: '#007fc8' },
  { id: 'CHI', name: 'Bear Orange', color: '#c83803' },
  { id: 'CIN', name: 'Bengal Orange', color: '#fb4f14' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'DAL', name: 'Jerry Blue', color: '#003594' },
  { id: 'DEN', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
]

const MLBcolorThemes = [
  { id: 'AZ', name: 'Cardinal Red', color: '#9b2743' },
  { id: 'ATL', name: 'Falcon Red', color: '#a71930' },
  { id: 'BAL', name: 'Raven Purple', color: '#241773' },
  { id: 'BUF', name: 'Bills Blue', color: '#00338d' },
  { id: 'CAR', name: 'Carolina Blue', color: '#007fc8' },
  { id: 'CHI', name: 'Bear Orange', color: '#c83803' },
  { id: 'CIN', name: 'Bengal Orange', color: '#fb4f14' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'DAL', name: 'Jerry Blue', color: '#003594' },
  { id: 'DEN', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
  { id: 'CLE', name: 'Cleveland Brown', color: '#311d00' },
]
export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useContext(ThemeContext);

  return (
    <div className="color-theme-selector">
      <div className="color-theme-grid">
        {colorThemes.map((theme) => (
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
