import { useEffect, useState } from 'react';

// Hook to manage schedule filters (sport, filterState, selected date)
// - Persists sport and filterState to localStorage
// - Listens and dispatches global events ('sportChanged' and 'filterChanged')
// - Normalizes sport values to lowercase for consistency

export default function useScheduleFilters({
  defaultSport = 'all',
  defaultFilter = 'sports',
  defaultDate = null
} = {}) {
  const [sport, setSportState] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedSport');
      return (saved ? String(saved).toLowerCase() : defaultSport) || defaultSport;
    } catch (e) {
      return defaultSport;
    }
  });

  const [filterState, setFilterStateState] = useState(() => {
    try {
      const saved = localStorage.getItem('filterState');
      return saved || defaultFilter;
    } catch (e) {
      return defaultFilter;
    }
  });

  const [selected, setSelectedState] = useState(() => {
    if (defaultDate) return defaultDate;
    const x = new Date();
    x.setHours(0,0,0,0);
    return x;
  });

  // Helpers that wrap state updates and keep localStorage + events in sync
  const setSport = (value) => {
    const v = value ? String(value).toLowerCase() : 'all';
    setSportState(v);
    try { localStorage.setItem('selectedSport', v); } catch (e) {}
    window.dispatchEvent(new CustomEvent('sportChanged', { detail: v }));
  };

  const setFilterState = (value) => {
    const v = value || 'none';
    setFilterStateState(v);
    try { localStorage.setItem('filterState', v); } catch (e) {}
    window.dispatchEvent(new CustomEvent('filterChanged', { detail: v }));
  };

  const setSelected = (date) => {
    setSelectedState(date);
  };

  // Global listeners to update this hook if other parts of the app dispatch events
  useEffect(() => {
    const onSportChanged = (e) => setSportState(String(e?.detail || localStorage.getItem('selectedSport') || defaultSport).toLowerCase());
    const onFilterChanged = (e) => setFilterStateState(e?.detail || localStorage.getItem('filterState') || defaultFilter);

    window.addEventListener('sportChanged', onSportChanged);
    window.addEventListener('filterChanged', onFilterChanged);

    return () => {
      window.removeEventListener('sportChanged', onSportChanged);
      window.removeEventListener('filterChanged', onFilterChanged);
    };
  }, [defaultSport, defaultFilter]);

  // Behavior: if filterState is not 'sports', reset sport to 'all'
  useEffect(() => {
    if (filterState !== 'sports' && sport !== 'all') {
      try {
        setSport('all');
      } catch (e) {
        setSportState('all');
      }
    }
  }, [filterState]);

  return {
    sport,
    setSport,
    filterState,
    setFilterState,
    selected,
    setSelected
  };
}
