import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext(null);

function getSavedTheme() {
  return localStorage.getItem('ytdl-gui-theme') || 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme);

  const setTheme = useCallback((t) => {
    localStorage.setItem('ytdl-gui-theme', t);
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
