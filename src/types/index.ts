export interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  initialOdometer?: number;
  trackingStartDate?: string;
}

export interface OdometerReading {
  id: string;
  carId: string;
  date: string;
  reading: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyMileage {
  month: string;
  monthLabel: string;
  mileage: number;
  reading: number;
  previousReading: number | null;
}

export interface CarWithStats extends Car {
  latestReading: OdometerReading | null;
  ytdMileage: number;
  monthlyAverage: number;
  totalReadings: number;
}

export interface YearStats {
  year: number;
  totalMileage: number;
  monthsTracked: number;
  averageMonthlyMileage: number;
  byMonth: MonthlyMileage[];
}

export interface AppSettings {
  defaultCarId: string | null;
  theme: 'light' | 'dark' | 'auto';
  distanceUnit: 'miles' | 'kilometers';
}

export interface AppState {
  cars: Car[];
  readings: OdometerReading[];
  settings: AppSettings;
  version: number;
}
