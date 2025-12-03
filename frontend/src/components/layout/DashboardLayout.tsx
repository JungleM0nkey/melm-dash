import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Responsive,
  WidthProvider,
  type Layout,
  type Layouts,
} from 'react-grid-layout';
import { Box, Flex } from '@chakra-ui/react';
import { DashboardHeader } from './DashboardHeader';
import { DraggablePanelWrapper } from './DraggablePanelWrapper';
import { WidgetErrorBoundary } from '../ErrorBoundary';
import { PanelDrawer } from './PanelDrawer';
import { usePanelManagement } from '../../context/PanelManagementContext';
import { mergePanelLayout } from '../../types/panel';

// Import panel components
import { SystemResourcesPanel } from '../panels/SystemResourcesPanel';
import { DockerContainersPanel } from '../panels/DockerContainersPanel';
import { ListeningPortsPanel } from '../panels/ListeningPortsPanel';
import { StorageDrivesPanel } from '../panels/StorageDrivesPanel';
import { SystemInfoPanel } from '../panels/SystemInfoPanel';
import { NetworkPanel } from '../panels/NetworkPanel';
import { CoreServicesPanel } from '../panels/CoreServicesPanel';

// Note: react-grid-layout and react-resizable styles are defined in index.css

const ResponsiveGridLayout = WidthProvider(Responsive);

// Panel configuration
interface PanelConfig {
  id: string;
  title: string;
  component: React.ComponentType;
}

const panels: PanelConfig[] = [
  {
    id: 'resources',
    title: 'System Resources',
    component: SystemResourcesPanel,
  },
  {
    id: 'docker',
    title: 'Docker Containers',
    component: DockerContainersPanel,
  },
  { id: 'ports', title: 'Listening Ports', component: ListeningPortsPanel },
  { id: 'storage', title: 'Storage Drives', component: StorageDrivesPanel },
  { id: 'system', title: 'System Information', component: SystemInfoPanel },
  { id: 'network', title: 'Network', component: NetworkPanel },
  { id: 'services', title: 'Core Services', component: CoreServicesPanel },
];

// Default layouts for different breakpoints
const defaultLayouts: Layouts = {
  lg: [
    { i: 'resources', x: 0, y: 0, w: 8, h: 6, minW: 4, minH: 4 },
    { i: 'docker', x: 0, y: 6, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'ports', x: 0, y: 11, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'storage', x: 0, y: 16, w: 8, h: 4, minW: 4, minH: 3 },
    { i: 'system', x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'network', x: 8, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'services', x: 8, y: 11, w: 4, h: 5, minW: 3, minH: 3 },
  ],
  md: [
    { i: 'resources', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'docker', x: 0, y: 6, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'ports', x: 0, y: 11, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'storage', x: 0, y: 16, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'system', x: 6, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'network', x: 6, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'services', x: 6, y: 11, w: 4, h: 5, minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'resources', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'system', x: 0, y: 6, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'docker', x: 0, y: 11, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'network', x: 0, y: 16, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'ports', x: 0, y: 21, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'services', x: 0, y: 26, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'storage', x: 0, y: 30, w: 6, h: 4, minW: 3, minH: 3 },
  ],
};

const breakpoints = { lg: 1200, md: 996, sm: 768 };
const cols = { lg: 12, md: 10, sm: 6 };

// Storage key for persisting layouts
const LAYOUT_STORAGE_KEY = 'melm-dash-layouts';

// Debounce delay for layout storage (prevents blocking during rapid drag operations)
const STORAGE_DEBOUNCE_MS = 500;

function getStoredLayouts(): Layouts | null {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store layouts to localStorage (non-blocking via setTimeout)
 * Uses requestIdleCallback if available for better performance
 */
function storeLayoutsAsync(layouts: Layouts): void {
  const store = () => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    } catch {
      // Ignore storage errors (quota exceeded, private mode, etc.)
    }
  };

  // Use requestIdleCallback for non-blocking storage when browser is idle
  if ('requestIdleCallback' in window) {
    (
      window as unknown as { requestIdleCallback: (cb: () => void) => void }
    ).requestIdleCallback(store);
  } else {
    // Fallback: schedule after current event loop
    setTimeout(store, 0);
  }
}

export function DashboardLayout() {
  const [layouts, setLayouts] = useState<Layouts>(() => {
    return getStoredLayouts() || defaultLayouts;
  });

  // Panel management context
  const {
    visiblePanelIds,
    hiddenPanelIds,
    hidePanel,
    showPanel,
    isDragging,
    isDrawerOpen,
    resetAll,
  } = usePanelManagement();

  // Debounce timer ref for layout storage
  const storageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
      }
    };
  }, []);

  // Filter visible panels
  const visiblePanelConfigs = useMemo(
    () => panels.filter((p) => visiblePanelIds.includes(p.id)),
    [visiblePanelIds]
  );

  // Get hidden panels info for the drawer
  const hiddenPanelConfigs = useMemo(
    () =>
      panels
        .filter((p) => hiddenPanelIds.includes(p.id))
        .map((p) => ({ id: p.id, title: p.title })),
    [hiddenPanelIds]
  );

  // Filter layouts to only include visible panels
  const filteredLayouts = useMemo(() => {
    const result: Layouts = {};
    for (const [breakpoint, layoutItems] of Object.entries(layouts)) {
      result[breakpoint] = layoutItems.filter((item) =>
        visiblePanelIds.includes(item.i)
      );
    }
    return result;
  }, [layouts, visiblePanelIds]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      // Merge with existing layouts (preserve positions of hidden panels)
      setLayouts((prev) => {
        const merged: Layouts = {};
        for (const [breakpoint, newItems] of Object.entries(allLayouts)) {
          // Keep existing layout items for hidden panels
          const hiddenItems = prev[breakpoint]?.filter(
            (item) => !visiblePanelIds.includes(item.i)
          ) || [];
          merged[breakpoint] = [...newItems, ...hiddenItems];
        }
        return merged;
      });

      // Debounce storage to avoid blocking during rapid drag operations
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
      }
      storageTimerRef.current = setTimeout(() => {
        // Store the full layouts including hidden panels
        setLayouts((current) => {
          storeLayoutsAsync(current);
          return current;
        });
      }, STORAGE_DEBOUNCE_MS);
    },
    [visiblePanelIds]
  );

  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    resetAll(); // Also reset panel visibility
    // Immediate storage for explicit user action
    storeLayoutsAsync(defaultLayouts);
  }, [resetAll]);

  // Handle hiding a panel (dropped on drawer)
  const handleHidePanel = useCallback(
    (panelId: string) => {
      hidePanel(panelId, layouts);
    },
    [hidePanel, layouts]
  );

  // Handle restoring a panel (clicked in drawer)
  const handleRestorePanel = useCallback(
    (panelId: string) => {
      const storedPosition = showPanel(panelId);

      if (storedPosition) {
        // Restore to stored position
        setLayouts((prev) =>
          mergePanelLayout(panelId, storedPosition, prev, defaultLayouts)
        );
      } else {
        // Fall back to default position
        setLayouts((prev) => {
          const result: Layouts = {};
          for (const [breakpoint, layoutItems] of Object.entries(prev)) {
            const defaultLayout = defaultLayouts[breakpoint]?.find(
              (l) => l.i === panelId
            );
            if (defaultLayout) {
              result[breakpoint] = [...layoutItems, { ...defaultLayout }];
            } else {
              result[breakpoint] = layoutItems;
            }
          }
          return result;
        });
      }
    },
    [showPanel]
  );

  // Handle drawer close (only when manually closed, not during drag)
  const handleDrawerClose = useCallback(() => {
    // Drawer will auto-close when there are no hidden panels
    // This is handled by the context, so we don't need to do anything here
  }, []);

  return (
    <Flex direction="column" minH="100vh" bg="bg.primary">
      <DashboardHeader
        onResetLayout={handleResetLayout}
        hiddenPanelCount={hiddenPanelIds.length}
      />

      <Box
        flex="1"
        p={4}
        overflow="auto"
        className={`dashboard-grid-area ${isDragging ? 'is-dragging' : ''}`}
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={filteredLayouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={50}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          isResizable={true}
          isDraggable={true}
        >
          {visiblePanelConfigs.map((panel) => {
            const Component = panel.component;
            const isLastPanel = visiblePanelIds.length === 1;
            return (
              <Box key={panel.id}>
                <DraggablePanelWrapper
                  panelId={panel.id}
                  title={panel.title}
                  isLastPanel={isLastPanel}
                >
                  <WidgetErrorBoundary widgetName={panel.title}>
                    <Component />
                  </WidgetErrorBoundary>
                </DraggablePanelWrapper>
              </Box>
            );
          })}
        </ResponsiveGridLayout>
      </Box>

      {/* Panel Drawer */}
      <PanelDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        hiddenPanels={hiddenPanelConfigs}
        onRestorePanel={handleRestorePanel}
        onHidePanel={handleHidePanel}
        isDragging={isDragging}
      />
    </Flex>
  );
}
