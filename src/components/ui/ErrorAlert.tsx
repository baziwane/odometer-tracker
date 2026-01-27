'use client';

import { Alert, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ErrorAlertProps {
  error: string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Reusable error alert component
 */
export function ErrorAlert({
  error,
  title = 'Error',
  onRetry,
  onDismiss,
}: ErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      color="red"
      title={title}
      withCloseButton={!!onDismiss}
      onClose={onDismiss}
    >
      {error}
      {onRetry && (
        <Button size="xs" variant="light" color="red" mt="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Alert>
  );
}
