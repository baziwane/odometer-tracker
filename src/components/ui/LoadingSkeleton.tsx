'use client';

import { Skeleton, Stack, Group, Paper } from '@mantine/core';

/**
 * Loading skeleton for car cards
 */
export function CarCardSkeleton() {
  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Skeleton height={24} width="60%" />
          <Skeleton height={20} width={60} />
        </Group>
        <Skeleton height={16} width="40%" />
        <Group gap="xs">
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={80} />
        </Group>
      </Stack>
    </Paper>
  );
}

/**
 * Loading skeleton for stats cards
 */
export function StatsCardSkeleton() {
  return (
    <Paper p="md" withBorder>
      <Stack gap="xs">
        <Skeleton height={14} width="50%" />
        <Skeleton height={32} width="70%" />
        <Skeleton height={12} width="40%" />
      </Stack>
    </Paper>
  );
}

/**
 * Loading skeleton for reading list items
 */
export function ReadingListSkeleton() {
  return (
    <Stack gap="xs">
      {[1, 2, 3, 4, 5].map((i) => (
        <Paper key={i} p="md" withBorder>
          <Group justify="space-between">
            <Stack gap="xs">
              <Skeleton height={16} width={100} />
              <Skeleton height={14} width={150} />
            </Stack>
            <Skeleton height={20} width={60} />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

/**
 * Loading skeleton for charts
 */
export function ChartSkeleton() {
  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Skeleton height={20} width={150} />
        <Skeleton height={300} />
      </Stack>
    </Paper>
  );
}

/**
 * Generic page loading skeleton
 */
export function PageLoadingSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={40} width="40%" />
      <Skeleton height={200} />
      <Group gap="md">
        <Skeleton height={100} style={{ flex: 1 }} />
        <Skeleton height={100} style={{ flex: 1 }} />
        <Skeleton height={100} style={{ flex: 1 }} />
      </Group>
      <Skeleton height={300} />
    </Stack>
  );
}
