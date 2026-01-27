'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCars, createCar as apiCreateCar, updateCar as apiUpdateCar, deleteCar as apiDeleteCar } from '@/lib/api/cars';
import { getReadings, createReading as apiCreateReading, updateReading as apiUpdateReading, deleteReading as apiDeleteReading } from '@/lib/api/readings';
import { getSettings, updateSettings as apiUpdateSettings } from '@/lib/api/settings';
import { useAuth } from '@/contexts/AuthContext';
import type { Car, OdometerReading, AppSettings } from '@/types';

export function useAppState() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [readings, setReadings] = useState<OdometerReading[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultCarId: null,
    theme: 'auto',
    distanceUnit: 'miles',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (!user) {
      // If no user, reset state and loading
      setCars([]);
      setReadings([]);
      setSettings({
        defaultCarId: null,
        theme: 'auto',
        distanceUnit: 'miles',
      });
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all data in parallel
        const [carsData, readingsData, settingsData] = await Promise.all([
          getCars(),
          getReadings(),
          getSettings(),
        ]);

        setCars(carsData);
        setReadings(readingsData);
        setSettings(settingsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const addCar = useCallback(
    async (carData: Omit<Car, 'id' | 'createdAt' | 'isActive'>) => {
      try {
        setError(null);
        const newCar = await apiCreateCar(carData);

        // Update local state immutably
        setCars((prev) => [...prev, newCar]);

        return newCar;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create car';
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateCar = useCallback(
    async (id: string, updates: Partial<Omit<Car, 'id' | 'createdAt'>>) => {
      try {
        setError(null);
        const updatedCar = await apiUpdateCar(id, updates);

        // Update local state immutably
        setCars((prev) =>
          prev.map((car) => (car.id === id ? updatedCar : car))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update car';
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteCar = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await apiDeleteCar(id);

        // Remove from local state immutably
        setCars((prev) => prev.filter((car) => car.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete car';
        setError(message);
        throw err;
      }
    },
    []
  );

  const addReading = useCallback(
    async (readingData: Omit<OdometerReading, 'id' | 'createdAt'>) => {
      try {
        setError(null);
        // Server-side validation via PostgreSQL trigger
        const newReading = await apiCreateReading(readingData);

        // Update local state immutably
        setReadings((prev) => [...prev, newReading]);

        return newReading;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create reading';
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateReading = useCallback(
    async (id: string, updates: Partial<Omit<OdometerReading, 'id' | 'createdAt' | 'carId'>>) => {
      try {
        setError(null);
        const updatedReading = await apiUpdateReading(id, updates);

        // Update local state immutably
        setReadings((prev) =>
          prev.map((reading) => (reading.id === id ? updatedReading : reading))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update reading';
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteReading = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await apiDeleteReading(id);

        // Update local state immutably
        setReadings((prev) => prev.filter((reading) => reading.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete reading';
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      try {
        setError(null);
        const updatedSettings = await apiUpdateSettings(updates);

        // Update local state immutably
        setSettings(updatedSettings);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    isLoading,
    error,
    cars,
    readings,
    settings,
    addCar,
    updateCar,
    deleteCar,
    addReading,
    updateReading,
    deleteReading,
    updateSettings,
  };
}
