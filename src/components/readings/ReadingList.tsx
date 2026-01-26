'use client';

import { Stack, Select, Group } from '@mantine/core';
import { useState } from 'react';
import { ReadingCard } from './ReadingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateMonthlyMileage } from '@/lib/calculations';
import type { OdometerReading, Car } from '@/types';
import { IconHistory } from '@tabler/icons-react';

interface ReadingListProps {
  readings: OdometerReading[];
  cars: Car[];
  onDelete?: (id: string) => void;
}

export function ReadingList({ readings, cars, onDelete }: ReadingListProps) {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const years = Array.from(
    new Set(readings.map((r) => new Date(r.date).getFullYear()))
  ).sort((a, b) => b - a);

  const filteredReadings = readings
    .filter((r) => {
      if (selectedCarId && r.carId !== selectedCarId) return false;
      if (selectedYear && new Date(r.date).getFullYear() !== parseInt(selectedYear))
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMileageForReading = (reading: OdometerReading) => {
    const monthlyData = calculateMonthlyMileage(readings, reading.carId);
    const monthData = monthlyData.find(
      (m) => m.reading === reading.reading
    );
    return monthData?.mileage;
  };

  if (readings.length === 0) {
    return (
      <EmptyState
        icon={<IconHistory size={32} />}
        title="No readings yet"
        description="Add your first odometer reading to start tracking your mileage"
      />
    );
  }

  return (
    <Stack gap="md">
      <Group grow>
        {cars.length > 1 && (
          <Select
            placeholder="All vehicles"
            data={cars.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCarId}
            onChange={setSelectedCarId}
            clearable
          />
        )}
        {years.length > 1 && (
          <Select
            placeholder="All years"
            data={years.map((y) => ({ value: String(y), label: String(y) }))}
            value={selectedYear}
            onChange={setSelectedYear}
            clearable
          />
        )}
      </Group>

      <Stack gap="sm">
        {filteredReadings.map((reading) => {
          const car = cars.find((c) => c.id === reading.carId);
          return (
            <ReadingCard
              key={reading.id}
              reading={reading}
              car={car}
              mileage={getMileageForReading(reading)}
              onDelete={onDelete}
            />
          );
        })}
      </Stack>

      {filteredReadings.length === 0 && (
        <EmptyState
          icon={<IconHistory size={32} />}
          title="No readings found"
          description="Try adjusting your filters"
        />
      )}
    </Stack>
  );
}
