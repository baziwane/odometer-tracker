import { getCars, getCar, createCar, updateCar, deleteCar } from '../cars';
import type { Car } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('Cars API Client', () => {
  const mockCar: Car = {
    id: '123',
    name: 'Test Car',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'blue',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCars', () => {
    it('should fetch all cars successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockCar] }),
      });

      const result = await getCars();

      expect(result).toEqual([mockCar]);
      expect(global.fetch).toHaveBeenCalledWith('/api/cars', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch cars' }),
      });

      await expect(getCars()).rejects.toThrow('Failed to fetch cars');
    });

    it('should return empty array when no data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: undefined }),
      });

      const result = await getCars();

      expect(result).toEqual([]);
    });
  });

  describe('getCar', () => {
    it('should fetch single car successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCar }),
      });

      const result = await getCar('123');

      expect(result).toEqual(mockCar);
      expect(global.fetch).toHaveBeenCalledWith('/api/cars/123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw error when car not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: undefined }),
      });

      await expect(getCar('123')).rejects.toThrow('Car not found');
    });
  });

  describe('createCar', () => {
    it('should create car successfully', async () => {
      const newCarData = {
        name: 'Test Car',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'blue',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCar }),
      });

      const result = await createCar(newCarData);

      expect(result).toEqual(mockCar);
      expect(global.fetch).toHaveBeenCalledWith('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCarData),
      });
    });

    it('should throw error on validation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid car data' }),
      });

      await expect(createCar({} as any)).rejects.toThrow('Invalid car data');
    });
  });

  describe('updateCar', () => {
    it('should update car successfully', async () => {
      const updates = { name: 'Updated Name' };
      const updatedCar = { ...mockCar, ...updates };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedCar }),
      });

      const result = await updateCar('123', updates);

      expect(result).toEqual(updatedCar);
      expect(global.fetch).toHaveBeenCalledWith('/api/cars/123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    });
  });

  describe('deleteCar', () => {
    it('should delete car successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCar }),
      });

      await deleteCar('123');

      expect(global.fetch).toHaveBeenCalledWith('/api/cars/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw error on failed delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete car' }),
      });

      await expect(deleteCar('123')).rejects.toThrow('Failed to delete car');
    });
  });
});
