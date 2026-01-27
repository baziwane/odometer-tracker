import type { Car } from '@/types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Fetches all active cars for the authenticated user
 */
export async function getCars(): Promise<Car[]> {
  const response = await fetch('/api/cars', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<Car[]> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch cars');
  }

  return result.data || [];
}

/**
 * Fetches a single car by ID
 */
export async function getCar(id: string): Promise<Car> {
  const response = await fetch(`/api/cars/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<Car> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch car');
  }

  if (!result.data) {
    throw new Error('Car not found');
  }

  return result.data;
}

/**
 * Creates a new car
 */
export async function createCar(data: Omit<Car, 'id' | 'createdAt' | 'isActive'>): Promise<Car> {
  const response = await fetch('/api/cars', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Car> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to create car');
  }

  if (!result.data) {
    throw new Error('No data returned from server');
  }

  return result.data;
}

/**
 * Updates an existing car
 */
export async function updateCar(id: string, data: Partial<Car>): Promise<Car> {
  const response = await fetch(`/api/cars/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Car> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to update car');
  }

  if (!result.data) {
    throw new Error('No data returned from server');
  }

  return result.data;
}

/**
 * Soft deletes a car (sets isActive to false)
 */
export async function deleteCar(id: string): Promise<void> {
  const response = await fetch(`/api/cars/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<Car> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to delete car');
  }
}
