import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  HStack,
  VStack,
  Progress,
} from '@chakra-ui/react';
import { Container } from 'lucide-react';
import { useDocker } from '../../context/DashboardContext';
import { formatUptime, formatMemory } from '../../utils/formatters';

const statusColors: Record<string, string> = {
  running: 'green',
  stopped: 'red',
  paused: 'yellow',
  restarting: 'blue',
};

export function DockerContainersPanel() {
  const containers = useDocker();

  if (containers.length === 0) {
    return (
      <VStack py={8} spacing={3}>
        <Container size={32} color="var(--chakra-colors-fg-muted)" />
        <Text color="fg.muted">No Docker containers found</Text>
      </VStack>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="dashboard" size="sm">
        <Thead>
          <Tr>
            <Th>Container</Th>
            <Th>Status</Th>
            <Th>CPU</Th>
            <Th>Memory</Th>
            <Th>Uptime</Th>
          </Tr>
        </Thead>
        <Tbody>
          {containers.map((container) => (
            <Tr key={container.id}>
              <Td>
                <Box>
                  <Text fontWeight="medium" fontSize="sm">
                    {container.name}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" isTruncated maxW="200px">
                    {container.image}
                  </Text>
                </Box>
              </Td>
              <Td>
                <Badge
                  colorScheme={statusColors[container.status] || 'gray'}
                  fontSize="xs"
                  textTransform="capitalize"
                >
                  {container.status}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <Progress
                    value={container.cpu}
                    size="xs"
                    w="50px"
                    borderRadius="full"
                    sx={{
                      '& > div': { bg: 'chart.cpu' },
                      bg: 'bg.header',
                    }}
                  />
                  <Text fontSize="xs" color="fg.muted" w="40px">
                    {container.cpu.toFixed(1)}%
                  </Text>
                </HStack>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <Text fontSize="xs">
                    {formatMemory(container.memory.usage)}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    / {formatMemory(container.memory.limit)}
                  </Text>
                </HStack>
              </Td>
              <Td>
                <Text fontSize="xs" color="fg.muted">
                  {container.status === 'running' ? formatUptime(container.uptime, true) : '-'}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
