import { useState, useEffect, useCallback } from 'react';

export type LogoType =
  | 'melm'
  | 'alpine'
  | 'arch'
  | 'centos'
  | 'debian'
  | 'fedora'
  | 'linux'
  | 'nixos'
  | 'opensuse'
  | 'ubuntu'
  | 'custom';

export type LogoSize = 'small' | 'medium' | 'large';

export interface LogoSettings {
  logo: LogoType;
  size: LogoSize;
  customLogoData: string | null; // Base64 encoded image
}

const LOGO_STORAGE_KEY = 'melm-dash-logo-preference';
const LOGO_SIZE_STORAGE_KEY = 'melm-dash-logo-size';
const CUSTOM_LOGO_STORAGE_KEY = 'melm-dash-custom-logo';

const DEFAULT_LOGO: LogoType = 'melm';
const DEFAULT_SIZE: LogoSize = 'medium';

// Size mappings in pixels
export const LOGO_SIZE_VALUES: Record<LogoSize, number> = {
  small: 32,
  medium: 40,
  large: 56,
};

function getLogoPreference(): LogoType {
  try {
    const stored = localStorage.getItem(LOGO_STORAGE_KEY);
    if (stored && isValidLogoType(stored)) {
      return stored as LogoType;
    }
  } catch (error) {
    console.error('Failed to read logo preference:', error);
  }
  return DEFAULT_LOGO;
}

function getLogoSize(): LogoSize {
  try {
    const stored = localStorage.getItem(LOGO_SIZE_STORAGE_KEY);
    if (stored && isValidLogoSize(stored)) {
      return stored as LogoSize;
    }
  } catch (error) {
    console.error('Failed to read logo size:', error);
  }
  return DEFAULT_SIZE;
}

function getCustomLogo(): string | null {
  try {
    return localStorage.getItem(CUSTOM_LOGO_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read custom logo:', error);
  }
  return null;
}

function setLogoPreference(logo: LogoType): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, logo);
  } catch (error) {
    console.error('Failed to save logo preference:', error);
  }
}

function setLogoSizePreference(size: LogoSize): void {
  try {
    localStorage.setItem(LOGO_SIZE_STORAGE_KEY, size);
  } catch (error) {
    console.error('Failed to save logo size:', error);
  }
}

function setCustomLogoData(data: string | null): void {
  try {
    if (data) {
      localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, data);
    } else {
      localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save custom logo:', error);
  }
}

function isValidLogoType(value: string): value is LogoType {
  const validLogos: LogoType[] = [
    'melm', 'alpine', 'arch', 'centos', 'debian',
    'fedora', 'linux', 'nixos', 'opensuse', 'ubuntu', 'custom'
  ];
  return validLogos.includes(value as LogoType);
}

function isValidLogoSize(value: string): value is LogoSize {
  return ['small', 'medium', 'large'].includes(value);
}

export function useLogoPreference(): [LogoType, (logo: LogoType) => void] {
  const [logoPreference, setLogoPreferenceState] = useState<LogoType>(getLogoPreference);

  const updateLogoPreference = (logo: LogoType) => {
    setLogoPreference(logo);
    setLogoPreferenceState(logo);
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOGO_STORAGE_KEY && e.newValue && isValidLogoType(e.newValue)) {
        setLogoPreferenceState(e.newValue as LogoType);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [logoPreference, updateLogoPreference];
}

export function useLogoSize(): [LogoSize, (size: LogoSize) => void] {
  const [logoSize, setLogoSizeState] = useState<LogoSize>(getLogoSize);

  const updateLogoSize = useCallback((size: LogoSize) => {
    setLogoSizePreference(size);
    setLogoSizeState(size);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOGO_SIZE_STORAGE_KEY && e.newValue && isValidLogoSize(e.newValue)) {
        setLogoSizeState(e.newValue as LogoSize);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [logoSize, updateLogoSize];
}

export function useCustomLogo(): [string | null, (data: string | null) => void] {
  const [customLogo, setCustomLogoState] = useState<string | null>(getCustomLogo);

  const updateCustomLogo = useCallback((data: string | null) => {
    setCustomLogoData(data);
    setCustomLogoState(data);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CUSTOM_LOGO_STORAGE_KEY) {
        setCustomLogoState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [customLogo, updateCustomLogo];
}
