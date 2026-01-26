# Fix YTD and Monthly Mileage Display Issue

## Problem Analysis

**Root Cause**: The mileage calculation logic requires at least 2 odometer readings to calculate the difference. With only 1 reading submitted per vehicle:
- `calculateYTDMileage()`: `lastReading - firstReading = sameReading - sameReading = 0`
- `calculateMonthlyMileage()`: `current - previous = current - null = 0`

**Why it happens**:
- Line 19 in `/src/lib/calculations.ts`: `const mileage = previous ? current.reading - previous.reading : 0;`
- Line 60 in `/src/lib/calculations.ts`: `return lastReading.reading - firstReading.reading;`

With only one reading, there's no previous reading to compare against, so all mileage calculations return 0.

## Solution Design

Add an optional **baseline odometer** field to the Car model that represents the odometer reading at the start of the tracking period (typically January 1st of the current year). This allows mileage calculations even with a single reading.

### Approach

1. **Extend Car model** with optional baseline tracking fields
2. **Update calculation logic** to use baseline when only 1 reading exists
3. **Update UI forms** to capture baseline odometer
4. **Add data migration** to ensure existing data structure remains compatible
5. **Improve UX** with helpful messages when calculations aren't possible

## Implementation Plan

### Phase 1: Data Model Updates

**File**: `/src/types/index.ts`
- Add `initialOdometer?: number` field to `Car` interface
- Add `trackingStartDate?: string` field to `Car` interface (YYYY-MM-DD format)
- These fields represent the odometer reading and date when tracking began

**File**: `/src/lib/schemas.ts`
- Extend `carSchema` with optional validation:
  ```typescript
  initialOdometer: z.number().positive().int().optional(),
  trackingStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  ```

### Phase 2: Calculation Logic Updates

**File**: `/src/lib/calculations.ts`

**Function**: `calculateYTDMileage()` (lines 33-61)
- Add parameter: `car: Car` to access `initialOdometer`
- **New logic**:
  1. If car has 0 readings, return 0
  2. If car has 1 reading:
     - If `car.initialOdometer` exists AND `car.trackingStartDate` is in current year:
       - Return: `yearReadings[0].reading - car.initialOdometer`
     - Else return 0
  3. If car has 2+ readings, use existing logic

**Function**: `calculateMonthlyMileage()` (lines 4-31)
- Add parameter: `car: Car` to access `initialOdometer`
- **New logic** for first reading (i = 0):
  ```typescript
  if (i === 0) {
    // Check if initialOdometer can be used as baseline
    if (car.initialOdometer && car.trackingStartDate) {
      const trackingStart = dayjs(car.trackingStartDate);
      const currentReadingDate = dayjs(current.date);

      // If tracking started in the same month as this reading, calculate from baseline
      if (trackingStart.isSame(currentReadingDate, 'month')) {
        mileage = current.reading - car.initialOdometer;
      }
    }
  }
  ```

**Function**: `getCurrentMonthMileage()` (lines 94-102)
- Pass `car` parameter to `calculateMonthlyMileage()`

### Phase 3: Hook Updates

**File**: `/src/hooks/useStats.ts`

Update all calculation calls to pass the `car` object:
- Line 17: `calculateYTDMileage(readings, car.id, undefined, car)`
- Line 18: `calculateMonthlyMileage(readings, car.id, car)`
- Line 46: `getCurrentMonthMileage(readings, car.id, car)`
- Line 52: Update `calculateYearStats` signature
- Line 56: `calculateMonthlyMileage(readings, carId, car)`

### Phase 4: UI Form Updates

**File**: `/src/components/cars/CarForm.tsx`

Add new optional fields after the Year input (around line 77):
```typescript
<NumberInput
  label="Starting Odometer (Optional)"
  placeholder="e.g., 45000"
  description="Odometer reading when you started tracking"
  min={0}
  {...form.getInputProps('initialOdometer')}
/>

<DateInput
  label="Tracking Start Date (Optional)"
  placeholder="e.g., Jan 1, 2026"
  description="When you started tracking this vehicle"
  maxDate={new Date()}
  valueFormat="YYYY-MM-DD"
  {...form.getInputProps('trackingStartDate')}
/>
```

**File**: `/src/app/cars/[id]/page.tsx`
- Update form initialValues to include new fields (lines 92-98)

**File**: `/src/app/cars/new/page.tsx`
- Check if this file exists and update similarly

### Phase 5: Data Migration

**File**: `/src/hooks/useAppState.ts`

Add migration logic in the initialization:
- Current version is checked against stored version
- Add version bump from current to next version
- Migration ensures all `Car` objects have the new fields (set to `undefined` if not present)
- This ensures backward compatibility with existing localStorage data

### Phase 6: UX Improvements

**File**: `/src/components/dashboard/StatsOverview.tsx`

Update display logic to show helpful messages:
- When YTD or monthly mileage is 0 and there's only 1 reading:
  - Show "—" or "N/A" instead of "0"
  - Add tooltip: "Add more readings or set a starting odometer to see mileage"

**File**: `/src/app/cars/[id]/page.tsx`

Add helpful badge when baseline is missing:
```typescript
{car.totalReadings === 1 && !car.initialOdometer && (
  <Badge color="yellow" variant="light">
    Add starting odometer to see YTD mileage
  </Badge>
)}
```

## Files to Modify

### Core Logic (6 files)
1. `/src/types/index.ts` - Add Car fields
2. `/src/lib/schemas.ts` - Update validation schema
3. `/src/lib/calculations.ts` - Update calculation functions
4. `/src/hooks/useStats.ts` - Pass car object to calculations
5. `/src/hooks/useAppState.ts` - Add data migration
6. `/src/lib/constants.ts` - Version bump if needed

### UI Components (4 files)
7. `/src/components/cars/CarForm.tsx` - Add baseline fields
8. `/src/app/cars/[id]/page.tsx` - Update form initialization
9. `/src/app/cars/new/page.tsx` - Check and update if exists
10. `/src/components/dashboard/StatsOverview.tsx` - Improve display for edge cases

## Testing & Verification

### Manual Testing Checklist

1. **New Car Flow**:
   - Add a new car WITHOUT initial odometer
   - Add 1 reading → Verify YTD = 0, Monthly = 0
   - Add 2nd reading → Verify mileage calculations work

2. **Baseline Flow**:
   - Add a new car WITH initial odometer (e.g., 50,000) and tracking start (Jan 1, 2026)
   - Add 1 reading for current date (e.g., 51,200)
   - Verify YTD = 1,200 miles
   - Verify monthly mileage shows correctly

3. **Existing Data**:
   - Ensure existing cars without baseline fields still display correctly
   - Verify no data loss after changes

4. **Edge Cases**:
   - Car with initialOdometer but trackingStartDate in previous year
   - Car with trackingStartDate but no initialOdometer
   - Multiple readings spanning multiple months

### Data Validation

- Ensure `initialOdometer` cannot be greater than any submitted readings
- Validate `trackingStartDate` is not in the future
- Ensure calculations handle null/undefined gracefully

## Alternative Considerations

### Simpler Alternative (Not Recommended)
Show a message: "Add at least 2 readings to see mileage calculations"
- **Pros**: No code changes needed
- **Cons**: Poor UX, doesn't solve the user's problem

### Why Baseline Approach is Better
- Users can see meaningful data immediately
- Reflects real-world tracking scenarios (people start tracking mid-year)
- Backward compatible with existing data
- Optional field - doesn't complicate the flow for users who add multiple readings

## Expected Outcome

After implementation:
- Users with 1 reading + baseline odometer will see accurate YTD and monthly mileage
- Users with 2+ readings continue to work as before
- Existing data remains compatible
- Clear UI indicators when more data is needed
- Better onboarding experience for new users
