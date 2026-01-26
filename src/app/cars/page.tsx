'use client';

import { Stack, Title, Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { CarCard } from '@/components/cars/CarCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppState } from '@/hooks/useAppState';
import { useStats } from '@/hooks/useStats';
import { IconCar } from '@tabler/icons-react';

export default function CarsPage() {
  const router = useRouter();
  const { cars, readings, isLoading } = useAppState();
  const { carsWithStats } = useStats(cars, readings);

  if (isLoading) {
    return (
      <AppShell title="Vehicles">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell title="Vehicles">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3}>Your Vehicles</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/cars/new')}
          >
            Add
          </Button>
        </Group>

        {cars.length === 0 ? (
          <EmptyState
            icon={<IconCar size={32} />}
            title="No vehicles yet"
            description="Add your first vehicle to start tracking mileage"
            actionLabel="Add Vehicle"
            onAction={() => router.push('/cars/new')}
          />
        ) : (
          <Stack gap="sm">
            {carsWithStats.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </Stack>
        )}
      </Stack>
    </AppShell>
  );
}
