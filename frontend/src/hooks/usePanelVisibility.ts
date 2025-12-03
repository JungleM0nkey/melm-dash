import { useState, useEffect, useCallback, useRef } from 'react';
import type { Layouts } from 'react-grid-layout';
import {
  type HiddenPanelPositions,
  ALL_PANEL_IDS,
  extractPanelLayout,
} from '../types/panel';

const VISIBILITY_STORAGE_KEY = 'melm-dash-panel-visibility';
const HIDDEN_POSITIONS_STORAGE_KEY = 'melm-dash-hidden-positions';

// Debounce delay for storage (prevents blocking during rapid operations)
const STORAGE_DEBOUNCE_MS = 300;

/**
 * Get stored visibility state from localStorage
 */
function getStoredVisibility(): string[] {
  try {
    const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Validate that all IDs are valid panel IDs
        return parsed.filter((id) => ALL_PANEL_IDS.includes(id));
      }
    }
  } catch (error) {
    console.error('Failed to read panel visibility:', error);
  }
  // Default: all panels visible
  return [...ALL_PANEL_IDS];
}

/**
 * Get stored hidden panel positions from localStorage
 */
function getStoredHiddenPositions(): HiddenPanelPositions {
  try {
    const stored = localStorage.getItem(HIDDEN_POSITIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read hidden positions:', error);
  }
  return {};
}

/**
 * Store visibility to localStorage (non-blocking)
 */
function storeVisibilityAsync(visiblePanelIds: string[]): void {
  const store = () => {
    try {
      localStorage.setItem(
        VISIBILITY_STORAGE_KEY,
        JSON.stringify(visiblePanelIds)
      );
    } catch (error) {
      console.error('Failed to save panel visibility:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    (
      window as unknown as { requestIdleCallback: (cb: () => void) => void }
    ).requestIdleCallback(store);
  } else {
    setTimeout(store, 0);
  }
}

/**
 * Store hidden positions to localStorage (non-blocking)
 */
function storeHiddenPositionsAsync(positions: HiddenPanelPositions): void {
  const store = () => {
    try {
      localStorage.setItem(
        HIDDEN_POSITIONS_STORAGE_KEY,
        JSON.stringify(positions)
      );
    } catch (error) {
      console.error('Failed to save hidden positions:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    (
      window as unknown as { requestIdleCallback: (cb: () => void) => void }
    ).requestIdleCallback(store);
  } else {
    setTimeout(store, 0);
  }
}

export interface UsePanelVisibilityReturn {
  /** Array of currently visible panel IDs */
  visiblePanelIds: string[];
  /** Array of currently hidden panel IDs */
  hiddenPanelIds: string[];
  /** Check if a specific panel is visible */
  isVisible: (panelId: string) => boolean;
  /** Hide a panel and store its current position */
  hidePanel: (panelId: string, currentLayouts: Layouts) => void;
  /** Show a panel and return its stored position (if any) */
  showPanel: (panelId: string) => HiddenPanelPositions[string] | null;
  /** Reset all panels to visible */
  resetVisibility: () => void;
  /** Get the stored position for a hidden panel */
  getStoredPosition: (panelId: string) => HiddenPanelPositions[string] | null;
}

/**
 * Hook for managing panel visibility with localStorage persistence.
 * Stores both visibility state and last known positions for hidden panels.
 */
export function usePanelVisibility(): UsePanelVisibilityReturn {
  const [visiblePanelIds, setVisiblePanelIds] = useState<string[]>(
    getStoredVisibility
  );
  const [hiddenPositions, setHiddenPositions] = useState<HiddenPanelPositions>(
    getStoredHiddenPositions
  );

  // Debounce timer refs for storage
  const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      if (positionsTimerRef.current) {
        clearTimeout(positionsTimerRef.current);
      }
    };
  }, []);

  // Compute hidden panel IDs
  const hiddenPanelIds = ALL_PANEL_IDS.filter(
    (id) => !visiblePanelIds.includes(id)
  );

  const isVisible = useCallback(
    (panelId: string) => visiblePanelIds.includes(panelId),
    [visiblePanelIds]
  );

  const hidePanel = useCallback(
    (panelId: string, currentLayouts: Layouts) => {
      // Enforce minimum 1 visible panel
      if (visiblePanelIds.length <= 1) {
        console.warn('Cannot hide last visible panel');
        return;
      }

      // Store the panel's current position before hiding
      const panelPosition = extractPanelLayout(panelId, currentLayouts);

      setHiddenPositions((prev) => {
        const updated = { ...prev, [panelId]: panelPosition };

        // Debounced storage
        if (positionsTimerRef.current) {
          clearTimeout(positionsTimerRef.current);
        }
        positionsTimerRef.current = setTimeout(() => {
          storeHiddenPositionsAsync(updated);
        }, STORAGE_DEBOUNCE_MS);

        return updated;
      });

      setVisiblePanelIds((prev) => {
        const updated = prev.filter((id) => id !== panelId);

        // Debounced storage
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
        }
        visibilityTimerRef.current = setTimeout(() => {
          storeVisibilityAsync(updated);
        }, STORAGE_DEBOUNCE_MS);

        return updated;
      });
    },
    [visiblePanelIds.length]
  );

  const showPanel = useCallback(
    (panelId: string): HiddenPanelPositions[string] | null => {
      // Get stored position before updating state
      const storedPosition = hiddenPositions[panelId] || null;

      setVisiblePanelIds((prev) => {
        if (prev.includes(panelId)) {
          return prev; // Already visible
        }

        const updated = [...prev, panelId];

        // Debounced storage
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
        }
        visibilityTimerRef.current = setTimeout(() => {
          storeVisibilityAsync(updated);
        }, STORAGE_DEBOUNCE_MS);

        return updated;
      });

      // Remove stored position after restoring
      setHiddenPositions((prev) => {
        const updated = { ...prev };
        delete updated[panelId];

        // Debounced storage
        if (positionsTimerRef.current) {
          clearTimeout(positionsTimerRef.current);
        }
        positionsTimerRef.current = setTimeout(() => {
          storeHiddenPositionsAsync(updated);
        }, STORAGE_DEBOUNCE_MS);

        return updated;
      });

      return storedPosition;
    },
    [hiddenPositions]
  );

  const getStoredPosition = useCallback(
    (panelId: string): HiddenPanelPositions[string] | null => {
      return hiddenPositions[panelId] || null;
    },
    [hiddenPositions]
  );

  const resetVisibility = useCallback(() => {
    const allVisible = [...ALL_PANEL_IDS];
    setVisiblePanelIds(allVisible);
    setHiddenPositions({});

    // Immediate storage for explicit user action
    storeVisibilityAsync(allVisible);
    storeHiddenPositionsAsync({});
  }, []);

  // Cross-tab sync via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === VISIBILITY_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setVisiblePanelIds(parsed);
          }
        } catch {
          // Ignore invalid JSON
        }
      }

      if (e.key === HIDDEN_POSITIONS_STORAGE_KEY && e.newValue) {
        try {
          setHiddenPositions(JSON.parse(e.newValue));
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    visiblePanelIds,
    hiddenPanelIds,
    isVisible,
    hidePanel,
    showPanel,
    resetVisibility,
    getStoredPosition,
  };
}
