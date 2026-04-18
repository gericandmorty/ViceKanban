'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme || 'light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const rawValue = localStorage.getItem('_vk_pref_node');
    if (rawValue) {
      const savedTheme = rawValue === '1' ? 'dark' : 'light';
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Sync with HTML class and data attribute
    const root = document.documentElement;
    
    // Remove both classes to ensure a clean slate
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Also set data-attribute for better selector coverage
    root.setAttribute('data-theme', theme);
    
    // Sync style's colorScheme for browser UI
    root.style.colorScheme = theme;
    
    // Persist preference in localStorage with obfuscated key and value
    localStorage.setItem('_vk_pref_node', theme === 'dark' ? '1' : '0');
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
