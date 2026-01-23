import { useState, useEffect, useCallback } from 'react';
import type { ThemeName, ThemeMode, ThemeConfig } from '../types/theme';
import { themes } from '../lib/themes';

const THEME_STORAGE_KEY = 'rainy-cowork-theme';
const MODE_STORAGE_KEY = 'rainy-cowork-mode';

/**
 * Theme Management Hook
 * Handles theme switching, mode toggling, and persistence
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'cosmic-gold';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    
    // Auto-detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document
  const applyTheme = useCallback((themeName: ThemeName, themeMode: ThemeMode) => {
    const selectedTheme = themes[themeName];
    if (!selectedTheme) return;

    const colors = selectedTheme.colors[themeMode];
    const root = document.documentElement;

    // Apply all color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply dark class
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Store in localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
    localStorage.setItem(MODE_STORAGE_KEY, themeMode);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
      // Only auto-switch if user hasn't manually set a preference
      if (!storedMode) {
        setModeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const config: ThemeConfig = { theme, mode };

  return {
    theme,
    mode,
    config,
    setTheme,
    setMode,
    toggleMode,
    themes: Object.values(themes),
  };
}
