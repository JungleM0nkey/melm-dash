import { useState, useEffect, useCallback, useMemo } from 'react';

const TIMEZONE_STORAGE_KEY = 'melm-dash-timezone';

// Fallback list of common timezones for browsers that don't support Intl.supportedValuesOf
const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

// Get list of available timezones
export function getAvailableTimezones(): string[] {
  try {
    // Get supported timezones - modern browsers support this
    const supported = Intl.supportedValuesOf('timeZone');
    return ['auto', ...supported];
  } catch {
    // Fallback to a curated list of common timezones
    return ['auto', ...FALLBACK_TIMEZONES];
  }
}

// Get the browser's local timezone
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Get stored timezone preference or 'auto' as default
function getTimezonePreference(): string {
  try {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.error('Failed to read timezone preference:', error);
  }
  return 'auto';
}

function setTimezonePreference(timezone: string): void {
  try {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  } catch (error) {
    console.error('Failed to save timezone preference:', error);
  }
}

export function useTimezonePreference(): [string, (timezone: string) => void, string] {
  const [timezonePreference, setTimezonePreferenceState] = useState<string>(getTimezonePreference);

  // Compute the effective timezone (resolve 'auto' to actual timezone)
  const effectiveTimezone = useMemo(() => {
    return timezonePreference === 'auto' ? getLocalTimezone() : timezonePreference;
  }, [timezonePreference]);

  const updateTimezone = useCallback((timezone: string) => {
    setTimezonePreference(timezone);
    setTimezonePreferenceState(timezone);
  }, []);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TIMEZONE_STORAGE_KEY && e.newValue) {
        setTimezonePreferenceState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [timezonePreference, updateTimezone, effectiveTimezone];
}

// Format a time string for display
export function formatTimeForDisplay(
  isoTime: string,
  timezone: string,
  options?: {
    includeSeconds?: boolean;
    includeDate?: boolean;
    use24Hour?: boolean;
  }
): string {
  const { includeSeconds = false, includeDate = false, use24Hour = true } = options || {};

  try {
    const date = new Date(isoTime);

    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' }),
      hour12: !use24Hour,
    };

    if (includeDate) {
      return date.toLocaleString('en-US', {
        ...timeOptions,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    return date.toLocaleTimeString('en-US', timeOptions);
  } catch {
    return isoTime;
  }
}

// Get a friendly display name for a timezone
export function getTimezoneDisplayName(timezone: string): string {
  if (timezone === 'auto') {
    return `Auto (${getLocalTimezone()})`;
  }

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    const abbrev = tzPart?.value || '';

    // Format: "America/New_York (EST)"
    const displayName = timezone.replace(/_/g, ' ');
    return abbrev ? `${displayName} (${abbrev})` : displayName;
  } catch {
    return timezone;
  }
}
