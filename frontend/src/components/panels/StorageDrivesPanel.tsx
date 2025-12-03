import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
} from '@chakra-ui/react';
import { useStorage } from '../../context/DashboardContext';
import { formatGB } from '../../utils/formatters';

function getUsageColor(percent: number): string {
  if (percent >= 90) return 'red.400';
  if (percent >= 75) return 'yellow.400';
  return 'chart.download';
}

export function StorageDrivesPanel() {
  const storage = useStorage();

  if (storage.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">No storage drives found</Text>
      </Box>
    );
  }

  // Sort by usage percentage, highest first
  const sortedStorage = [...storage].sort((a, b) => b.usagePercent - a.usagePercent);

  return (
    <VStack spacing={3} align="stretch">
      {sortedStorage.map((drive, index) => (
        <Box
          key={`${drive.device}-${index}`}
          p={3}
          bg="bg.header"
          borderRadius="md"
        >
          <HStack justify="space-between" mb={2}>
            <Box>
              <Text fontWeight="medium" fontSize="sm">
                {drive.mountPoint}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {drive.device} • {drive.filesystem}
              </Text>
            </Box>
            <Text
              fontWeight="bold"
              fontSize="sm"
              color={getUsageColor(drive.usagePercent)}
            >
              {drive.usagePercent.toFixed(1)}%
            </Text>
          </HStack>
          <Progress
            value={drive.usagePercent}
            size="sm"
            borderRadius="full"
            sx={{
              '& > div': { bg: getUsageColor(drive.usagePercent) },
              bg: 'bg.primary',
            }}
          />
          <HStack justify="space-between" mt={2}>
            <Text fontSize="xs" color="fg.muted">
              {formatGB(drive.used)} used
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {formatGB(drive.available)} free of {formatGB(drive.total)}
            </Text>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
