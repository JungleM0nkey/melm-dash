import { useDrop } from 'react-dnd';
import { Box, Text, VStack, useToken } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { PANEL_DRAG_TYPE, type PanelDragItem } from '../../types/panel';

interface PanelDropZoneProps {
  /** Called when a panel is dropped on this zone */
  onDrop: (panelId: string) => void;
  /** Whether dragging is currently active (shows the zone) */
  isActive: boolean;
}

/**
 * Drop zone component for hiding panels.
 * Appears in the drawer when a panel is being dragged.
 */
export function PanelDropZone({ onDrop, isActive }: PanelDropZoneProps) {
  // Get theme-aware colors
  const [purpleColor, mutedColor] = useToken('colors', ['accent.purple', 'fg.muted']);

  const [{ isOver, canDrop }, dropRef] = useDrop<
    PanelDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: PANEL_DRAG_TYPE,
      drop: (item) => {
        // Only accept drops from the grid (not from drawer)
        if (item.source === 'grid') {
          onDrop(item.panelId);
        }
      },
      canDrop: (item) => item.source === 'grid',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onDrop]
  );

  // Only show when dragging is active and can drop
  if (!isActive) {
    return null;
  }

  const isHighlighted = isOver && canDrop;

  return (
    <Box
      ref={dropRef}
      minH="120px"
      mx={3}
      mb={3}
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={isHighlighted ? 'purple.400' : 'border.primary'}
      borderRadius="lg"
      bg={isHighlighted ? 'rgba(128, 90, 213, 0.15)' : 'transparent'}
      transition="all 150ms ease"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={2}>
        <Download
          size={24}
          color={isHighlighted ? purpleColor : mutedColor}
          style={{
            transition: 'color 150ms ease',
            transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
          }}
        />
        <Text
          fontSize="sm"
          color={isHighlighted ? 'purple.300' : 'fg.muted'}
          fontWeight={isHighlighted ? 'medium' : 'normal'}
          textAlign="center"
          transition="all 150ms ease"
        >
          {isHighlighted ? 'Release to hide panel' : 'Drop panel here to hide'}
        </Text>
      </VStack>
    </Box>
  );
}
