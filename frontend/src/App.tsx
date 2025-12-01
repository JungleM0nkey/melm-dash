import { ChakraProvider, ColorModeScript, Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { theme } from './theme';
import { DashboardProvider } from './context/DashboardContext';
import { DashboardLayout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Top-level error fallback
function AppErrorFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={8}
    >
      <VStack gap={6} maxW="lg" textAlign="center">
        <Heading color="red.400" size="xl">
          Application Error
        </Heading>
        <Text color="gray.300">
          The dashboard encountered an unexpected error. This might be a temporary issue.
          Please try reloading the page.
        </Text>
        <Button colorScheme="blue" onClick={handleReload}>
          Reload Dashboard
        </Button>
      </VStack>
    </Box>
  );
}

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <ErrorBoundary fallback={<AppErrorFallback />}>
          <DashboardProvider port={3001}>
            <DashboardLayout />
          </DashboardProvider>
        </ErrorBoundary>
      </ChakraProvider>
    </>
  );
}

export default App;
