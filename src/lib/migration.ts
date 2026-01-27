import type { Car, OdometerReading, AppSettings } from '@/types';

/**
 * Data structure for migration export/import
 */
export interface MigrationData {
  version: number;
  exportedAt: string;
  cars: Car[];
  readings: OdometerReading[];
  settings: AppSettings;
}

/**
 * Exports localStorage data to JSON format
 * Can be called from browser console or migration UI
 */
export function exportLocalStorageData(): MigrationData | null {
  try {
    const localStorageKey = 'odometer-tracker-data';
    const rawData = localStorage.getItem(localStorageKey);

    if (!rawData) {
      console.warn('No localStorage data found');
      return null;
    }

    const parsedData = JSON.parse(rawData);

    const migrationData: MigrationData = {
      version: parsedData.version || 1,
      exportedAt: new Date().toISOString(),
      cars: parsedData.cars || [],
      readings: parsedData.readings || [],
      settings: parsedData.settings || {
        defaultCarId: null,
        theme: 'auto',
        distanceUnit: 'miles',
      },
    };

    return migrationData;
  } catch (error) {
    console.error('Failed to export localStorage data:', error);
    return null;
  }
}

/**
 * Downloads migration data as JSON file
 */
export function downloadMigrationData(): void {
  const data = exportLocalStorageData();

  if (!data) {
    alert('No data to export');
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `odometer-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates migration data structure
 */
export function validateMigrationData(data: unknown): data is MigrationData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const migrationData = data as Partial<MigrationData>;

  // Check required fields
  if (!migrationData.cars || !Array.isArray(migrationData.cars)) {
    return false;
  }

  if (!migrationData.readings || !Array.isArray(migrationData.readings)) {
    return false;
  }

  if (!migrationData.settings || typeof migrationData.settings !== 'object') {
    return false;
  }

  return true;
}

/**
 * Imports migration data into the API
 * Returns import statistics
 */
export interface ImportStats {
  carsImported: number;
  carsSkipped: number;
  readingsImported: number;
  readingsSkipped: number;
  errors: string[];
}

export async function importMigrationData(
  data: MigrationData,
  onProgress?: (message: string) => void
): Promise<ImportStats> {
  const stats: ImportStats = {
    carsImported: 0,
    carsSkipped: 0,
    readingsImported: 0,
    readingsSkipped: 0,
    errors: [],
  };

  // Map old car IDs to new car IDs
  const carIdMap = new Map<string, string>();

  // Import cars
  onProgress?.('Importing cars...');
  for (const car of data.cars) {
    try {
      // Only import active cars
      if (!car.isActive) {
        stats.carsSkipped++;
        continue;
      }

      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: car.name,
          make: car.make,
          model: car.model,
          year: car.year,
          color: car.color,
          initialOdometer: car.initialOdometer,
          trackingStartDate: car.trackingStartDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import car');
      }

      const result = await response.json();
      carIdMap.set(car.id, result.data.id);
      stats.carsImported++;
    } catch (error) {
      stats.carsSkipped++;
      stats.errors.push(
        `Failed to import car "${car.name}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Import readings
  onProgress?.('Importing readings...');
  for (const reading of data.readings) {
    try {
      // Map old car ID to new car ID
      const newCarId = carIdMap.get(reading.carId);
      if (!newCarId) {
        stats.readingsSkipped++;
        continue;
      }

      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: newCarId,
          date: reading.date,
          reading: reading.reading,
          notes: reading.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import reading');
      }

      stats.readingsImported++;
    } catch (error) {
      stats.readingsSkipped++;
      stats.errors.push(
        `Failed to import reading for date ${reading.date}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Import settings
  onProgress?.('Importing settings...');
  try {
    // Map default car ID if it exists
    let defaultCarId = data.settings.defaultCarId;
    if (defaultCarId && carIdMap.has(defaultCarId)) {
      defaultCarId = carIdMap.get(defaultCarId)!;
    } else {
      defaultCarId = null;
    }

    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: data.settings.theme,
        distanceUnit: data.settings.distanceUnit,
        defaultCarId,
      }),
    });
  } catch (error) {
    stats.errors.push(
      `Failed to import settings: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  onProgress?.('Import complete!');
  return stats;
}
