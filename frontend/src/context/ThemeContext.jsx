import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

/**
 * Dezerv redesign: dark mode is the primary experience.
 * The theme is always initialised to 'dark' and the `dark` class is always
 * applied to <html>. The toggle still works (switches to light) so users can
 * opt out, but the default and preferred state is dark.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Always start in dark mode — ignore any previously stored light preference
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
