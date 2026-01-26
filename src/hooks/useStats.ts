'use client';

import { useMemo } from 'react';
import type { Car, OdometerReading, CarWithStats } from '@/types';
import {
  calculateYTDMileage,
  calculateYearStats,
  getLatestReading,
  getCurrentMonthMileage,
  calculateMonthlyMileage,
} from '@/lib/calculations';

export function useStats(cars: Car[], readings: OdometerReading[]) {
  const carsWithStats = useMemo((): CarWithStats[] => {
    return cars.map((car) => {
      const latestReading = getLatestReading(readings, car.id);
      const ytdMileage = calculateYTDMileage(readings, car.id, undefined, car);
      const monthlyData = calculateMonthlyMileage(readings, car.id, car);
      const monthsWithData = monthlyData.filter((m) => m.mileage > 0).length;
      const totalMileage = monthlyData.reduce((sum, m) => sum + m.mileage, 0);

      return {
        ...car,
        latestReading,
        ytdMileage,
        monthlyAverage: monthsWithData > 0 ? Math.round(totalMileage / monthsWithData) : 0,
        totalReadings: monthlyData.length,
      };
    });
  }, [cars, readings]);

  const totalYTDMileage = useMemo(() => {
    return carsWithStats.reduce((sum, car) => sum + car.ytdMileage, 0);
  }, [carsWithStats]);

  const totalMonthlyAverage = useMemo(() => {
    const averages = carsWithStats.filter((car) => car.monthlyAverage > 0);
    if (averages.length === 0) return 0;
    return Math.round(
      averages.reduce((sum, car) => sum + car.monthlyAverage, 0)
    );
  }, [carsWithStats]);

  const currentMonthTotal = useMemo(() => {
    return cars.reduce(
      (sum, car) => sum + getCurrentMonthMileage(readings, car.id, car),
      0
    );
  }, [cars, readings]);

  const getCarStats = (carId: string, year?: number) => {
    const car = cars.find((c) => c.id === carId);
    return calculateYearStats(readings, carId, year, car);
  };

  const getCarMonthlyData = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    return calculateMonthlyMileage(readings, carId, car);
  };

  return {
    carsWithStats,
    totalYTDMileage,
    totalMonthlyAverage,
    currentMonthTotal,
    getCarStats,
    getCarMonthlyData,
  };
}
