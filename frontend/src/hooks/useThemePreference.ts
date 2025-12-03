import { useState, useEffect, useCallback } from 'react';
import { useColorMode } from '@chakra-ui/react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'melm-dash-theme-preference';
const DEFAULT_THEME: ThemeMode = 'system';

function isValidThemeMode(value: string): value is ThemeMode {
  return ['light', 'dark', 'system'].includes(value);
}

function getThemePreference(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidThemeMode(stored)) {
      return stored;
    }
  } catch (error) {
    console.error('Failed to read theme preference:', error);
  }
  return DEFAULT_THEME;
}

function setThemePreference(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
}

function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemePreference(): [ThemeMode, (theme: ThemeMode) => void] {
  const [themePreference, setThemePreferenceState] = useState<ThemeMode>(getThemePreference);
  const { setColorMode } = useColorMode();

  // Apply the theme based on preference
  const applyTheme = useCallback(
    (theme: ThemeMode) => {
      if (theme === 'system') {
        setColorMode(getSystemColorMode());
      } else {
        setColorMode(theme);
      }
    },
    [setColorMode]
  );

  const updateThemePreference = useCallback(
    (theme: ThemeMode) => {
      setThemePreference(theme);
      setThemePreferenceState(theme);
      applyTheme(theme);
    },
    [applyTheme]
  );

  // Apply theme on mount
  useEffect(() => {
    applyTheme(themePreference);
  }, [applyTheme, themePreference]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themePreference, setColorMode]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue && isValidThemeMode(e.newValue)) {
        setThemePreferenceState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [applyTheme]);

  return [themePreference, updateThemePreference];
}
