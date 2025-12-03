import { useDragLayer } from 'react-dnd';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';
import { PANEL_DRAG_TYPE, type PanelDragItem } from '../../types/panel';

// Panel title mapping
const PANEL_TITLES: Record<string, string> = {
  resources: 'System Resources',
  docker: 'Docker Containers',
  ports: 'Listening Ports',
  storage: 'Storage Drives',
  system: 'System Information',
  network: 'Network',
  services: 'Core Services',
};

/**
 * Custom drag layer that shows a shrunk preview of the panel being dragged.
 * This provides visual feedback while dragging panels to the drawer.
 */
export function PanelDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as PanelDragItem | null,
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  // Only show for panel drags
  if (!isDragging || !item || item.type !== PANEL_DRAG_TYPE || !currentOffset) {
    return null;
  }

  const title = PANEL_TITLES[item.panelId] || item.panelId;

  return (
    <Box
      position="fixed"
      pointerEvents="none"
      zIndex={2000}
      left={0}
      top={0}
      width="100%"
      height="100%"
    >
      <Box
        style={{
          transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
        }}
      >
        {/* Shrunk panel preview */}
        <Box
          w="180px"
          bg="bg.panel"
          borderRadius="lg"
          borderWidth="2px"
          borderColor="purple.500"
          overflow="hidden"
          boxShadow="0 8px 32px rgba(128, 90, 213, 0.3)"
          opacity={0.95}
          transform="scale(0.9)"
          transformOrigin="top left"
        >
          {/* Mini header */}
          <Flex
            align="center"
            justify="space-between"
            bg="bg.header"
            borderBottomWidth="1px"
            borderColor="border.primary"
            px={2}
            py={1.5}
          >
            <Heading size="xs" color="fg.primary" fontWeight="semibold" noOfLines={1}>
              {title}
            </Heading>
            <Box color="purple.400" opacity={0.8}>
              <GripVertical size={12} />
            </Box>
          </Flex>

          {/* Placeholder content area */}
          <Box px={2} py={3}>
            <Box h="40px" bg="whiteAlpha.50" borderRadius="sm" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
