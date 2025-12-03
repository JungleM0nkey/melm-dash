import {
  Box,
  Flex,
  Heading,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  useColorModeValue,
  useToken,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutGrid,
  Plus,
  Cpu,
  Container,
  Network,
  HardDrive,
  Server,
  Radio,
  Settings2,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { PanelDropZone } from './PanelDropZone';

interface HiddenPanelInfo {
  id: string;
  title: string;
}

interface PanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenPanels: HiddenPanelInfo[];
  onRestorePanel: (panelId: string) => void;
  onHidePanel: (panelId: string) => void;
  isDragging: boolean;
  headerHeight: number;
}

const MotionBox = motion.create(Box);
const MotionOverlay = motion.create(Box);

// Panel metadata for icons and descriptions
const PANEL_META: Record<string, { icon: LucideIcon; description: string }> = {
  resources: {
    icon: Cpu,
    description: 'CPU, memory & load metrics',
  },
  docker: {
    icon: Container,
    description: 'Container status & stats',
  },
  ports: {
    icon: Radio,
    description: 'Active listening ports',
  },
  storage: {
    icon: HardDrive,
    description: 'Disk usage & mounts',
  },
  system: {
    icon: Server,
    description: 'Host & OS information',
  },
  network: {
    icon: Network,
    description: 'Network interfaces & traffic',
  },
  services: {
    icon: Settings2,
    description: 'Systemd service status',
  },
};

export function PanelDrawer({
  isOpen,
  onClose,
  hiddenPanels,
  onRestorePanel,
  onHidePanel,
  isDragging,
  headerHeight,
}: PanelDrawerProps) {
  const topOffset = `${headerHeight}px`;
  const [mutedColor] = useToken('colors', ['fg.muted']);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay */}
          {!isDragging && (
            <MotionOverlay
              position="fixed"
              top={topOffset}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.600"
              zIndex={900}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              cursor="pointer"
            />
          )}

          {/* Drawer panel */}
          <MotionBox
            position="fixed"
            top={topOffset}
            left={0}
            bottom={0}
            w="300px"
            bg="bg.panel"
            borderRightWidth="1px"
            borderColor="border.primary"
            zIndex={1000}
            boxShadow="4px 0 16px rgba(0, 0, 0, 0.3)"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
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
                <LayoutGrid size={18} color={mutedColor} />
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
                  <Text fontSize="xs" color="fg.muted" fontWeight="medium" px={1} mb={1}>
                    HIDDEN PANELS
                  </Text>
                  {hiddenPanels.map((panel) => (
                    <HiddenPanelCard
                      key={panel.id}
                      panelId={panel.id}
                      title={panel.title}
                      onRestore={() => onRestorePanel(panel.id)}
                    />
                  ))}
                </VStack>
              ) : !isDragging ? (
                <EmptyState />
              ) : null}
            </Box>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
}

interface HiddenPanelCardProps {
  panelId: string;
  title: string;
  onRestore: () => void;
}

function HiddenPanelCard({ panelId, title, onRestore }: HiddenPanelCardProps) {
  const meta = PANEL_META[panelId];
  const Icon = meta?.icon || LayoutGrid;
  const description = meta?.description || 'Dashboard panel';

  const cardBg = useColorModeValue('gray.50', 'gray.800');
  const cardHoverBg = useColorModeValue('gray.100', 'gray.700');
  const iconBg = useColorModeValue('purple.50', 'purple.900');
  const iconColor = useColorModeValue('purple.500', 'purple.300');

  return (
    <HStack
      p={3}
      bg={cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.primary"
      spacing={3}
      cursor="pointer"
      transition="all 150ms ease"
      _hover={{
        bg: cardHoverBg,
        borderColor: 'purple.400',
        transform: 'translateX(2px)',
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
      {/* Icon */}
      <Box
        p={2}
        borderRadius="md"
        bg={iconBg}
        color={iconColor}
        flexShrink={0}
      >
        <Icon size={18} />
      </Box>

      {/* Text content */}
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <Text fontSize="sm" color="fg.primary" fontWeight="medium" noOfLines={1}>
          {title}
        </Text>
        <Text fontSize="xs" color="fg.muted" noOfLines={1}>
          {description}
        </Text>
      </VStack>

      {/* Restore button */}
      <IconButton
        aria-label={`Restore ${title}`}
        size="sm"
        variant="ghost"
        colorScheme="purple"
        onClick={(e) => {
          e.stopPropagation();
          onRestore();
        }}
        flexShrink={0}
      >
        <Plus size={16} />
      </IconButton>
    </HStack>
  );
}

function EmptyState() {
  const iconBg = useColorModeValue('gray.100', 'gray.800');
  const iconColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <VStack px={4} py={8} spacing={4}>
      <Box
        p={4}
        borderRadius="full"
        bg={iconBg}
        color={iconColor}
      >
        <EyeOff size={28} />
      </Box>
      <VStack spacing={1}>
        <Text fontSize="sm" color="fg.secondary" fontWeight="medium">
          No hidden panels
        </Text>
        <Text fontSize="xs" color="fg.muted" textAlign="center" maxW="200px">
          Drag panels here using the grip handle to hide them from the dashboard
        </Text>
      </VStack>
    </VStack>
  );
}
