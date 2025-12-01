import { type ReactNode } from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';

interface PanelWrapperProps {
  title: string;
  children: ReactNode;
}

export function PanelWrapper({ title, children }: PanelWrapperProps) {
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
      {/* Header with drag handle */}
      <Flex
        className="drag-handle"
        align="center"
        justify="space-between"
        bg="bg.header"
        borderBottomWidth="1px"
        borderColor="border.primary"
        px={3}
        py={2}
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        userSelect="none"
      >
        <Heading size="sm" color="fg.primary" fontWeight="semibold">
          {title}
        </Heading>
        <Box color="fg.muted" opacity={0.5} _hover={{ opacity: 1 }}>
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
