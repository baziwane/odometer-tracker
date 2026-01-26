'use client';

import { Paper, Group, Stack, Text, Badge, ThemeIcon } from '@mantine/core';
import { IconCar, IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/calculations';
import type { CarWithStats } from '@/types';

interface CarCardProps {
  car: CarWithStats;
}

export function CarCard({ car }: CarCardProps) {
  const router = useRouter();

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(`/cars/${car.id}`)}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={48} radius="md" variant="light" color={car.color}>
            <IconCar size={24} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={600} size="md">
              {car.name}
            </Text>
            <Text size="sm" c="dimmed">
              {car.year} {car.make} {car.model}
            </Text>
            <Group gap="xs" mt={4}>
              <Badge size="sm" variant="light" color={car.color}>
                YTD: {formatNumber(car.ytdMileage)} mi
              </Badge>
              {car.latestReading && (
                <Badge size="sm" variant="outline" color="gray">
                  {formatNumber(car.latestReading.reading)} mi
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>
        <IconChevronRight size={20} color="var(--mantine-color-dimmed)" />
      </Group>
    </Paper>
  );
}
