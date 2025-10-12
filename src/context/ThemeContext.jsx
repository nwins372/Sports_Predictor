import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  colorTheme: 'blue',
  setTheme: () => {},
  setColorTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  // initialize theme from localStorage, fallback to system preference
  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // initialize color theme from localStorage, fallback to blue
  const getInitialColorTheme = () => {
    try {
      const saved = localStorage.getItem('colorTheme');
      if (saved) return saved;
    } catch (e) {}
    return 'blue';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [colorTheme, setColorTheme] = useState(getInitialColorTheme);

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('colorTheme', colorTheme);
    } catch (e) {}
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, setTheme, setColorTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
