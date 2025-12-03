import type { Layout, Layouts } from 'react-grid-layout';

/**
 * Configuration for a dashboard panel
 */
export interface PanelConfig {
  id: string;
  title: string;
  component: React.ComponentType;
}

/**
 * Drag item type for react-dnd
 */
export interface PanelDragItem {
  type: typeof PANEL_DRAG_TYPE;
  panelId: string;
  source: 'grid' | 'drawer';
}

/**
 * Constant for react-dnd item type
 */
export const PANEL_DRAG_TYPE = 'PANEL' as const;

/**
 * Stored positions for hidden panels (to restore to same location)
 */
export interface HiddenPanelPositions {
  [panelId: string]: {
    [breakpoint: string]: Layout;
  };
}

/**
 * Panel visibility state structure
 */
export interface PanelVisibilityState {
  visiblePanelIds: string[];
  hiddenPositions: HiddenPanelPositions;
}

/**
 * Default panel IDs (all panels)
 */
export const ALL_PANEL_IDS = [
  'resources',
  'docker',
  'ports',
  'storage',
  'system',
  'network',
  'services',
] as const;

export type PanelId = (typeof ALL_PANEL_IDS)[number];

/**
 * Extract layout for a specific panel from all layouts
 */
export function extractPanelLayout(
  panelId: string,
  layouts: Layouts
): HiddenPanelPositions[string] {
  const result: HiddenPanelPositions[string] = {};

  for (const [breakpoint, layoutItems] of Object.entries(layouts)) {
    const item = layoutItems.find((l) => l.i === panelId);
    if (item) {
      result[breakpoint] = { ...item };
    }
  }

  return result;
}

/**
 * Merge a hidden panel's stored position back into layouts
 */
export function mergePanelLayout(
  panelId: string,
  storedPosition: HiddenPanelPositions[string],
  currentLayouts: Layouts,
  defaultLayouts: Layouts
): Layouts {
  const result: Layouts = {};

  for (const [breakpoint, layoutItems] of Object.entries(currentLayouts)) {
    // Get stored position for this breakpoint, or fall back to default
    const panelLayout =
      storedPosition[breakpoint] ||
      defaultLayouts[breakpoint]?.find((l) => l.i === panelId);

    if (panelLayout) {
      result[breakpoint] = [...layoutItems, { ...panelLayout }];
    } else {
      result[breakpoint] = layoutItems;
    }
  }

  return result;
}
