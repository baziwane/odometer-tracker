import type { OdometerReading } from '@/types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Fetches all readings, optionally filtered by car
 */
export async function getReadings(carId?: string): Promise<OdometerReading[]> {
  const url = carId
    ? `/api/readings?carId=${encodeURIComponent(carId)}`
    : '/api/readings';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<OdometerReading[]> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch readings');
  }

  return result.data || [];
}

/**
 * Fetches a single reading by ID
 */
export async function getReading(id: string): Promise<OdometerReading> {
  const response = await fetch(`/api/readings/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<OdometerReading> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch reading');
  }

  if (!result.data) {
    throw new Error('Reading not found');
  }

  return result.data;
}

/**
 * Creates a new odometer reading
 */
export async function createReading(
  data: Omit<OdometerReading, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OdometerReading> {
  const response = await fetch('/api/readings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<OdometerReading> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to create reading');
  }

  if (!result.data) {
    throw new Error('No data returned from server');
  }

  return result.data;
}

/**
 * Updates an existing reading
 */
export async function updateReading(
  id: string,
  data: Partial<Omit<OdometerReading, 'id' | 'createdAt' | 'updatedAt' | 'carId'>>
): Promise<OdometerReading> {
  const response = await fetch(`/api/readings/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<OdometerReading> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to update reading');
  }

  if (!result.data) {
    throw new Error('No data returned from server');
  }

  return result.data;
}

/**
 * Deletes a reading
 */
export async function deleteReading(id: string): Promise<void> {
  const response = await fetch(`/api/readings/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<{ success: boolean }> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to delete reading');
  }
}
