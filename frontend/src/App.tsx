import { ChakraProvider, ColorModeScript, Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import theme from './theme';
import { DashboardProvider } from './context/DashboardContext';
import { PanelManagementProvider } from './context/PanelManagementContext';
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
      <VStack spacing={6} maxW="lg" textAlign="center">
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
  const wsPort = Number(import.meta.env.VITE_WS_PORT) || 3001;

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <ErrorBoundary fallback={<AppErrorFallback />}>
          <PanelManagementProvider>
            <DashboardProvider port={wsPort}>
              <DashboardLayout />
            </DashboardProvider>
          </PanelManagementProvider>
        </ErrorBoundary>
      </ChakraProvider>
    </>
  );
}

export default App;
