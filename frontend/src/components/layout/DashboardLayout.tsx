import { useState, useCallback, useRef, useEffect } from 'react';
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import { Box, Flex } from '@chakra-ui/react';
import { DashboardHeader } from './DashboardHeader';
import { PanelWrapper } from './PanelWrapper';

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
  { id: 'resources', title: 'System Resources', component: SystemResourcesPanel },
  { id: 'docker', title: 'Docker Containers', component: DockerContainersPanel },
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
    (window as unknown as { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(store);
  } else {
    // Fallback: schedule after current event loop
    setTimeout(store, 0);
  }
}

export function DashboardLayout() {
  const [layouts, setLayouts] = useState<Layouts>(() => {
    return getStoredLayouts() || defaultLayouts;
  });

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

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts(allLayouts);

      // Debounce storage to avoid blocking during rapid drag operations
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
      }
      storageTimerRef.current = setTimeout(() => {
        storeLayoutsAsync(allLayouts);
      }, STORAGE_DEBOUNCE_MS);
    },
    []
  );

  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    // Immediate storage for explicit user action
    storeLayoutsAsync(defaultLayouts);
  }, []);

  return (
    <Flex direction="column" minH="100vh" bg="bg.primary">
      <DashboardHeader onResetLayout={handleResetLayout} />

      <Box flex="1" p={4} overflow="auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
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
          {panels.map((panel) => {
            const Component = panel.component;
            return (
              <Box key={panel.id}>
                <PanelWrapper title={panel.title}>
                  <Component />
                </PanelWrapper>
              </Box>
            );
          })}
        </ResponsiveGridLayout>
      </Box>
    </Flex>
  );
}
