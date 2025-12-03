import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Layouts } from 'react-grid-layout';
import { usePanelVisibility } from '../hooks/usePanelVisibility';
import type { HiddenPanelPositions } from '../types/panel';
import { PanelDragLayer } from '../components/layout/PanelDragLayer';

/**
 * Drag state for tracking active drag operations
 */
interface DragState {
  isDragging: boolean;
  draggedPanelId: string | null;
  dragSource: 'grid' | 'drawer' | null;
}

/**
 * Context value for panel management
 */
export interface PanelManagementContextValue {
  // Visibility state
  visiblePanelIds: string[];
  hiddenPanelIds: string[];
  isVisible: (panelId: string) => boolean;

  // Drag state
  isDragging: boolean;
  draggedPanelId: string | null;
  isDrawerOpen: boolean;

  // Actions
  hidePanel: (panelId: string, currentLayouts: Layouts) => void;
  showPanel: (panelId: string) => HiddenPanelPositions[string] | null;
  onDragStart: (panelId: string, source: 'grid' | 'drawer') => void;
  onDragEnd: () => void;

  // Drawer controls
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Reset
  resetAll: () => void;

  // Get stored position for a hidden panel
  getStoredPosition: (panelId: string) => HiddenPanelPositions[string] | null;
}

const PanelManagementContext =
  createContext<PanelManagementContextValue | null>(null);

interface PanelManagementProviderProps {
  children: ReactNode;
}

// Delay before closing drawer after drag ends (allows for drop detection)
const DRAWER_CLOSE_DELAY_MS = 300;

/**
 * Provider component for panel management.
 * Wraps children with DndProvider and manages panel visibility and drag state.
 */
export function PanelManagementProvider({
  children,
}: PanelManagementProviderProps) {
  // Panel visibility from hook
  const {
    visiblePanelIds,
    hiddenPanelIds,
    isVisible,
    hidePanel: hidePanelInternal,
    showPanel: showPanelInternal,
    resetVisibility,
    getStoredPosition,
  } = usePanelVisibility();

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedPanelId: null,
    dragSource: null,
  });

  // Track if drawer should be forced open (during drag or manually opened)
  const [drawerForceOpen, setDrawerForceOpen] = useState(false);

  // Track if drawer was manually closed by user (overrides auto-open for hidden panels)
  const [drawerManuallyClosed, setDrawerManuallyClosed] = useState(false);

  // Timer ref for delayed drawer close
  const drawerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (drawerCloseTimerRef.current) {
        clearTimeout(drawerCloseTimerRef.current);
      }
    };
  }, []);

  // Drawer is open if: force open flag is set AND not manually closed
  // OR if dragging (always show during drag)
  const isDrawerOpen = drawerForceOpen && !drawerManuallyClosed;

  const onDragStart = useCallback(
    (panelId: string, source: 'grid' | 'drawer') => {
      // Cancel any pending drawer close
      if (drawerCloseTimerRef.current) {
        clearTimeout(drawerCloseTimerRef.current);
        drawerCloseTimerRef.current = null;
      }

      setDragState({
        isDragging: true,
        draggedPanelId: panelId,
        dragSource: source,
      });

      // Force open drawer when drag starts and clear manual close
      setDrawerForceOpen(true);
      setDrawerManuallyClosed(false);
    },
    []
  );

  const onDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedPanelId: null,
      dragSource: null,
    });

    // Delayed drawer close
    drawerCloseTimerRef.current = setTimeout(() => {
      setDrawerForceOpen(false);
    }, DRAWER_CLOSE_DELAY_MS);
  }, []);

  const hidePanel = useCallback(
    (panelId: string, currentLayouts: Layouts) => {
      hidePanelInternal(panelId, currentLayouts);
    },
    [hidePanelInternal]
  );

  const showPanel = useCallback(
    (panelId: string) => {
      return showPanelInternal(panelId);
    },
    [showPanelInternal]
  );

  const resetAll = useCallback(() => {
    resetVisibility();
    setDrawerForceOpen(false);
    setDrawerManuallyClosed(false);
  }, [resetVisibility]);

  // Drawer control functions
  const openDrawer = useCallback(() => {
    setDrawerForceOpen(true);
    setDrawerManuallyClosed(false);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerManuallyClosed(true);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      setDrawerManuallyClosed(true);
    } else {
      setDrawerForceOpen(true);
      setDrawerManuallyClosed(false);
    }
  }, [isDrawerOpen]);

  // Memoize context value
  const value = useMemo<PanelManagementContextValue>(
    () => ({
      // Visibility
      visiblePanelIds,
      hiddenPanelIds,
      isVisible,

      // Drag state
      isDragging: dragState.isDragging,
      draggedPanelId: dragState.draggedPanelId,
      isDrawerOpen,

      // Actions
      hidePanel,
      showPanel,
      onDragStart,
      onDragEnd,

      // Drawer controls
      openDrawer,
      closeDrawer,
      toggleDrawer,

      // Reset
      resetAll,

      // Position lookup
      getStoredPosition,
    }),
    [
      visiblePanelIds,
      hiddenPanelIds,
      isVisible,
      dragState.isDragging,
      dragState.draggedPanelId,
      isDrawerOpen,
      hidePanel,
      showPanel,
      onDragStart,
      onDragEnd,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      resetAll,
      getStoredPosition,
    ]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <PanelManagementContext.Provider value={value}>
        {children}
        <PanelDragLayer />
      </PanelManagementContext.Provider>
    </DndProvider>
  );
}

/**
 * Hook to access panel management context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePanelManagement(): PanelManagementContextValue {
  const context = useContext(PanelManagementContext);
  if (!context) {
    throw new Error(
      'usePanelManagement must be used within a PanelManagementProvider'
    );
  }
  return context;
}

/**
 * Selector hook for visibility state only (reduces re-renders)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePanelVisibilityState() {
  const { visiblePanelIds, hiddenPanelIds, isVisible } = usePanelManagement();
  return { visiblePanelIds, hiddenPanelIds, isVisible };
}

/**
 * Selector hook for drag state only (reduces re-renders)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePanelDragState() {
  const { isDragging, draggedPanelId, isDrawerOpen } = usePanelManagement();
  return { isDragging, draggedPanelId, isDrawerOpen };
}
