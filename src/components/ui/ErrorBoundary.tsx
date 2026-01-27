'use client';

import { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch React errors
 * Provides a fallback UI when errors occur
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size="sm" py="xl">
          <Stack gap="md">
            <Alert
              icon={<IconAlertCircle size={24} />}
              title="Something went wrong"
              color="red"
            >
              <Text size="sm" mb="md">
                An unexpected error occurred. Please try refreshing the page.
              </Text>
              {this.state.error && (
                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}
            </Alert>

            <Button onClick={this.handleReset} fullWidth>
              Refresh Page
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
