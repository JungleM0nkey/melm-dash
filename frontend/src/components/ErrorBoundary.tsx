import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          p={6}
          borderRadius="lg"
          bg="rgba(127, 29, 29, 0.2)"
          border="1px solid"
          borderColor="rgba(239, 68, 68, 0.3)"
        >
          <VStack spacing={4} align="start">
            <Heading size="md" color="red.300">
              Something went wrong
            </Heading>
            <Text color="gray.300">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Widget-specific error boundary with compact display
interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetName: string;
}

interface WidgetErrorState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WidgetErrorState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Widget "${this.props.widgetName}" error:`, error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          p={4}
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(127, 29, 29, 0.1)"
          borderRadius="md"
        >
          <VStack spacing={2}>
            <Text color="red.300" fontSize="sm">
              Failed to load {this.props.widgetName}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={this.handleRetry}
            >
              Retry
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}
