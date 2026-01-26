'use client';

import { SegmentedControl, Select } from '@mantine/core';
import type { Car } from '@/types';

interface CarSelectorProps {
  cars: Car[];
  selectedCarId: string | null;
  onChange: (carId: string | null) => void;
  showAll?: boolean;
}

export function CarSelector({
  cars,
  selectedCarId,
  onChange,
  showAll = true,
}: CarSelectorProps) {
  if (cars.length <= 3) {
    const data = showAll
      ? [{ label: 'All', value: 'all' }, ...cars.map((c) => ({ label: c.name, value: c.id }))]
      : cars.map((c) => ({ label: c.name, value: c.id }));

    return (
      <SegmentedControl
        fullWidth
        value={selectedCarId ?? 'all'}
        onChange={(value) => onChange(value === 'all' ? null : value)}
        data={data}
      />
    );
  }

  const selectData = showAll
    ? [{ label: 'All Cars', value: 'all' }, ...cars.map((c) => ({ label: c.name, value: c.id }))]
    : cars.map((c) => ({ label: c.name, value: c.id }));

  return (
    <Select
      value={selectedCarId ?? 'all'}
      onChange={(value) => onChange(value === 'all' ? null : value)}
      data={selectData}
      allowDeselect={false}
    />
  );
}
