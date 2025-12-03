import { type ReactNode, type Ref } from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';

interface PanelWrapperProps {
  title: string;
  children: ReactNode;
  /** Optional ref for the hide drag handle (for react-dnd integration) */
  hideDragRef?: Ref<HTMLDivElement>;
  /** Whether this is the last visible panel (cannot be hidden) */
  isLastPanel?: boolean;
}

export function PanelWrapper({
  title,
  children,
  hideDragRef,
  isLastPanel = false,
}: PanelWrapperProps) {
  return (
    <Box
      h="100%"
      bg="bg.panel"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.primary"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header with dual drag handles */}
      <Flex
        align="center"
        justify="space-between"
        bg="bg.header"
        borderBottomWidth="1px"
        borderColor="border.primary"
        px={3}
        py={2}
        userSelect="none"
      >
        {/* Left side: Title area - grid drag handle */}
        <Flex
          className="drag-handle"
          align="center"
          flex="1"
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          mr={2}
        >
          <Heading size="sm" color="fg.primary" fontWeight="semibold">
            {title}
          </Heading>
        </Flex>

        {/* Right side: Grip icon - hide drag handle */}
        <Box
          ref={hideDragRef}
          color="fg.muted"
          opacity={isLastPanel ? 0.3 : 0.5}
          cursor={isLastPanel ? 'not-allowed' : 'grab'}
          p={1}
          borderRadius="sm"
          transition="all 150ms ease"
          _hover={
            isLastPanel
              ? undefined
              : {
                  opacity: 1,
                  color: 'purple.400',
                  bg: 'whiteAlpha.100',
                }
          }
          _active={isLastPanel ? undefined : { cursor: 'grabbing' }}
          title={
            isLastPanel
              ? 'Cannot hide last panel'
              : 'Drag to hide panel'
          }
        >
          <GripVertical size={16} />
        </Box>
      </Flex>

      {/* Content */}
      <Box flex="1" overflow="auto" p={3}>
        {children}
      </Box>
    </Box>
  );
}
