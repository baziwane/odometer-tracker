'use client';

import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEY, CURRENT_VERSION } from '@/lib/constants';
import { validateReadingInSequence } from '@/lib/calculations';
import type { AppState, Car, OdometerReading, AppSettings } from '@/types';

const initialState: AppState = {
  cars: [],
  readings: [],
  settings: {
    defaultCarId: null,
    theme: 'auto',
    distanceUnit: 'miles',
  },
  version: CURRENT_VERSION,
};

export function useAppState() {
  const { value: state, setValue: setState, isLoading } = useLocalStorage<AppState>(
    STORAGE_KEY,
    initialState
  );

  // Migration effect: Run migrations when version changes
  useEffect(() => {
    if (!isLoading && state.version < CURRENT_VERSION) {
      setState((prev) => {
        // Migrate from version 1 to 2: Add baseline fields to Car interface
        // The new optional fields (initialOdometer, trackingStartDate) default to undefined
        // so no data transformation is needed, just version bump
        if (prev.version === 1) {
          return {
            ...prev,
            version: 2,
          };
        }

        // Default: just update version
        return {
          ...prev,
          version: CURRENT_VERSION,
        };
      });
    }
  }, [isLoading, state.version, setState]);

  const addCar = useCallback(
    (carData: Omit<Car, 'id' | 'createdAt' | 'isActive'>) => {
      const newCar: Car = {
        ...carData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setState((prev) => ({
        ...prev,
        cars: [...prev.cars, newCar],
      }));
      return newCar;
    },
    [setState]
  );

  const updateCar = useCallback(
    (id: string, updates: Partial<Omit<Car, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        cars: prev.cars.map((car) =>
          car.id === id ? { ...car, ...updates } : car
        ),
      }));
    },
    [setState]
  );

  const deleteCar = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        cars: prev.cars.map((car) =>
          car.id === id ? { ...car, isActive: false } : car
        ),
      }));
    },
    [setState]
  );

  const addReading = useCallback(
    (readingData: Omit<OdometerReading, 'id' | 'createdAt'>) => {
      // Validate the reading fits in chronological sequence
      const validation = validateReadingInSequence(
        state.readings,
        readingData.carId,
        readingData.date,
        readingData.reading
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const newReading: OdometerReading = {
        ...readingData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        readings: [...prev.readings, newReading],
      }));
      return newReading;
    },
    [setState, state.readings]
  );

  const updateReading = useCallback(
    (id: string, updates: Partial<Omit<OdometerReading, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        readings: prev.readings.map((reading) =>
          reading.id === id ? { ...reading, ...updates } : reading
        ),
      }));
    },
    [setState]
  );

  const deleteReading = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        readings: prev.readings.filter((reading) => reading.id !== id),
      }));
    },
    [setState]
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...updates },
      }));
    },
    [setState]
  );

  const activeCars = state.cars.filter((car) => car.isActive);

  return {
    state,
    isLoading,
    cars: activeCars,
    readings: state.readings,
    settings: state.settings,
    addCar,
    updateCar,
    deleteCar,
    addReading,
    updateReading,
    deleteReading,
    updateSettings,
  };
}
