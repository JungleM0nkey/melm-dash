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
  Progress,
} from '@chakra-ui/react';
import { useDocker } from '../../context/DashboardContext';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMemory(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

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
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">No Docker containers found</Text>
      </Box>
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
                  {container.status === 'running' ? formatUptime(container.uptime) : '-'}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
