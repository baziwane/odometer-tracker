# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

This is a **client-side only PWA** for tracking vehicle odometer readings. There is no backend - all data persists in localStorage.

### Tech Stack
- **Next.js 14** with App Router (all pages use `'use client'`)
- **Mantine 7** for UI components and theming
- **Zod** for form validation schemas
- **dayjs** for date manipulation
- **Recharts** for mileage charts

### State Management

All application state lives in localStorage via a custom hook chain:

```
useAppState (src/hooks/useAppState.ts)
    └── useLocalStorage (src/hooks/useLocalStorage.ts)
```

`useAppState` provides CRUD operations for cars, readings, and settings. State updates use **immutable patterns** - never mutate, always spread and return new objects.

**Data migration**: `useAppState` includes version-based migration logic. When adding new fields, bump `CURRENT_VERSION` in [src/lib/constants.ts](src/lib/constants.ts) and add migration in the `useEffect` block.

### Key Types

All types are centralized in [src/types/index.ts](src/types/index.ts):
- `Car` - Vehicle with soft-delete via `isActive` flag
- `OdometerReading` - Monthly reading tied to a car
- `AppState` - Root state shape with version number

### Calculations

Mileage calculation logic in [src/lib/calculations.ts](src/lib/calculations.ts) supports:
- **Baseline tracking**: First reading can use `car.initialOdometer` + `car.trackingStartDate` as starting point
- YTD, monthly, and current month mileage aggregations
- Multi-car aggregations in `useStats` hook

### Chronological Validation System

Odometer readings use **chronological validation** (not "latest by date") to support historical entries:

**Key Functions** in [src/lib/calculations.ts](src/lib/calculations.ts):
- `getReadingBeforeDate()` - Returns the reading immediately BEFORE a target date
- `getReadingAfterDate()` - Returns the reading immediately AFTER a target date
- `validateReadingInSequence()` - Validates a reading fits within chronological constraints

**Validation Flow:**
1. **UI Layer** ([src/components/readings/ReadingForm.tsx](src/components/readings/ReadingForm.tsx))
   - Uses `getReadingBeforeDate()` and `getReadingAfterDate()` when date changes
   - Passes constraints to `OdometerInput` for real-time feedback
   - Clears reading value when date changes to force re-validation

2. **Component Layer** ([src/components/readings/OdometerInput.tsx](src/components/readings/OdometerInput.tsx))
   - Shows valid range with date context
   - Displays inline errors for out-of-range values
   - Uses `min` and `max` props on NumberInput

3. **Data Layer** ([src/hooks/useAppState.ts](src/hooks/useAppState.ts))
   - `addReading()` validates via `validateReadingInSequence()`
   - Throws descriptive errors on validation failure
   - Prevents invalid data from reaching localStorage

**Important:** When modifying reading logic:
- Never use `getLatestReading()` for validation (it's date-based, not chronological)
- Always consider readings before AND after a target date
- Historical entries must be supported (adding past readings with existing future data)

### Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
├── components/
│   ├── layout/            # AppShell, Header, BottomNav
│   ├── dashboard/         # StatsOverview, MileageChart
│   ├── cars/              # CarCard, CarForm, CarSelector
│   ├── readings/          # ReadingForm, ReadingList, OdometerInput
│   └── ui/                # EmptyState, LoadingState, ConfirmModal
├── hooks/                  # useAppState, useStats, useLocalStorage
├── lib/                    # constants, schemas, calculations
├── theme/                  # Mantine theme customization
└── types/                  # TypeScript interfaces
```

### UI Patterns

- All pages wrap content in `<AppShell>` for consistent Header + BottomNav layout
- Form validation uses Mantine's `useForm` with Zod schemas from [src/lib/schemas.ts](src/lib/schemas.ts)
- Mobile-first design with `@mantine/core` responsive utilities
- Path alias: `@/*` maps to `./src/*`
