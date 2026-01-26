# Fix Odometer Reading Validation for Historical Entries

## Problem Statement

When trying to add an odometer reading for a past date, the app incorrectly rejects it if a future reading with higher mileage already exists.

**Example:** User has a reading of 78k for Jan 2026 but cannot add 69,116 for Jan 2025 because the validation uses the "latest by date" reading as the minimum constraint, preventing any value lower than 78k.

**Root Cause:** The app uses `getLatestReading()` which returns the most recent reading BY DATE, then sets this as the minimum allowed value. This conflates "most recent by date" with "previous reading in chronological sequence."

## Solution Approach

Implement chronologically-aware validation that:
1. Finds the reading immediately BEFORE the target date (not the most recent overall)
2. Finds the reading immediately AFTER the target date (if exists)
3. Validates that the new reading falls within this range
4. Provides clear UI feedback about valid ranges

**Architecture:** Multi-layer validation with real-time UI feedback and strong submission validation.

## Implementation Steps

### Step 1: Create Chronological Lookup Functions

**File:** `src/lib/calculations.ts`

Add three new functions:

```typescript
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
```

**Note:** Import `dayjs` and `formatNumber` at the top of the file if not already imported.

### Step 2: Update OdometerInput Component

**File:** `src/components/readings/OdometerInput.tsx`

1. Add new props to interface:
```typescript
interface OdometerInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  previousReading?: number;
  nextReading?: number;      // NEW
  previousDate?: string;     // NEW
  nextDate?: string;         // NEW
  error?: string;
}
```

2. Add max constraint to NumberInput:
```typescript
<NumberInput
  // ... existing props
  max={nextReading}  // ADD THIS LINE
  // ... rest of props
/>
```

3. Add contextual feedback (replace existing estimated mileage section):
```typescript
{/* Context about valid range */}
{previousReading && nextReading && (
  <Text size="sm" c="dimmed">
    Valid range: {formatNumber(previousReading)} - {formatNumber(nextReading)} mi
  </Text>
)}

{previousReading && !nextReading && (
  <Text size="sm" c="dimmed">
    Must be at least: {formatNumber(previousReading)} mi
    {previousDate && ` (${dayjs(previousDate).format('MMM YYYY')})`}
  </Text>
)}

{!previousReading && nextReading && (
  <Text size="sm" c="dimmed">
    Cannot exceed: {formatNumber(nextReading)} mi
    {nextDate && ` (${dayjs(nextDate).format('MMM YYYY')})`}
  </Text>
)}

{/* Estimated mileage - only show if valid */}
{estimatedMileage !== null && estimatedMileage > 0 && numericValue >= (previousReading ?? 0) && (
  <Text size="sm" c="teal" fw={500}>
    +{formatNumber(estimatedMileage)} miles this period
  </Text>
)}

{/* Error messages */}
{numericValue > 0 && previousReading && numericValue < previousReading && (
  <Text size="sm" c="red" fw={500}>
    Reading must be at least {formatNumber(previousReading)} mi
    {previousDate && ` (${dayjs(previousDate).format('MMM YYYY')})`}
  </Text>
)}

{numericValue > 0 && nextReading && numericValue > nextReading && (
  <Text size="sm" c="red" fw={500}>
    Reading cannot exceed {formatNumber(nextReading)} mi
    {nextDate && ` (${dayjs(nextDate).format('MMM YYYY')})`}
  </Text>
)}
```

**Note:** Import `dayjs` if not already imported.

### Step 3: Update ReadingForm Component

**File:** `src/components/readings/ReadingForm.tsx`

1. Import new functions:
```typescript
import { getReadingBeforeDate, getReadingAfterDate } from '@/lib/calculations';
```

2. Replace `previousReading` calculation (around line 40):
```typescript
// REPLACE THIS:
// const previousReading = selectedCar
//   ? getLatestReading(readings, selectedCar.id)
//   : null;

// WITH THIS:
const previousReading = selectedCar && form.values.date
  ? getReadingBeforeDate(readings, selectedCar.id, form.values.date)
  : null;

const nextReading = selectedCar && form.values.date
  ? getReadingAfterDate(readings, selectedCar.id, form.values.date)
  : null;
```

3. Update MonthPickerInput onChange to clear reading when date changes:
```typescript
<MonthPickerInput
  label="Month"
  placeholder="Select month"
  value={form.values.date ? new Date(form.values.date) : null}
  onChange={(date) => {
    if (date) {
      form.setFieldValue('date', getEndOfMonth(date));
      // Clear reading value to force re-validation
      form.setFieldValue('reading', '' as unknown as number);
    }
  }}
  maxDate={new Date()}
  required
/>
```

4. Update OdometerInput props:
```typescript
<OdometerInput
  value={form.values.reading}
  onChange={(value) => form.setFieldValue('reading', value as number)}
  previousReading={previousReading?.reading}
  nextReading={nextReading?.reading}      // ADD
  previousDate={previousReading?.date}    // ADD
  nextDate={nextReading?.date}            // ADD
  error={form.errors.reading as string}
/>
```

### Step 4: Add Data Layer Validation

**File:** `src/hooks/useAppState.ts`

1. Import validation function:
```typescript
import { validateReadingInSequence } from '@/lib/calculations';
```

2. Update `addReading` function (around line 89):
```typescript
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
```

### Step 5: Add Error Handling to UI

**File:** `src/app/add-reading/page.tsx`

1. Add state for submission errors:
```typescript
import { useState } from 'react';

export default function AddReadingPage() {
  const router = useRouter();
  const { cars, readings, settings, addReading, isLoading } = useAppState();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    carId: string;
    date: string;
    reading: number;
    notes?: string;
  }) => {
    try {
      setSubmitting(true);
      addReading(data);
      router.push('/');
    } catch (error) {
      setSubmitting(false);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to add reading. Please check your input and try again.';
      alert(errorMessage);
    }
  };

  // ... rest of component
}
```

2. Update the form component to use the new handler and submitting state:
```typescript
<ReadingForm
  cars={cars}
  readings={readings}
  defaultCarId={settings.defaultCarId}
  onSubmit={handleSubmit}
  onCancel={() => router.push('/')}
  isLoading={isLoading || submitting}
/>
```

## Critical Files to Modify

1. `src/lib/calculations.ts` - Add validation functions
2. `src/components/readings/OdometerInput.tsx` - Add max constraint and contextual feedback
3. `src/components/readings/ReadingForm.tsx` - Use chronological lookups
4. `src/hooks/useAppState.ts` - Add validation to `addReading`
5. `src/app/add-reading/page.tsx` - Add error handling

## Verification Plan

### Manual Testing
1. **Test adding a historical reading:**
   - Add a reading for Jan 2025 (69,116 mi)
   - Should succeed if lower than any existing Jan 2026+ readings
   - Should show valid range in UI

2. **Test adding a future reading:**
   - Add a reading for Feb 2026 with value > 78k
   - Should succeed and update constraints for past dates

3. **Test edge cases:**
   - Add first reading for a car (no constraints)
   - Try to add duplicate date (should fail)
   - Try to add reading lower than previous chronological reading (should fail)
   - Try to add reading higher than next chronological reading (should fail)

4. **Test date change behavior:**
   - Select a date
   - Change to different date
   - Verify that the valid range updates in real-time
   - Verify that reading input is cleared

### Automated Testing (Future Enhancement)
- Unit tests for `getReadingBeforeDate()`, `getReadingAfterDate()`, and `validateReadingInSequence()`
- Component tests for OdometerInput with various constraint scenarios
- E2E tests for add reading flow with chronological validation

## Non-Breaking Changes

- All new props on `OdometerInput` are optional
- Existing `getLatestReading()` function preserved for other use cases
- No data model changes required
- No migration needed for existing data

## Performance Considerations

- Validation functions are O(n log n) due to sorting
- For typical usage (< 1000 readings), negligible impact
- Validation only runs on date change and form submission, not on every keystroke
