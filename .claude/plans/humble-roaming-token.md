# Odometer Tracker App - Implementation Plan

## Overview

A mobile-first app to track monthly odometer readings across multiple vehicles, with YTD mileage calculations and a visual dashboard.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | App Router, React Server Components |
| **Mantine v7** | UI library (native CSS, no Tailwind) |
| **TypeScript** | Type safety |
| **Local Storage** | Offline-capable data persistence |
| **Zod** | Input validation |
| **Recharts** | Charts via @mantine/charts |

## Data Models

```typescript
interface Car {
  id: string;
  name: string;          // "Family SUV"
  make: string;          // "Toyota"
  model: string;         // "RAV4"
  year: number;          // 2022
  color: string;         // Mantine color for visual distinction
  createdAt: string;
  isActive: boolean;
}

interface OdometerReading {
  id: string;
  carId: string;
  date: string;          // End of month date
  reading: number;       // Odometer value
  notes?: string;
  createdAt: string;
}

interface AppState {
  cars: Car[];
  readings: OdometerReading[];
  settings: { defaultCarId: string | null; theme: 'light' | 'dark' | 'auto'; };
}
```

## Project Structure

```
/src
├── app/
│   ├── layout.tsx              # Root layout + MantineProvider
│   ├── page.tsx                # Dashboard (home)
│   ├── add-reading/page.tsx    # Add new reading
│   ├── cars/
│   │   ├── page.tsx            # Car list
│   │   ├── new/page.tsx        # Add car
│   │   └── [id]/page.tsx       # Edit car
│   ├── history/page.tsx        # Reading history
│   └── settings/page.tsx       # App settings
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Main shell + bottom nav
│   │   ├── BottomNav.tsx       # Mobile navigation
│   │   └── Header.tsx
│   ├── cars/
│   │   ├── CarCard.tsx
│   │   ├── CarForm.tsx
│   │   └── CarSelector.tsx
│   ├── readings/
│   │   ├── OdometerInput.tsx   # Large touch-friendly input
│   │   ├── ReadingForm.tsx
│   │   └── ReadingList.tsx
│   ├── dashboard/
│   │   ├── StatsOverview.tsx   # YTD, monthly avg cards
│   │   ├── MileageChart.tsx    # Bar chart visualization
│   │   └── QuickAddButton.tsx  # FAB for quick entry
│   └── ui/
│       ├── EmptyState.tsx
│       └── ConfirmModal.tsx
├── hooks/
│   ├── useLocalStorage.ts      # Generic storage hook
│   ├── useAppState.ts          # Main state + CRUD
│   ├── useCars.ts
│   ├── useReadings.ts
│   └── useStats.ts             # YTD, monthly calculations
├── lib/
│   ├── calculations.ts         # Mileage math
│   ├── schemas.ts              # Zod validation
│   └── constants.ts            # Car colors, etc.
├── types/index.ts
└── theme/index.ts              # Mantine theme config
```

## Key Features

### Dashboard
- Stats cards: YTD mileage, monthly average, current month, total cars
- Car selector tabs (for multi-car view)
- Monthly mileage bar chart (6/12 month toggle)
- Floating "+" button for quick add

### Add Reading
- Pre-selected car (or selector if multiple)
- Month picker (defaults to current)
- Large odometer input with comma formatting
- Shows previous reading + calculated mileage
- Optional notes

### Car Management
- Card grid with color accents
- Each card: name, make/model/year, latest reading, YTD
- Add/edit car forms with color picker

### History
- Filter by car and year
- Chronological list with mileage deltas
- Delete with confirmation

## Mobile UX Priorities

1. **Touch-friendly**: All targets 44x44px minimum
2. **Bottom navigation**: Primary actions in thumb zone
3. **Large inputs**: 60px height odometer input
4. **Native keyboards**: Number input triggers numeric keyboard
5. **Dark mode**: Full theme support
6. **Offline-first**: Works without network

## Implementation Phases

### Phase 1: Project Setup
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Install Mantine v7 + dependencies
- [ ] Configure PostCSS for Mantine
- [ ] Set up folder structure
- [ ] Create theme configuration

### Phase 2: Data Layer
- [ ] Define TypeScript types
- [ ] Create Zod schemas
- [ ] Implement useLocalStorage hook
- [ ] Implement useAppState with CRUD
- [ ] Add useStats for calculations

### Phase 3: Layout & Navigation
- [ ] Build AppShell component
- [ ] Create BottomNav with icons
- [ ] Add Header component
- [ ] Set up page routing

### Phase 4: Car Management
- [ ] CarForm (add/edit)
- [ ] CarCard component
- [ ] CarSelector (dropdown/tabs)
- [ ] Cars list page
- [ ] Add/edit car pages

### Phase 5: Reading Management
- [ ] OdometerInput component
- [ ] ReadingForm with validation
- [ ] Add Reading page
- [ ] ReadingList with filters
- [ ] History page

### Phase 6: Dashboard
- [ ] StatsOverview cards
- [ ] MileageChart component
- [ ] QuickAddButton (FAB)
- [ ] Assemble dashboard page

### Phase 7: Polish
- [ ] Empty states
- [ ] Loading skeletons
- [ ] Confirmation modals
- [ ] Animations/transitions
- [ ] Settings page

## Verification Plan

1. **Manual Testing**
   - Add 2 cars with different colors
   - Add readings for multiple months
   - Verify YTD calculations are correct
   - Test on mobile viewport (Chrome DevTools)
   - Test dark mode toggle
   - Refresh page to verify localStorage persistence

2. **Unit Tests**
   - `useStats` hook calculations
   - Zod schema validation
   - Date formatting utilities

3. **E2E Tests**
   - Add car flow
   - Add reading flow
   - View history and filter

## Dependencies

```json
{
  "@mantine/core": "^7.0.0",
  "@mantine/hooks": "^7.0.0",
  "@mantine/form": "^7.0.0",
  "@mantine/charts": "^7.0.0",
  "@mantine/dates": "^7.0.0",
  "@tabler/icons-react": "^2.40.0",
  "dayjs": "^1.11.0",
  "zod": "^3.22.0",
  "recharts": "^2.10.0"
}
```

## Critical Files

1. **src/hooks/useAppState.ts** - Core state management, all CRUD flows through here
2. **src/components/layout/AppShell.tsx** - Mobile-first navigation shell
3. **src/components/readings/ReadingForm.tsx** - Primary user interaction
4. **src/components/dashboard/MileageChart.tsx** - Key visualization
5. **src/types/index.ts** - Foundation for type safety

---

## Deployment: Raspberry Pi + PWA

### Goal
Host on Raspberry Pi, accessible from any device on home network, installable on phone.

### Step 1: Add PWA Support (Installable on Phone)

**Files to create/modify:**

1. **public/manifest.json** - PWA manifest
```json
{
  "name": "Odometer Tracker",
  "short_name": "Odometer",
  "description": "Track your vehicle mileage",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a7aff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

2. **src/app/layout.tsx** - Add manifest link
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

3. **public/icon-192.png** and **public/icon-512.png** - App icons

### Step 2: Docker Deployment (Recommended)

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**next.config.mjs update:**
```js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Required for Docker
};
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  odometer:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

### Step 3: Deploy to Raspberry Pi

```bash
# On your Mac - build and transfer
docker buildx build --platform linux/arm64 -t odometer-tracker .
docker save odometer-tracker | gzip > odometer-tracker.tar.gz
scp odometer-tracker.tar.gz pi@raspberrypi.local:~

# On Raspberry Pi
docker load < odometer-tracker.tar.gz
docker run -d --name odometer -p 3000:3000 --restart unless-stopped odometer-tracker
```

### Step 4: Access from Phone

1. **Find Pi's IP address:**
   ```bash
   hostname -I  # On Pi, e.g., 192.168.1.100
   ```

2. **Set static IP (optional but recommended):**
   - In your router settings, assign a static IP to the Pi
   - Or use `raspberrypi.local` if mDNS works on your network

3. **Access from phone:**
   - Open `http://192.168.1.100:3000` (or `http://raspberrypi.local:3000`)
   - Tap "Add to Home Screen" in browser menu
   - App icon appears on home screen

### Alternative: PM2 (Without Docker)

If you prefer not to use Docker:

```bash
# On Raspberry Pi
npm install -g pm2
cd /path/to/odometer-tracker
npm ci && npm run build
pm2 start npm --name "odometer" -- start
pm2 save
pm2 startup  # Auto-start on boot
```

### Summary

| Component | Solution |
|-----------|----------|
| **Hosting** | Docker on Raspberry Pi |
| **Auto-restart** | Docker `restart: unless-stopped` or PM2 |
| **Network access** | Static IP or `raspberrypi.local` |
| **Phone install** | PWA manifest + Add to Home Screen |
| **Offline** | Already works (localStorage) |

### Files to Modify

1. `public/manifest.json` - Create PWA manifest
2. `public/icon-192.png` - App icon (192x192)
3. `public/icon-512.png` - App icon (512x512)
4. `src/app/layout.tsx` - Add PWA meta tags
5. `next.config.mjs` - Add `output: 'standalone'`
6. `Dockerfile` - Create for deployment
7. `docker-compose.yml` - Create for easy management

### Verification

1. Build Docker image locally and test
2. Deploy to Pi and verify auto-restart works
3. Access from phone on WiFi
4. Install as PWA and verify icon appears
5. Test offline functionality
