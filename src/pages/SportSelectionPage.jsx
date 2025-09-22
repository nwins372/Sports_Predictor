import React, { useState, useEffect } from "react";

function SportsSelection({ initialSelected = [], onSelect = () => {} }) {
  const [selected, setSelected] = useState(Array.isArray(initialSelected) ? initialSelected : (initialSelected ? [initialSelected] : []));

  useEffect(() => {
    setSelected(Array.isArray(initialSelected) ? initialSelected : (initialSelected ? [initialSelected] : []));
  }, [initialSelected]);

  const sports = [
    { name: "Basketball", img: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Basketball.png" },
    { name: "Football", img: "https://upload.wikimedia.org/wikipedia/commons/a/a3/American_football_icon.png" },
    { name: "Tennis", img: "https://upload.wikimedia.org/wikipedia/commons/8/81/Tennis_ball_icon.svg" },
  ];

  const toggle = (name) => {
    setSelected((prev) => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter((s) => s !== name) : [...prev, name];
      onSelect(next);
      return next;
    });
  };

  return (
    <div className="sports-selection" style={{ padding: 20 }}>
      <header style={{ width: '100%', background: 'var(--brand-bg)', color: 'var(--brand-text)', padding: '12px 0', textAlign: 'center', borderRadius: 6 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontStyle: 'italic' }}>ESPN Sports Hub</h1>
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', opacity: 0.9 }}>Select Your Favorite Sports</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 24, maxWidth: 960, marginLeft: 'auto', marginRight: 'auto' }}>
        {sports.map((sport) => {
          const isSelected = selected.includes(sport.name);
          return (
            <div key={sport.name} onClick={() => toggle(sport.name)} style={{ cursor: 'pointer', background: 'var(--bg)', border: `4px solid ${isSelected ? 'var(--accent)' : 'var(--muted)'}`, borderRadius: 18, boxShadow: '0 8px 20px rgba(0,0,0,0.3)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform .15s' }}>
              <img src={sport.img} alt={sport.name} style={{ height: 88, marginBottom: 12 }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text)' }}>{sport.name}</h2>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--accent)', color: 'white', padding: '12px 18px', borderRadius: 12, textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>You selected: {selected.join(', ')} 🏆</h3>
        </div>
      )}
    </div>
  );
}

export default SportsSelection;
