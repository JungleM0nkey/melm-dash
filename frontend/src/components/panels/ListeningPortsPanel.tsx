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
} from '@chakra-ui/react';
import { usePorts } from '../../context/DashboardContext';

export function ListeningPortsPanel() {
  const ports = usePorts();

  if (ports.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">No listening ports found</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="dashboard" size="sm">
        <Thead>
          <Tr>
            <Th>Port</Th>
            <Th>Protocol</Th>
            <Th>Service</Th>
            <Th>Process</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ports.map((port, index) => (
            <Tr key={`${port.port}-${port.protocol}-${index}`}>
              <Td>
                <Text fontWeight="medium" fontFamily="mono" fontSize="sm">
                  {port.port}
                </Text>
              </Td>
              <Td>
                <Badge
                  colorScheme={port.protocol === 'tcp' ? 'blue' : 'purple'}
                  fontSize="xs"
                  textTransform="uppercase"
                >
                  {port.protocol}
                </Badge>
              </Td>
              <Td>
                <Text fontSize="sm">{port.service || '-'}</Text>
              </Td>
              <Td>
                <Box>
                  <Text fontSize="sm" isTruncated maxW="150px">
                    {port.process || '-'}
                  </Text>
                  {port.pid && (
                    <Text fontSize="xs" color="fg.muted">
                      PID: {port.pid}
                    </Text>
                  )}
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
