# Development Guide

## Prerequisites


| Tool    | Version           | Install                                          |
| ------- | ----------------- | ------------------------------------------------ |
| Node.js | >=18.17.0 <23.0.0 | [nvm](https://github.com/nvm-sh/nvm) recommended |
| npm     | Comes with Node   | —                                                |
| Git     | Latest            | —                                                |


## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd SPL-GeoDashboard

# 2. Use correct Node version
nvm use    # reads .nvmrc

# 3. Install dependencies
npm install

# 4. Create .env file
cat > .env << 'EOF'
NEXT_PUBLIC_BASE_URL=https://na-routing.vng-solutions.com/api/v1
NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_api_key_here
EOF

# 5. Start development server
npm run dev
```

Open [http://localhost:3000/spl/](http://localhost:3000/spl/)

## Available Scripts


| Script            | Command      | Description                      |
| ----------------- | ------------ | -------------------------------- |
| `npm run dev`     | `next dev`   | Start dev server with hot reload |
| `npm run build`   | `next build` | Production build                 |
| `npm run start`   | `next start` | Start production server          |
| `npm run lint`    | `next lint`  | Run ESLint                       |
| `npm run prepare` | `husky`      | Set up Git hooks                 |


## Project Structure

```
SPL-GeoDashboard/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Redux Provider, global CSS)
│   ├── page.tsx                  # Entry page (Auth → Dashboard)
│   ├── globals.css               # Global styles
│   ├── config.ts                 # App config (BASE_URL)
│   ├── data/                     # Static JSON data
│   │   ├── geojsons.json         # GeoJSON data
│   │   └── riyadh.json           # Riyadh city boundaries
│   ├── images/                   # Static images
│   │   ├── SPL_Logo.webp         # SPL logo
│   │   ├── bkoi-img.png          # Barikoi logo (map attribution)
│   │   └── spl_logo.png          # SPL pin logo (search marker)
│   └── fonts/                    # Geist fonts
│
├── components/
│   ├── Auth/
│   │   ├── AuthProvider.tsx      # Restores auth from localStorage
│   │   ├── ProtectedRoute.tsx    # Redirects to LoginPage if not authed
│   │   └── LoginPage.tsx         # Login form with static credentials
│   ├── Dashboard/
│   │   └── Dashboard.tsx         # Layout: LeftPanel + MapComponent
│   ├── LeftPanel/
│   │   ├── LeftPanel.tsx         # Sidebar with all controls
│   │   └── CalculateWalkableCoverageModal.tsx  # Parcelat/Competitor selector
│   └── MapComponent/
│       ├── MapComponent.tsx      # Main map view (MapLibre + deck.gl)
│       ├── MapFilters.tsx        # City/Neighbourhood/UnitType dropdowns
│       ├── FilterResults.tsx     # Real estate statistics display
│       ├── CoverageStats.tsx     # Coverage comparison table
│       ├── SearchBar.tsx         # Autocomplete POI search
│       └── MapControlButton.tsx  # Reusable map control button
│
├── store/
│   ├── store.ts                  # Redux store configuration
│   ├── mapSlice.ts               # Map state (50+ reducers)
│   └── authSlice.ts              # Auth state (login/logout)
│
├── hooks/
│   └── useAuthPersistence.ts     # Syncs auth state to localStorage
│
├── types/
│   ├── mapTypes.ts               # Map-related types (DataPoint, HoverInfo, etc.)
│   └── leftPanelTypes.ts         # Left panel types (DataPoint for uploads)
│
├── utils/
│   ├── filterData.ts             # Static real estate data + filter functions
│   ├── localUtils.ts             # Color generation, data normalization, isochrone transform
│   ├── neighbourhoodPolygons.ts  # Neighbourhood GeoJSON boundary data
│   └── riyadhCityPolygon.ts      # Riyadh city GeoJSON boundary data
│
├── public/                       # Static public assets
├── docs/                         # Documentation (this folder)
│
├── next.config.js                # Next.js config (standalone, basePath, ignored builds)
├── tsconfig.json                 # TypeScript config (non-strict)
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.mjs            # PostCSS config
├── .eslintrc.json                # ESLint rules
├── commitlint.config.js          # Commit message convention
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yaml           # Docker Compose for deployment
├── entrypoint.sh                 # Runtime env var substitution
├── app.config.ts                 # BASE_URL export
└── package.json                  # Dependencies and scripts
```

## Key Files to Understand

### Start Here

1. `**app/page.tsx**` — Entry point. Shows how auth wraps the dashboard.
2. `**components/Dashboard/Dashboard.tsx**` — Simple flex layout of left panel + map.
3. `**store/mapSlice.ts**` — All map state. Read the `MapState` interface to understand available state.

### Deep Dive

1. `**components/LeftPanel/LeftPanel.tsx**` — All sidebar functionality. ~1200 lines. Handles file upload, isochrone triggers, population flow, suggested hubs.
2. `**components/MapComponent/MapComponent.tsx**` — All map rendering. ~2000 lines. Handles layers, isochrone fetching, coverage calculations, search, filters.
3. `**utils/filterData.ts**` — Static real estate dataset for Riyadh neighbourhoods.

## Coding Conventions

### TypeScript

- **Strict mode is OFF** (`strict: false` in tsconfig)
- `any` types are common (ESLint rule `@typescript-eslint/no-explicit-any` is off)
- `@ts-nocheck` used on `LeftPanel.tsx` and `mapSlice.ts`
- `@ts-ignore` used in several places for deck.gl typing issues

### State Management

- Redux Toolkit with `createSlice`
- All state in two slices: `map` and `auth`
- No Redux thunks or async middleware — all async in components
- Components dispatch actions directly

### Styling

- **Tailwind CSS** for layout and spacing
- **Ant Design** for form controls, modals, statistics
- **Inline styles** for map controls and dynamic theming
- Night mode handled via `isNightMode` Redux state, checked in every component

### File Handling

- CSV parsing: PapaParse
- JSON parsing: native `JSON.parse`
- File reading: `FileReader.readAsText()`
- File download: Blob → `URL.createObjectURL` → anchor click

### Naming

- Components: PascalCase files and exports
- Redux actions: camelCase (`addDataset`, `toggleNightMode`)
- CSS classes: Tailwind utilities (no custom class names)

## Common Development Tasks

### Adding a New Map Layer

1. Create the deck.gl layer instance in `MapComponent.tsx` → `layers` array
2. Add a toggle state to `mapSlice.ts` (boolean in `MapState` + toggle reducer)
3. Export the action from `mapSlice.ts`
4. Add a `MapControlButton` in `MapComponent.tsx` JSX
5. Import and dispatch the toggle action

### Adding a New File Upload Type

1. Add a new file input in `LeftPanel.tsx`
2. Create a `handleFileChange` function (copy existing pattern from `handleFileChangeForParcelat`)
3. Add `uploaded_file_for` discriminator to the dataset
4. Add any needed filter logic in `MapComponent.tsx` layer rendering

### Adding a New API Endpoint

1. Add the endpoint call in the relevant component (usually `LeftPanel.tsx` or `MapComponent.tsx`)
2. Use `fetch()` for SPL Backend, `axios` for search API
3. Handle errors with `message.error()` from Ant Design
4. Store results in Redux via dispatch

### Adding a New Neighbourhood

1. Add the neighbourhood polygon data in `utils/neighbourhoodPolygons.ts`
2. Add real estate data entries in `utils/filterData.ts`
3. The filter dropdowns auto-populate from the data

## Known Issues & Tech Debt


| Issue                      | Location                                    | Impact                               |
| -------------------------- | ------------------------------------------- | ------------------------------------ |
| `ignoreBuildErrors: true`  | `next.config.js`                            | Build passes with type errors        |
| `ignoreDuringBuilds: true` | `next.config.js`                            | Build passes with lint errors        |
| `strict: false`            | `tsconfig.json`                             | No strict type checking              |
| `@ts-nocheck`              | `LeftPanel.tsx:1`, `mapSlice.ts:1`          | Entire files bypass TypeScript       |
| Duplicate upload handlers  | `LeftPanel.tsx` (lines 122-249 and 251-378) | Code duplication                     |
| 2000-line component        | `MapComponent.tsx`                          | Hard to maintain                     |
| 1200-line component        | `LeftPanel.tsx`                             | Hard to maintain                     |
| No layer memoization       | `MapComponent.tsx` layers array             | Performance on every render          |
| Static credentials         | `LoginPage.tsx`                             | Credentials visible in client bundle |
| API key in client          | `SearchBar.tsx`                             | Exposed in browser bundle            |
| No tests                   | Entire project                              | Zero test coverage                   |


