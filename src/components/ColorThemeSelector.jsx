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
  { id: 'DEN', name: 'Denver Navy', color: '#002244' },
  { id: 'DET', name: 'Lion Blue', color: '#0076b6' },
  { id: 'GB', name: 'Bay Green', color: '#203731' },
  { id: 'HOU', name: 'Houston Blue', color: '#03202f' },
  { id: 'IND', name: 'Colt Blue', color: '#002c5f' },
  { id: 'JAX', name: 'Jaguar Teal', color: '#006778' },
  { id: 'KC', name: 'KC Red', color: '#e31837' },
  { id: 'LV', name: 'Raiders Silver', color: '#a5acaf' },
  { id: 'LAC', name: 'Powder Blue', color: '#0080c6' },
  { id: 'LAR', name: 'Rams Blue', color: '#003594' },
  { id: 'MIA', name: 'Dolphin Green', color: '#008e97' },
  { id: 'MIN', name: 'Viks Purple', color: '#4f2683' },
  { id: 'NE', name: 'Patroit Blue', color: '#002244' },
  { id: 'NO', name: 'Saints Gold', color: '#d3bc8d' },
  { id: 'NYG', name: 'New York Blue', color: '#0b2265' },
  { id: 'NYJ', name: 'Jet Green', color: '#125740' },
  { id: 'PHI', name: 'Kelly Green', color: '#004c54' },
  { id: 'PIT', name: 'PittsBurgh Gold', color: '#ffb612' },
  { id: 'SF', name: 'SsanFran Red', color: '#aa0000' },
  { id: 'SEA', name: 'Seattle Green', color: '#69be28' },
  { id: 'TB', name: 'Pirate Red', color: '#d50a0a' },
  { id: 'TEN', name: 'Tennessee Blue', color: '#4b92db' },
  { id: 'WAS', name: 'Burgundy', color: '#773141' }
]

const NBAcolorThemes = [
  { id: 'ATL', name: 'Hawk Red', color: '#e03a3e' },
  { id: 'BOS', name: 'Celtic Green', color: '#007a33' },
  { id: 'BRK', name: 'Black', color: '#000000' },
  { id: 'CAH', name: 'Hornet Blue', color: '#00788c' },
  { id: 'CHIB', name: 'Chicago Red', color: '#ce1141' },
  { id: 'CLC', name: 'Cavs Brown', color: '#860038' },
  { id: 'DAL', name: 'Dallas Blue', color: '#00538c' },
  { id: 'DNN', name: 'Denver Maroon', color: '#8b2131' },
  { id: 'DEP', name: 'Piston Blue', color: '#1d42ba' },
  { id: 'GS', name: 'Curry Blue', color: '#1d428a' },
  { id: 'ROK', name: 'Rockets Red', color: '#ce1141' },
  { id: 'IPAC', name: 'Indy Gold', color: '#fdbb30' },
  { id: 'CLP', name: 'Clipper Blue', color: '#1d428a' },
  { id: 'LAL', name: 'Champ Purple', color: '#552583' },
  { id: 'MEM', name: 'Memphis Blue', color: '#5d76a9' },
  { id: 'MIAH', name: 'Hot Red', color: '#98002e' },
  { id: 'MILB', name: 'Good Land Green', color: '#00471b' },
  { id: 'MTW', name: 'Minniesota Blue', color: '#236192' },
  { id: 'NOP', name: 'Orleans Gold', color: '#85714d' },
  { id: 'NYK', name: 'Knick Orange', color: '#006bb6' },
  { id: 'OKC', name: 'Free Throw Blue', color: '#007ac1' },
  { id: 'ORL', name: 'Magic Blue', color: '#0077c0' },
  { id: 'P76R', name: 'Independence Blue', color: '#003da5' },
  { id: 'PHX', name: 'Sun Orange', color: '#b95915' },
  { id: 'POR', name: 'Portland Red', color: '#e03a3e' },
  { id: 'SAC', name: 'Royal Purple', color: '#582c83' },
  { id: 'SAS', name: 'Texas Silver', color: '#c4ced4' },
  { id: 'TOR', name: 'Raptor Red', color: '#c5050c' },
  { id: 'UTAH', name: 'Utah Purple', color: '#3e2680' },
  { id: 'WASW', name: 'Wizard Red', color: '#e31837' },
]

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
