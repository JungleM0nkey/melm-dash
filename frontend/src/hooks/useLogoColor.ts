import { useState, useEffect, useCallback } from 'react';

const LOGO_COLOR_STORAGE_KEY = 'melm-dash-logo-color';
const DEFAULT_LOGO_COLOR = ''; // Empty string means use default/original colors

function getLogoColor(): string {
  try {
    const stored = localStorage.getItem(LOGO_COLOR_STORAGE_KEY);
    return stored || DEFAULT_LOGO_COLOR;
  } catch (error) {
    console.error('Failed to read logo color preference:', error);
    return DEFAULT_LOGO_COLOR;
  }
}

function setLogoColorStorage(color: string): void {
  try {
    if (color) {
      localStorage.setItem(LOGO_COLOR_STORAGE_KEY, color);
    } else {
      localStorage.removeItem(LOGO_COLOR_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save logo color preference:', error);
  }
}

export function useLogoColor(): [string, (color: string) => void] {
  const [logoColor, setLogoColorState] = useState<string>(getLogoColor);

  const updateLogoColor = useCallback((color: string) => {
    setLogoColorStorage(color);
    setLogoColorState(color);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOGO_COLOR_STORAGE_KEY) {
        setLogoColorState(e.newValue || DEFAULT_LOGO_COLOR);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [logoColor, updateLogoColor];
}
