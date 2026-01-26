'use client';

import { Stack, Text, ThemeIcon, Button } from '@mantine/core';
import { IconCar, IconPlus } from '@tabler/icons-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="md" py="xl">
      <ThemeIcon size={64} radius="xl" variant="light" color="gray">
        {icon ?? <IconCar size={32} />}
      </ThemeIcon>
      <Stack gap={4} align="center">
        <Text fw={600} size="lg">
          {title}
        </Text>
        <Text c="dimmed" size="sm" ta="center" maw={280}>
          {description}
        </Text>
      </Stack>
      {actionLabel && onAction && (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAction}
          mt="sm"
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
