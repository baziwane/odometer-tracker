'use client';

import { Stack, Button, Textarea, Select } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import dayjs from 'dayjs';
import { OdometerInput } from './OdometerInput';
import { readingSchema, type ReadingFormData } from '@/lib/schemas';
import { getReadingBeforeDate, getReadingAfterDate, getEndOfMonth } from '@/lib/calculations';
import type { Car, OdometerReading } from '@/types';

interface ReadingFormProps {
  cars: Car[];
  readings: OdometerReading[];
  defaultCarId?: string | null;
  onSubmit: (data: ReadingFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReadingForm({
  cars,
  readings,
  defaultCarId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReadingFormProps) {
  const form = useForm<ReadingFormData>({
    validate: zodResolver(readingSchema),
    initialValues: {
      carId: defaultCarId ?? cars[0]?.id ?? '',
      date: getEndOfMonth(),
      reading: '' as unknown as number,
      notes: '',
    },
  });

  const selectedCar = cars.find((c) => c.id === form.values.carId);
  const previousReading = selectedCar && form.values.date
    ? getReadingBeforeDate(readings, selectedCar.id, form.values.date)
    : null;

  const nextReading = selectedCar && form.values.date
    ? getReadingAfterDate(readings, selectedCar.id, form.values.date)
    : null;

  const handleSubmit = (values: ReadingFormData) => {
    const reading = typeof values.reading === 'string'
      ? parseInt(values.reading, 10)
      : values.reading;

    onSubmit({
      ...values,
      reading,
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg">
        {cars.length > 1 && (
          <Select
            label="Vehicle"
            data={cars.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.year} ${c.make} ${c.model})`,
            }))}
            required
            {...form.getInputProps('carId')}
          />
        )}

        <MonthPickerInput
          label="Month"
          placeholder="Select month"
          value={form.values.date ? new Date(form.values.date) : null}
          onChange={(date) => {
            if (date) {
              form.setFieldValue('date', getEndOfMonth(date));
              // Clear reading value to force re-validation
              form.setFieldValue('reading', '' as unknown as number);
            }
          }}
          maxDate={new Date()}
          required
        />

        <OdometerInput
          value={form.values.reading}
          onChange={(value) => form.setFieldValue('reading', value as number)}
          previousReading={previousReading?.reading}
          nextReading={nextReading?.reading}
          previousDate={previousReading?.date}
          nextDate={nextReading?.date}
          error={form.errors.reading as string}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="e.g., Road trip, oil change..."
          maxLength={200}
          {...form.getInputProps('notes')}
        />

        <Stack gap="sm" mt="md">
          <Button type="submit" size="lg" loading={isLoading} fullWidth>
            Save Reading
          </Button>
          {onCancel && (
            <Button
              variant="subtle"
              color="gray"
              onClick={onCancel}
              fullWidth
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </form>
  );
}
