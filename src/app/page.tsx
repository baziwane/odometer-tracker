'use client';

import { Stack, Title, Text } from '@mantine/core';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { MileageChart } from '@/components/dashboard/MileageChart';
import { CarCard } from '@/components/cars/CarCard';
import { CarSelector } from '@/components/cars/CarSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppState } from '@/hooks/useAppState';
import { useStats } from '@/hooks/useStats';
import { useRouter } from 'next/navigation';
import { IconCar } from '@tabler/icons-react';

export default function Dashboard() {
  const router = useRouter();
  const { cars, readings, isLoading } = useAppState();
  const {
    carsWithStats,
    totalYTDMileage,
    totalMonthlyAverage,
    currentMonthTotal,
    getCarMonthlyData,
  } = useStats(cars, readings);

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (cars.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={<IconCar size={32} />}
          title="No vehicles yet"
          description="Add your first vehicle to start tracking your odometer readings"
          actionLabel="Add Vehicle"
          onAction={() => router.push('/cars/new')}
        />
      </AppShell>
    );
  }

  const selectedCar = selectedCarId
    ? carsWithStats.find((c) => c.id === selectedCarId)
    : null;

  const chartData = selectedCarId
    ? getCarMonthlyData(selectedCarId)
    : cars.flatMap((car) => getCarMonthlyData(car.id));

  const displayStats = selectedCar
    ? {
        ytdMileage: selectedCar.ytdMileage,
        monthlyAverage: selectedCar.monthlyAverage,
        currentMonth: getCarMonthlyData(selectedCar.id).slice(-1)[0]?.mileage ?? 0,
        totalCars: 1,
      }
    : {
        ytdMileage: totalYTDMileage,
        monthlyAverage: totalMonthlyAverage,
        currentMonth: currentMonthTotal,
        totalCars: cars.length,
      };

  return (
    <AppShell>
      <Stack gap="lg">
        <StatsOverview {...displayStats} />

        {cars.length > 1 && (
          <CarSelector
            cars={cars}
            selectedCarId={selectedCarId}
            onChange={setSelectedCarId}
            showAll
          />
        )}

        <MileageChart
          data={chartData}
          carColor={selectedCar?.color ? `${selectedCar.color}.6` : 'blue.6'}
        />

        <Stack gap="sm">
          <Title order={4}>Your Vehicles</Title>
          {carsWithStats.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </Stack>
      </Stack>
    </AppShell>
  );
}
