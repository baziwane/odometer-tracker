'use client';

import {
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  ColorSwatch,
  Text,
  SimpleGrid,
  CheckIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import { carSchema, type CarFormData } from '@/lib/schemas';
import { CAR_COLORS } from '@/lib/constants';

interface CarFormProps {
  initialValues?: Partial<CarFormData>;
  onSubmit: (data: CarFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CarForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Add Car',
}: CarFormProps) {
  const form = useForm<CarFormData>({
    validate: zodResolver(carSchema),
    initialValues: {
      name: initialValues?.name ?? '',
      make: initialValues?.make ?? '',
      model: initialValues?.model ?? '',
      year: initialValues?.year ?? new Date().getFullYear(),
      color: initialValues?.color ?? 'blue',
      initialOdometer: initialValues?.initialOdometer,
      trackingStartDate: initialValues?.trackingStartDate,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Nickname"
          placeholder="e.g., Family SUV"
          required
          {...form.getInputProps('name')}
        />

        <Group grow>
          <TextInput
            label="Make"
            placeholder="e.g., Toyota"
            required
            {...form.getInputProps('make')}
          />
          <TextInput
            label="Model"
            placeholder="e.g., RAV4"
            required
            {...form.getInputProps('model')}
          />
        </Group>

        <NumberInput
          label="Year"
          placeholder="e.g., 2022"
          required
          min={1900}
          max={new Date().getFullYear() + 1}
          {...form.getInputProps('year')}
        />

        <NumberInput
          label="Starting Odometer (Optional)"
          placeholder="e.g., 45000"
          description="Odometer reading when you started tracking"
          min={0}
          {...form.getInputProps('initialOdometer')}
        />

        <DateInput
          label="Tracking Start Date (Optional)"
          placeholder="e.g., Jan 1, 2026"
          description="When you started tracking this vehicle"
          maxDate={new Date()}
          valueFormat="YYYY-MM-DD"
          value={form.values.trackingStartDate ? new Date(form.values.trackingStartDate) : null}
          onChange={(date) => {
            form.setFieldValue(
              'trackingStartDate',
              date ? date.toISOString().split('T')[0] : undefined
            );
          }}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Color
          </Text>
          <SimpleGrid cols={8} spacing="xs">
            {CAR_COLORS.map((color) => (
              <ColorSwatch
                key={color.value}
                color={color.hex}
                onClick={() => form.setFieldValue('color', color.value)}
                style={{ cursor: 'pointer' }}
                size={36}
              >
                {form.values.color === color.value && (
                  <CheckIcon width={14} color="white" />
                )}
              </ColorSwatch>
            ))}
          </SimpleGrid>
        </Stack>

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="subtle" color="gray" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
