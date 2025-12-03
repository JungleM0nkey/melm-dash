import { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { PanelWrapper } from './PanelWrapper';
import { PANEL_DRAG_TYPE, type PanelDragItem } from '../../types/panel';
import { usePanelManagement } from '../../context/PanelManagementContext';

interface DraggablePanelWrapperProps {
  /** Unique panel ID */
  panelId: string;
  /** Panel title displayed in the header */
  title: string;
  /** Panel content */
  children: React.ReactNode;
  /** Whether this is the last visible panel */
  isLastPanel: boolean;
}

/**
 * Wrapper component that adds react-dnd drag capability to a panel.
 * The grip icon on the right side of the panel header can be dragged
 * to hide the panel by dropping it on the drawer.
 */
export function DraggablePanelWrapper({
  panelId,
  title,
  children,
  isLastPanel,
}: DraggablePanelWrapperProps) {
  const { onDragStart, onDragEnd } = usePanelManagement();

  // Ref for the hide drag handle
  const hideDragRef = useRef<HTMLDivElement>(null);

  // Set up react-dnd drag
  const [, drag, preview] = useDrag<PanelDragItem, void, { isDragging: boolean }>(
    () => ({
      type: PANEL_DRAG_TYPE,
      item: () => {
        // Called when drag starts
        onDragStart(panelId, 'grid');
        return {
          type: PANEL_DRAG_TYPE,
          panelId,
          source: 'grid' as const,
        };
      },
      end: () => {
        // Called when drag ends (regardless of drop)
        onDragEnd();
      },
      canDrag: () => !isLastPanel, // Cannot drag the last panel
    }),
    [panelId, isLastPanel, onDragStart, onDragEnd]
  );

  // Use empty image for drag preview (the panel stays in place during drag)
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Connect the drag ref to the hide drag handle
  useEffect(() => {
    if (hideDragRef.current) {
      drag(hideDragRef.current);
    }
  }, [drag]);

  return (
    <PanelWrapper
      title={title}
      hideDragRef={hideDragRef}
      isLastPanel={isLastPanel}
    >
      {children}
    </PanelWrapper>
  );
}
