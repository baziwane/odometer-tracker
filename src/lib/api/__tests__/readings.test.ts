import { getReadings, getReading, createReading, updateReading, deleteReading } from '../readings';
import type { OdometerReading } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('Readings API Client', () => {
  const mockReading: OdometerReading = {
    id: '456',
    carId: '123',
    date: '2024-01-15',
    reading: 50000,
    notes: 'Regular maintenance',
    createdAt: '2024-01-15T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReadings', () => {
    it('should fetch all readings successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockReading] }),
      });

      const result = await getReadings();

      expect(result).toEqual([mockReading]);
      expect(global.fetch).toHaveBeenCalledWith('/api/readings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should fetch readings filtered by carId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockReading] }),
      });

      const result = await getReadings('123');

      expect(result).toEqual([mockReading]);
      expect(global.fetch).toHaveBeenCalledWith('/api/readings?carId=123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return empty array when no data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: undefined }),
      });

      const result = await getReadings();

      expect(result).toEqual([]);
    });
  });

  describe('createReading', () => {
    it('should create reading successfully', async () => {
      const newReadingData = {
        carId: '123',
        date: '2024-01-15',
        reading: 50000,
        notes: 'Regular maintenance',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockReading }),
      });

      const result = await createReading(newReadingData);

      expect(result).toEqual(mockReading);
      expect(global.fetch).toHaveBeenCalledWith('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReadingData),
      });
    });

    it('should throw error on chronological validation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Reading must be >= previous reading' }),
      });

      await expect(createReading({} as any)).rejects.toThrow(
        'Reading must be >= previous reading'
      );
    });
  });

  describe('updateReading', () => {
    it('should update reading successfully', async () => {
      const updates = { reading: 51000, notes: 'Updated' };
      const updatedReading = { ...mockReading, ...updates };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedReading }),
      });

      const result = await updateReading('456', updates);

      expect(result).toEqual(updatedReading);
      expect(global.fetch).toHaveBeenCalledWith('/api/readings/456', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    });
  });

  describe('deleteReading', () => {
    it('should delete reading successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await deleteReading('456');

      expect(global.fetch).toHaveBeenCalledWith('/api/readings/456', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
});
