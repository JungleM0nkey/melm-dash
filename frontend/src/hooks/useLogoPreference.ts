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

export type LogoSize = 'small' | 'medium' | 'large' | 'xlarge' | 'custom';

export interface LogoSettings {
  logo: LogoType;
  size: LogoSize;
  customLogoData: string | null; // Base64 encoded image
}

const LOGO_STORAGE_KEY = 'melm-dash-logo-preference';
const LOGO_SIZE_STORAGE_KEY = 'melm-dash-logo-size';
const CUSTOM_LOGO_STORAGE_KEY = 'melm-dash-custom-logo';
const CUSTOM_SIZE_STORAGE_KEY = 'melm-dash-custom-size';

const DEFAULT_LOGO: LogoType = 'melm';
const DEFAULT_SIZE: LogoSize = 'medium';

// Size mappings in pixels (custom uses a separate stored value)
export const LOGO_SIZE_VALUES: Record<Exclude<LogoSize, 'custom'>, number> = {
  small: 32,
  medium: 40,
  large: 56,
  xlarge: 72,
};

// Default custom size when first switching to custom
export const DEFAULT_CUSTOM_SIZE = 48;

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

function getCustomSizeValue(): number {
  try {
    const stored = localStorage.getItem(CUSTOM_SIZE_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 16 && parsed <= 128) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read custom size:', error);
  }
  return DEFAULT_CUSTOM_SIZE;
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

function setCustomSizeValue(size: number): void {
  try {
    localStorage.setItem(CUSTOM_SIZE_STORAGE_KEY, String(size));
  } catch (error) {
    console.error('Failed to save custom size:', error);
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
  return ['small', 'medium', 'large', 'xlarge', 'custom'].includes(value);
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

export function useCustomSizeValue(): [number, (size: number) => void] {
  const [customSize, setCustomSizeState] = useState<number>(getCustomSizeValue);

  const updateCustomSize = useCallback((size: number) => {
    // Clamp between 16 and 128
    const clampedSize = Math.max(16, Math.min(128, size));
    setCustomSizeValue(clampedSize);
    setCustomSizeState(clampedSize);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CUSTOM_SIZE_STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed) && parsed >= 16 && parsed <= 128) {
          setCustomSizeState(parsed);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [customSize, updateCustomSize];
}
