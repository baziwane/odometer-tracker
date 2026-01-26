# Plan: Switch Mileage Visualization from Bar Chart to Trendline

## Summary

Replace the bar chart with a line chart (trendline) that shows continuous months with missing data as zeros.

## Problem

Current bar chart skips months without readings entirely, creating confusion when user expects to see 6 months but only sees 3 bars.

## Solution

1. Add gap-filling function in calculations layer
2. Replace BarChart with LineChart component

---

## Files to Modify

### 1. [src/lib/calculations.ts](src/lib/calculations.ts)

**Add new function** `fillMonthlyMileageGaps()`:

```typescript
export function fillMonthlyMileageGaps(
  monthlyData: MonthlyMileage[],
  monthsToShow: 6 | 12
): MonthlyMileage[] {
  // Generate continuous month range from (monthsToShow-1) months ago to current month
  // For each month in range:
  //   - If data exists: use it
  //   - If missing: create entry with mileage: 0
  // Return filled array sorted chronologically
}
```

**Key logic:**
- Create a Map for O(1) lookup of existing data by month key (YYYY-MM)
- Loop from start month to current month using dayjs
- Fill gaps with `{ month, monthLabel, mileage: 0, reading: 0, previousReading: null }`

### 2. [src/components/dashboard/MileageChart.tsx](src/components/dashboard/MileageChart.tsx)

**Changes:**
1. Import `LineChart` instead of `BarChart`
2. Import `fillMonthlyMileageGaps` from calculations
3. Update data transformation to use gap-filling
4. Replace chart component

**Before:**
```typescript
import { BarChart } from '@mantine/charts';
const displayData = data.slice(-parseInt(view)).map(...);
<BarChart ... barProps={{ radius: [4, 4, 0, 0] }} />
```

**After:**
```typescript
import { LineChart } from '@mantine/charts';
import { fillMonthlyMileageGaps } from '@/lib/calculations';

const filledData = fillMonthlyMileageGaps(data, parseInt(view) as 6 | 12);
const displayData = filledData.map((item) => ({
  month: item.monthLabel.split(' ')[0],
  mileage: item.mileage,
}));

<LineChart
  h={200}
  data={displayData}
  dataKey="month"
  series={[{ name: 'mileage', color: carColor }]}
  curveType="linear"
  gridAxis="y"
  tickLine="none"
  dotProps={{ r: 4 }}
  activeDotProps={{ r: 6 }}
/>
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No readings | Show empty state message (unchanged) |
| First reading today | Show N months, all zero except current |
| Sparse readings (Jan, Apr) | Show Jan-current with Feb-Mar as zeros |
| Reading deleted | Gap reappears as zero |

---

## Verification

1. **Build check**: `npm run build` passes
2. **Lint check**: `npm run lint` passes
3. **Manual testing**:
   - Add car with first reading → see line chart with single point
   - Add reading for a later month → see line connecting both points
   - Switch between 6mo/12mo views → correct range shown
   - Missing months display as zero on the line
   - Hover on data points shows tooltip
