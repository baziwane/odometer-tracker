'use client';

import { useState } from 'react';
import { Stack, Title, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ReadingForm } from '@/components/readings/ReadingForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppState } from '@/hooks/useAppState';
import { IconCar } from '@tabler/icons-react';

export default function AddReadingPage() {
  const router = useRouter();
  const { cars, readings, settings, addReading, isLoading } = useAppState();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    carId: string;
    date: string;
    reading: number;
    notes?: string;
  }) => {
    try {
      setSubmitting(true);
      addReading(data);
      router.push('/');
    } catch (error) {
      setSubmitting(false);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to add reading. Please check your input and try again.';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Add Reading">
        <LoadingState />
      </AppShell>
    );
  }

  if (cars.length === 0) {
    return (
      <AppShell title="Add Reading">
        <EmptyState
          icon={<IconCar size={32} />}
          title="No vehicles yet"
          description="Add a vehicle first before recording odometer readings"
          actionLabel="Add Vehicle"
          onAction={() => router.push('/cars/new')}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Add Reading">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>New Reading</Title>
          <Text size="sm" c="dimmed">
            Record your odometer reading for the end of the month
          </Text>
        </Stack>

        <ReadingForm
          cars={cars}
          readings={readings}
          defaultCarId={settings.defaultCarId}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading || submitting}
        />
      </Stack>
    </AppShell>
  );
}
