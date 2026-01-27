import { exportLocalStorageData, validateMigrationData, importMigrationData, type MigrationData } from '../migration';
import type { Car, OdometerReading, AppSettings } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('Migration', () => {
  const mockCar: Car = {
    id: 'old-car-id',
    name: 'Test Car',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'blue',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockReading: OdometerReading = {
    id: 'old-reading-id',
    carId: 'old-car-id',
    date: '2024-01-15',
    reading: 50000,
    createdAt: '2024-01-15T00:00:00Z',
  };

  const mockSettings: AppSettings = {
    defaultCarId: 'old-car-id',
    theme: 'auto',
    distanceUnit: 'miles',
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('exportLocalStorageData', () => {
    it('should export localStorage data correctly', () => {
      const data = {
        version: 2,
        cars: [mockCar],
        readings: [mockReading],
        settings: mockSettings,
      };

      localStorageMock.setItem('odometer-tracker-data', JSON.stringify(data));

      const result = exportLocalStorageData();

      expect(result).not.toBeNull();
      expect(result?.cars).toEqual([mockCar]);
      expect(result?.readings).toEqual([mockReading]);
      expect(result?.settings).toEqual(mockSettings);
    });

    it('should return null when no localStorage data', () => {
      const result = exportLocalStorageData();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON', () => {
      localStorageMock.setItem('odometer-tracker-data', 'invalid json');

      const result = exportLocalStorageData();

      expect(result).toBeNull();
    });
  });

  describe('validateMigrationData', () => {
    const validData: MigrationData = {
      version: 2,
      exportedAt: '2024-01-01T00:00:00Z',
      cars: [mockCar],
      readings: [mockReading],
      settings: mockSettings,
    };

    it('should validate correct migration data', () => {
      expect(validateMigrationData(validData)).toBe(true);
    });

    it('should reject null data', () => {
      expect(validateMigrationData(null)).toBe(false);
    });

    it('should reject data without cars array', () => {
      const invalid = { ...validData, cars: undefined };
      expect(validateMigrationData(invalid)).toBe(false);
    });

    it('should reject data without readings array', () => {
      const invalid = { ...validData, readings: undefined };
      expect(validateMigrationData(invalid)).toBe(false);
    });

    it('should reject data without settings object', () => {
      const invalid = { ...validData, settings: undefined };
      expect(validateMigrationData(invalid)).toBe(false);
    });
  });

  describe('importMigrationData', () => {
    const migrationData: MigrationData = {
      version: 2,
      exportedAt: '2024-01-01T00:00:00Z',
      cars: [mockCar],
      readings: [mockReading],
      settings: mockSettings,
    };

    it('should import cars and readings successfully', async () => {
      // Mock car creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-car-id', ...mockCar } }),
      });

      // Mock reading creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-reading-id', ...mockReading } }),
      });

      // Mock settings update
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSettings }),
      });

      const stats = await importMigrationData(migrationData);

      expect(stats.carsImported).toBe(1);
      expect(stats.readingsImported).toBe(1);
      expect(stats.carsSkipped).toBe(0);
      expect(stats.readingsSkipped).toBe(0);
      expect(stats.errors).toHaveLength(0);
    });

    it('should skip inactive cars', async () => {
      const inactiveCar = { ...mockCar, isActive: false };
      const data = { ...migrationData, cars: [inactiveCar] };

      const stats = await importMigrationData(data);

      expect(stats.carsImported).toBe(0);
      expect(stats.carsSkipped).toBe(1);
    });

    it('should handle car import errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create car' }),
      });

      const stats = await importMigrationData(migrationData);

      expect(stats.carsImported).toBe(0);
      expect(stats.carsSkipped).toBe(1);
      expect(stats.errors.length).toBeGreaterThan(0);
    });

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await importMigrationData(migrationData, onProgress);

      expect(onProgress).toHaveBeenCalledWith('Importing cars...');
      expect(onProgress).toHaveBeenCalledWith('Importing readings...');
      expect(onProgress).toHaveBeenCalledWith('Importing settings...');
      expect(onProgress).toHaveBeenCalledWith('Import complete!');
    });
  });
});
