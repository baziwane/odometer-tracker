import type { Car, OdometerReading, AppSettings } from '@/types';

/**
 * Database row types (snake_case)
 */
interface CarRow {
  id: string;
  user_id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  is_active: boolean;
  initial_odometer: number | null;
  tracking_start_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ReadingRow {
  id: string;
  user_id: string;
  car_id: string;
  date: string;
  reading: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SettingsRow {
  user_id: string;
  default_car_id: string | null;
  theme: 'light' | 'dark' | 'auto';
  distance_unit: 'miles' | 'kilometers';
  created_at: string;
  updated_at: string;
}

/**
 * Transforms database car row to app Car type
 */
export function transformCar(row: CarRow): Car {
  return {
    id: row.id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    isActive: row.is_active,
    initialOdometer: row.initial_odometer ?? undefined,
    trackingStartDate: row.tracking_start_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms database reading row to app OdometerReading type
 */
export function transformReading(row: ReadingRow): OdometerReading {
  return {
    id: row.id,
    carId: row.car_id,
    date: row.date,
    reading: row.reading,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms database settings row to app AppSettings type
 */
export function transformSettings(row: SettingsRow): AppSettings {
  return {
    defaultCarId: row.default_car_id,
    theme: row.theme,
    distanceUnit: row.distance_unit,
  };
}
