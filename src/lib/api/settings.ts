import type { AppSettings } from '@/types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Fetches user settings
 */
export async function getSettings(): Promise<AppSettings> {
  const response = await fetch('/api/settings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<AppSettings> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch settings');
  }

  if (!result.data) {
    throw new Error('No settings returned from server');
  }

  return result.data;
}

/**
 * Updates user settings
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const result: ApiResponse<AppSettings> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to update settings');
  }

  if (!result.data) {
    throw new Error('No data returned from server');
  }

  return result.data;
}
