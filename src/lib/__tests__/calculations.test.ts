import { validateReadingInSequence, getReadingBeforeDate, getReadingAfterDate } from '../calculations';
import type { OdometerReading } from '@/types';

describe('Calculations', () => {
  const mockReadings: OdometerReading[] = [
    {
      id: '1',
      carId: 'car-1',
      date: '2024-01-01',
      reading: 10000,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      carId: 'car-1',
      date: '2024-02-01',
      reading: 11000,
      createdAt: '2024-02-01T00:00:00Z',
    },
    {
      id: '3',
      carId: 'car-1',
      date: '2024-03-01',
      reading: 12000,
      createdAt: '2024-03-01T00:00:00Z',
    },
  ];

  describe('getReadingBeforeDate', () => {
    it('should return the reading immediately before target date', () => {
      const result = getReadingBeforeDate(mockReadings, 'car-1', '2024-02-15');

      expect(result).toEqual(mockReadings[1]);
    });

    it('should return null when no reading before target date', () => {
      const result = getReadingBeforeDate(mockReadings, 'car-1', '2023-12-01');

      expect(result).toBeNull();
    });

    it('should filter by carId', () => {
      const result = getReadingBeforeDate(mockReadings, 'car-2', '2024-02-15');

      expect(result).toBeNull();
    });
  });

  describe('getReadingAfterDate', () => {
    it('should return the reading immediately after target date', () => {
      const result = getReadingAfterDate(mockReadings, 'car-1', '2024-01-15');

      expect(result).toEqual(mockReadings[1]);
    });

    it('should return null when no reading after target date', () => {
      const result = getReadingAfterDate(mockReadings, 'car-1', '2024-04-01');

      expect(result).toBeNull();
    });
  });

  describe('validateReadingInSequence', () => {
    it('should validate correct reading in sequence', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-1',
        '2024-02-15',
        11500
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject reading less than previous', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-1',
        '2024-02-15',
        10500
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be at least');
    });

    it('should reject reading greater than next', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-1',
        '2024-01-15',
        11500
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should allow first reading for car', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-2',
        '2024-01-01',
        5000
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow exact same value as previous', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-1',
        '2024-02-15',
        11000
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow exact same value as next', () => {
      const result = validateReadingInSequence(
        mockReadings,
        'car-1',
        '2024-01-15',
        11000
      );

      expect(result.isValid).toBe(true);
    });
  });
});
