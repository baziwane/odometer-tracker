'use client';

import { SimpleGrid, Paper, Text, Group, ThemeIcon, Stack } from '@mantine/core';
import {
  IconRoad,
  IconCalendar,
  IconTrendingUp,
  IconCar,
} from '@tabler/icons-react';
import { formatNumber } from '@/lib/calculations';

interface StatsOverviewProps {
  ytdMileage: number;
  monthlyAverage: number;
  totalCars: number;
  currentMonth: number;
}

export function StatsOverview({
  ytdMileage,
  monthlyAverage,
  totalCars,
  currentMonth,
}: StatsOverviewProps) {
  const stats = [
    {
      label: 'YTD Mileage',
      value: formatNumber(ytdMileage),
      unit: 'miles',
      icon: IconRoad,
      color: 'blue',
    },
    {
      label: 'Monthly Avg',
      value: formatNumber(monthlyAverage),
      unit: 'miles/mo',
      icon: IconTrendingUp,
      color: 'teal',
    },
    {
      label: 'This Month',
      value: formatNumber(currentMonth),
      unit: 'miles',
      icon: IconCalendar,
      color: 'violet',
    },
    {
      label: 'Vehicles',
      value: String(totalCars),
      unit: 'tracked',
      icon: IconCar,
      color: 'orange',
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
      {stats.map((stat) => (
        <Paper key={stat.label} p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {stat.label}
            </Text>
            <ThemeIcon
              color={stat.color}
              variant="light"
              size="sm"
              radius="xl"
            >
              <stat.icon size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>
            {stat.value}
          </Text>
          <Text size="xs" c="dimmed">
            {stat.unit}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
