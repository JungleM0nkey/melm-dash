import { useState, useEffect } from 'react';

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
  | 'ubuntu';

const LOGO_STORAGE_KEY = 'melm-dash-logo-preference';
const DEFAULT_LOGO: LogoType = 'melm';

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

function setLogoPreference(logo: LogoType): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, logo);
  } catch (error) {
    console.error('Failed to save logo preference:', error);
  }
}

function isValidLogoType(value: string): value is LogoType {
  const validLogos: LogoType[] = [
    'melm', 'alpine', 'arch', 'centos', 'debian',
    'fedora', 'linux', 'nixos', 'opensuse', 'ubuntu'
  ];
  return validLogos.includes(value as LogoType);
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
