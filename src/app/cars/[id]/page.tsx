'use client';

import { Stack, Title, Text, Button, Group, Paper, Badge } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CarForm } from '@/components/cars/CarForm';
import { MileageChart } from '@/components/dashboard/MileageChart';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppState } from '@/hooks/useAppState';
import { useStats } from '@/hooks/useStats';
import { formatNumber } from '@/lib/calculations';
import type { CarFormData } from '@/lib/schemas';

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;

  const { cars, readings, updateCar, deleteCar, isLoading } = useAppState();
  const { carsWithStats, getCarMonthlyData } = useStats(cars, readings);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const car = carsWithStats.find((c) => c.id === carId);
  const monthlyData = car ? getCarMonthlyData(car.id) : [];

  if (isLoading) {
    return (
      <AppShell title="Vehicle Details">
        <LoadingState />
      </AppShell>
    );
  }

  if (!car) {
    return (
      <AppShell title="Vehicle Details">
        <Stack align="center" py="xl">
          <Text>Vehicle not found</Text>
          <Button onClick={() => router.push('/cars')}>Back to Vehicles</Button>
        </Stack>
      </AppShell>
    );
  }

  const handleUpdate = (data: CarFormData) => {
    updateCar(carId, data);
    router.push('/cars');
  };

  const handleDelete = () => {
    deleteCar(carId);
    router.push('/cars');
  };

  return (
    <AppShell title={car.name}>
      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                {car.year} {car.make} {car.model}
              </Text>
              <Group gap="xs">
                <Badge color={car.color} variant="light">
                  YTD: {formatNumber(car.ytdMileage)} mi
                </Badge>
                {car.latestReading && (
                  <Badge variant="outline" color="gray">
                    Current: {formatNumber(car.latestReading.reading)} mi
                  </Badge>
                )}
                {car.totalReadings === 1 && !car.initialOdometer && (
                  <Badge color="yellow" variant="light">
                    Add starting odometer to see YTD mileage
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Paper>

        <MileageChart data={monthlyData} carColor={`${car.color}.6`} />

        <Stack gap={4}>
          <Title order={4}>Edit Vehicle</Title>
          <Text size="sm" c="dimmed">
            Update your vehicle information
          </Text>
        </Stack>

        <CarForm
          initialValues={{
            name: car.name,
            make: car.make,
            model: car.model,
            year: car.year,
            color: car.color,
            initialOdometer: car.initialOdometer,
            trackingStartDate: car.trackingStartDate,
          }}
          onSubmit={handleUpdate}
          onCancel={() => router.back()}
          submitLabel="Save Changes"
        />

        <Button
          variant="subtle"
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Vehicle
        </Button>

        <ConfirmModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Vehicle"
          message={`Are you sure you want to delete "${car.name}"? This will also remove all associated readings.`}
          confirmLabel="Delete"
          confirmColor="red"
        />
      </Stack>
    </AppShell>
  );
}
