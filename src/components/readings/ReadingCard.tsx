'use client';

import { Paper, Group, Stack, Text, ActionIcon, Badge } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { formatNumber } from '@/lib/calculations';
import type { OdometerReading, Car } from '@/types';

interface ReadingCardProps {
  reading: OdometerReading;
  car?: Car;
  mileage?: number;
  onDelete?: (id: string) => void;
}

export function ReadingCard({
  reading,
  car,
  mileage,
  onDelete,
}: ReadingCardProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={600}>{dayjs(reading.date).format('MMMM YYYY')}</Text>
            {car && (
              <Badge size="sm" variant="light" color={car.color}>
                {car.name}
              </Badge>
            )}
          </Group>
          <Group gap="md">
            <Text size="sm" c="dimmed">
              Odometer: {formatNumber(reading.reading)} mi
            </Text>
            {mileage !== undefined && mileage > 0 && (
              <Text size="sm" c="teal" fw={500}>
                +{formatNumber(mileage)} mi
              </Text>
            )}
          </Group>
          {reading.notes && (
            <Text size="xs" c="dimmed" mt={4}>
              {reading.notes}
            </Text>
          )}
        </Stack>
        {onDelete && (
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete(reading.id)}
            aria-label="Delete reading"
          >
            <IconTrash size={18} />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
}
