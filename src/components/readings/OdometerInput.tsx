'use client';

import { NumberInput, Text, Stack } from '@mantine/core';
import dayjs from 'dayjs';
import { formatNumber } from '@/lib/calculations';

interface OdometerInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  previousReading?: number;
  nextReading?: number;
  previousDate?: string;
  nextDate?: string;
  error?: string;
}

export function OdometerInput({
  value,
  onChange,
  previousReading,
  nextReading,
  previousDate,
  nextDate,
  error,
}: OdometerInputProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const estimatedMileage =
    numericValue && previousReading ? numericValue - previousReading : null;

  return (
    <Stack gap="xs">
      <NumberInput
        label="Odometer Reading"
        placeholder="Enter current reading"
        value={value}
        onChange={onChange}
        min={previousReading ?? 0}
        max={nextReading}
        size="lg"
        styles={{
          input: {
            fontSize: '1.5rem',
            fontWeight: 600,
            textAlign: 'center',
            height: 60,
          },
        }}
        thousandSeparator=","
        error={error}
        hideControls
      />

      {/* Context about valid range */}
      {previousReading && nextReading && (
        <Text size="sm" c="dimmed">
          Valid range: {formatNumber(previousReading)} - {formatNumber(nextReading)} mi
        </Text>
      )}

      {previousReading && !nextReading && (
        <Text size="sm" c="dimmed">
          Must be at least: {formatNumber(previousReading)} mi
          {previousDate && ` (${dayjs(previousDate).format('MMM YYYY')})`}
        </Text>
      )}

      {!previousReading && nextReading && (
        <Text size="sm" c="dimmed">
          Cannot exceed: {formatNumber(nextReading)} mi
          {nextDate && ` (${dayjs(nextDate).format('MMM YYYY')})`}
        </Text>
      )}

      {/* Estimated mileage - only show if valid */}
      {estimatedMileage !== null && estimatedMileage > 0 && numericValue >= (previousReading ?? 0) && (
        <Text size="sm" c="teal" fw={500}>
          +{formatNumber(estimatedMileage)} miles this period
        </Text>
      )}

      {/* Error messages */}
      {numericValue > 0 && previousReading && numericValue < previousReading && (
        <Text size="sm" c="red" fw={500}>
          Reading must be at least {formatNumber(previousReading)} mi
          {previousDate && ` (${dayjs(previousDate).format('MMM YYYY')})`}
        </Text>
      )}

      {numericValue > 0 && nextReading && numericValue > nextReading && (
        <Text size="sm" c="red" fw={500}>
          Reading cannot exceed {formatNumber(nextReading)} mi
          {nextDate && ` (${dayjs(nextDate).format('MMM YYYY')})`}
        </Text>
      )}
    </Stack>
  );
}
