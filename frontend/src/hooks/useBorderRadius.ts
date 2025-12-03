import { useState, useEffect, useCallback } from 'react';

export type BorderRadiusStyle = 'sharp' | 'rounded';

const BORDER_RADIUS_STORAGE_KEY = 'melm-dash-border-radius';
const DEFAULT_BORDER_RADIUS: BorderRadiusStyle = 'rounded';

// CSS variable values for each style
export const BORDER_RADIUS_VALUES: Record<BorderRadiusStyle, string> = {
  sharp: '2px',
  rounded: '8px',
};

function isValidBorderRadiusStyle(value: string): value is BorderRadiusStyle {
  return ['sharp', 'rounded'].includes(value);
}

function getBorderRadiusPreference(): BorderRadiusStyle {
  try {
    const stored = localStorage.getItem(BORDER_RADIUS_STORAGE_KEY);
    if (stored && isValidBorderRadiusStyle(stored)) {
      return stored;
    }
  } catch (error) {
    console.error('Failed to read border radius preference:', error);
  }
  return DEFAULT_BORDER_RADIUS;
}

function setBorderRadiusStorage(style: BorderRadiusStyle): void {
  try {
    localStorage.setItem(BORDER_RADIUS_STORAGE_KEY, style);
  } catch (error) {
    console.error('Failed to save border radius preference:', error);
  }
}

function applyBorderRadius(style: BorderRadiusStyle): void {
  const root = document.documentElement;
  const value = BORDER_RADIUS_VALUES[style];

  // Set CSS custom properties for different radius sizes
  root.style.setProperty('--melm-radius-sm', style === 'sharp' ? '1px' : '4px');
  root.style.setProperty('--melm-radius-md', value);
  root.style.setProperty('--melm-radius-lg', style === 'sharp' ? '4px' : '12px');
  root.style.setProperty('--melm-radius-xl', style === 'sharp' ? '6px' : '16px');
}

export function useBorderRadius(): [BorderRadiusStyle, (style: BorderRadiusStyle) => void] {
  const [borderRadius, setBorderRadiusState] = useState<BorderRadiusStyle>(getBorderRadiusPreference);

  const updateBorderRadius = useCallback((style: BorderRadiusStyle) => {
    setBorderRadiusStorage(style);
    setBorderRadiusState(style);
    applyBorderRadius(style);
  }, []);

  // Apply on mount
  useEffect(() => {
    applyBorderRadius(borderRadius);
  }, [borderRadius]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BORDER_RADIUS_STORAGE_KEY && e.newValue && isValidBorderRadiusStyle(e.newValue)) {
        setBorderRadiusState(e.newValue);
        applyBorderRadius(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [borderRadius, updateBorderRadius];
}
