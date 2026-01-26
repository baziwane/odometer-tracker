import dayjs from 'dayjs';
import type { OdometerReading, MonthlyMileage, YearStats, Car } from '@/types';

export function calculateMonthlyMileage(
  readings: OdometerReading[],
  carId: string,
  car?: Car
): MonthlyMileage[] {
  const carReadings = readings
    .filter((r) => r.carId === carId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (carReadings.length === 0) return [];

  const monthlyData: MonthlyMileage[] = [];

  for (let i = 0; i < carReadings.length; i++) {
    const current = carReadings[i];
    const previous = i > 0 ? carReadings[i - 1] : null;
    let mileage = previous ? current.reading - previous.reading : 0;

    // For the first reading, check if we can use initialOdometer as baseline
    if (i === 0 && !previous && car?.initialOdometer !== undefined && car?.trackingStartDate) {
      const trackingStart = dayjs(car.trackingStartDate);
      const currentReadingDate = dayjs(current.date);

      // If tracking started in the same month as this reading, calculate from baseline
      if (trackingStart.isSame(currentReadingDate, 'month')) {
        const calculatedMileage = current.reading - car.initialOdometer;
        mileage = Math.max(0, calculatedMileage);
      }
    }

    monthlyData.push({
      month: dayjs(current.date).format('YYYY-MM'),
      monthLabel: dayjs(current.date).format('MMM YYYY'),
      mileage,
      reading: current.reading,
      previousReading: previous?.reading ?? null,
    });
  }

  return monthlyData;
}

/**
 * Fill gaps in monthly mileage data with zeros for missing months.
 * Creates a continuous month range from (monthsToShow-1) months ago to current month.
 */
export function fillMonthlyMileageGaps(
  monthlyData: MonthlyMileage[],
  monthsToShow: 6 | 12
): MonthlyMileage[] {
  // Create a map for O(1) lookup of existing data
  const dataMap = new Map<string, MonthlyMileage>();
  monthlyData.forEach((item) => dataMap.set(item.month, item));

  // Generate continuous month range ending at current month
  const endMonth = dayjs();
  const startMonth = endMonth.subtract(monthsToShow - 1, 'month');

  const filledData: MonthlyMileage[] = [];
  let currentMonth = startMonth;

  for (let i = 0; i < monthsToShow; i++) {
    const monthKey = currentMonth.format('YYYY-MM');
    const existing = dataMap.get(monthKey);

    if (existing) {
      filledData.push(existing);
    } else {
      filledData.push({
        month: monthKey,
        monthLabel: currentMonth.format('MMM YYYY'),
        mileage: 0,
        reading: 0,
        previousReading: null,
      });
    }

    currentMonth = currentMonth.add(1, 'month');
  }

  return filledData;
}

export function calculateYTDMileage(
  readings: OdometerReading[],
  carId: string,
  year: number = new Date().getFullYear(),
  car?: Car
): number {
  const carReadings = readings
    .filter((r) => r.carId === carId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (carReadings.length === 0) return 0;

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const yearReadings = carReadings.filter(
    (r) => r.date >= yearStart && r.date <= yearEnd
  );

  if (yearReadings.length === 0) return 0;

  const lastReadingBeforeYear = carReadings
    .filter((r) => r.date < yearStart)
    .pop();

  // If there's only 1 reading in the year and no reading before the year
  if (yearReadings.length === 1 && !lastReadingBeforeYear) {
    // Check if we can use initialOdometer as baseline
    if (car?.initialOdometer !== undefined && car?.trackingStartDate) {
      const trackingStart = dayjs(car.trackingStartDate);
      const trackingYear = trackingStart.year();

      // Only use baseline if tracking started in the current year
      if (trackingYear === year) {
        const calculatedMileage = yearReadings[0].reading - car.initialOdometer;
        return Math.max(0, calculatedMileage);
      }
    }
    // Otherwise, no mileage to calculate
    return 0;
  }

  const firstReading = lastReadingBeforeYear ?? yearReadings[0];
  const lastReading = yearReadings[yearReadings.length - 1];

  return lastReading.reading - firstReading.reading;
}

export function calculateYearStats(
  readings: OdometerReading[],
  carId: string,
  year: number = new Date().getFullYear(),
  car?: Car
): YearStats {
  const monthlyData = calculateMonthlyMileage(readings, carId, car);
  const yearData = monthlyData.filter((m) => m.month.startsWith(String(year)));

  const totalMileage = yearData.reduce((sum, m) => sum + m.mileage, 0);
  const monthsTracked = yearData.filter((m) => m.mileage > 0).length;

  return {
    year,
    totalMileage,
    monthsTracked,
    averageMonthlyMileage: monthsTracked > 0 ? Math.round(totalMileage / monthsTracked) : 0,
    byMonth: yearData,
  };
}

export function getLatestReading(
  readings: OdometerReading[],
  carId: string
): OdometerReading | null {
  const carReadings = readings
    .filter((r) => r.carId === carId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return carReadings[0] ?? null;
}

export function getCurrentMonthMileage(
  readings: OdometerReading[],
  carId: string,
  car?: Car
): number {
  const currentMonth = dayjs().format('YYYY-MM');
  const monthlyData = calculateMonthlyMileage(readings, carId, car);
  const currentMonthData = monthlyData.find((m) => m.month === currentMonth);
  return currentMonthData?.mileage ?? 0;
}

export function getEndOfMonth(date: Date = new Date()): string {
  return dayjs(date).endOf('month').format('YYYY-MM-DD');
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get the reading immediately before a given date for a specific car
 */
export function getReadingBeforeDate(
  readings: OdometerReading[],
  carId: string,
  targetDate: string
): OdometerReading | null {
  const carReadings = readings
    .filter((r) => r.carId === carId && r.date < targetDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return carReadings[0] ?? null;
}

/**
 * Get the reading immediately after a given date for a specific car
 */
export function getReadingAfterDate(
  readings: OdometerReading[],
  carId: string,
  targetDate: string
): OdometerReading | null {
  const carReadings = readings
    .filter((r) => r.carId === carId && r.date > targetDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return carReadings[0] ?? null;
}

/**
 * Validate that a reading fits chronologically within existing readings
 */
export function validateReadingInSequence(
  readings: OdometerReading[],
  carId: string,
  targetDate: string,
  targetReading: number,
  excludeId?: string
): { isValid: boolean; error?: string; minValue?: number; maxValue?: number } {
  const filteredReadings = excludeId
    ? readings.filter(r => r.id !== excludeId)
    : readings;

  const previousReading = getReadingBeforeDate(filteredReadings, carId, targetDate);
  const nextReading = getReadingAfterDate(filteredReadings, carId, targetDate);

  // Check for duplicate date
  const existingReadingForDate = filteredReadings.find(
    r => r.carId === carId && r.date === targetDate
  );
  if (existingReadingForDate) {
    return {
      isValid: false,
      error: `A reading already exists for ${dayjs(targetDate).format('MMM YYYY')}`,
    };
  }

  // Validate against previous reading (must be >= previous)
  if (previousReading && targetReading < previousReading.reading) {
    return {
      isValid: false,
      error: `Reading must be at least ${formatNumber(previousReading.reading)} mi (${dayjs(previousReading.date).format('MMM YYYY')} reading)`,
      minValue: previousReading.reading,
    };
  }

  // Validate against next reading (must be <= next)
  if (nextReading && targetReading > nextReading.reading) {
    return {
      isValid: false,
      error: `Reading cannot exceed ${formatNumber(nextReading.reading)} mi (${dayjs(nextReading.date).format('MMM YYYY')} reading)`,
      maxValue: nextReading.reading,
    };
  }

  return { isValid: true, minValue: previousReading?.reading, maxValue: nextReading?.reading };
}
