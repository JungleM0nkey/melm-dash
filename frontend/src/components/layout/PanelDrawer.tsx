import { Box, Flex, Heading, VStack, HStack, Text, IconButton, Badge } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Plus } from 'lucide-react';
import { PanelDropZone } from './PanelDropZone';

interface HiddenPanelInfo {
  id: string;
  title: string;
}

interface PanelDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Called when the close button is clicked */
  onClose: () => void;
  /** List of hidden panels */
  hiddenPanels: HiddenPanelInfo[];
  /** Called when a panel should be restored */
  onRestorePanel: (panelId: string) => void;
  /** Called when a panel is dropped on the drop zone */
  onHidePanel: (panelId: string) => void;
  /** Whether a panel is currently being dragged */
  isDragging: boolean;
}

const MotionBox = motion.create(Box);

/**
 * Slide-out drawer for managing panel visibility.
 * Shows hidden panels and provides a drop zone for hiding panels.
 */
export function PanelDrawer({
  isOpen,
  onClose,
  hiddenPanels,
  onRestorePanel,
  onHidePanel,
  isDragging,
}: PanelDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBox
          position="fixed"
          top={0}
          right={0}
          bottom={0}
          w="280px"
          bg="bg.panel"
          borderLeftWidth="1px"
          borderColor="border.primary"
          zIndex={1000}
          boxShadow="-4px 0 16px rgba(0, 0, 0, 0.3)"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          display="flex"
          flexDirection="column"
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="border.primary"
            bg="bg.header"
          >
            <HStack spacing={2}>
              <LayoutGrid size={18} color="#a0a0a0" />
              <Heading size="sm" color="fg.primary">
                Panels
              </Heading>
              {hiddenPanels.length > 0 && (
                <Badge
                  colorScheme="purple"
                  variant="solid"
                  fontSize="xs"
                  borderRadius="full"
                >
                  {hiddenPanels.length}
                </Badge>
              )}
            </HStack>
            <IconButton
              aria-label="Close panel drawer"
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              opacity={0.7}
              _hover={{ opacity: 1 }}
            >
              <X size={16} />
            </IconButton>
          </Flex>

          {/* Content */}
          <Box flex="1" overflow="auto" py={3}>
            {/* Drop zone for hiding panels */}
            <PanelDropZone onDrop={onHidePanel} isActive={isDragging} />

            {/* Hidden panels list */}
            {hiddenPanels.length > 0 ? (
              <VStack spacing={2} px={3} align="stretch">
                <Text fontSize="xs" color="fg.muted" fontWeight="medium" px={1}>
                  HIDDEN PANELS
                </Text>
                {hiddenPanels.map((panel) => (
                  <HiddenPanelItem
                    key={panel.id}
                    title={panel.title}
                    onRestore={() => onRestorePanel(panel.id)}
                  />
                ))}
              </VStack>
            ) : !isDragging ? (
              <Box px={4} py={8} textAlign="center">
                <Text fontSize="sm" color="fg.muted">
                  Drag a panel here to hide it
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={2} opacity={0.7}>
                  Use the grip icon on any panel
                </Text>
              </Box>
            ) : null}
          </Box>
        </MotionBox>
      )}
    </AnimatePresence>
  );
}

interface HiddenPanelItemProps {
  title: string;
  onRestore: () => void;
}

/**
 * Individual hidden panel item in the drawer.
 * Click to restore the panel to the dashboard.
 */
function HiddenPanelItem({ title, onRestore }: HiddenPanelItemProps) {
  return (
    <HStack
      p={3}
      bg="bg.header"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.primary"
      justify="space-between"
      cursor="pointer"
      opacity={0.85}
      transition="all 150ms ease"
      _hover={{
        opacity: 1,
        bg: 'bg.hover',
        borderColor: 'border.hover',
      }}
      onClick={onRestore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRestore();
        }
      }}
      aria-label={`Restore ${title} panel`}
    >
      <Text fontSize="sm" color="fg.primary" noOfLines={1}>
        {title}
      </Text>
      <IconButton
        aria-label={`Restore ${title}`}
        size="xs"
        variant="ghost"
        colorScheme="purple"
        onClick={(e) => {
          e.stopPropagation();
          onRestore();
        }}
      >
        <Plus size={14} />
      </IconButton>
    </HStack>
  );
}
