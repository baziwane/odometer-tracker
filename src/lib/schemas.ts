import { z } from 'zod';

export const carSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    make: z.string().min(1, 'Make is required').max(50, 'Make too long'),
    model: z.string().min(1, 'Model is required').max(50, 'Model too long'),
    year: z
      .number()
      .int('Year must be a whole number')
      .min(1900, 'Year must be 1900 or later')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
    color: z.string().min(1, 'Color is required'),
    initialOdometer: z
      .number()
      .min(0, 'Starting odometer cannot be negative')
      .max(9999999, 'Starting odometer value too large')
      .int('Starting odometer must be a whole number')
      .optional(),
    trackingStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
      .optional(),
  })
  .refine(
    (data) => {
      const hasInitial = data.initialOdometer !== undefined;
      const hasDate = data.trackingStartDate !== undefined;
      return hasInitial === hasDate;
    },
    {
      message: 'Starting odometer and tracking start date must both be provided together',
      path: ['initialOdometer'],
    }
  );

export const readingSchema = z.object({
  carId: z.string().min(1, 'Please select a car'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reading: z
    .number()
    .positive('Reading must be positive')
    .int('Reading must be a whole number'),
  notes: z.string().max(200, 'Notes too long').optional(),
});

export type CarFormData = z.infer<typeof carSchema>;
export type ReadingFormData = z.infer<typeof readingSchema>;
