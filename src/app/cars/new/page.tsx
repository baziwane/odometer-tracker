'use client';

import { Stack, Title, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { CarForm } from '@/components/cars/CarForm';
import { useAppState } from '@/hooks/useAppState';
import type { CarFormData } from '@/lib/schemas';

export default function NewCarPage() {
  const router = useRouter();
  const { addCar, cars, updateSettings } = useAppState();

  const handleSubmit = (data: CarFormData) => {
    const newCar = addCar(data);

    if (cars.length === 0) {
      updateSettings({ defaultCarId: newCar.id });
    }

    router.push('/cars');
  };

  return (
    <AppShell title="Add Vehicle">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>New Vehicle</Title>
          <Text size="sm" c="dimmed">
            Add a vehicle to track its odometer readings
          </Text>
        </Stack>

        <CarForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Add Vehicle"
        />
      </Stack>
    </AppShell>
  );
}
