# SPL GeoDashboard

Geospatial analytics dashboard for Saudi Post (SPL) — analyze walkable coverage of hub locations, compare with competitor coverage, and evaluate real estate metrics across Riyadh neighbourhoods.

**Staging:** [https://na-routing.vng-solutions.com/spl/](https://na-routing.vng-solutions.com/spl/)

## Tech Stack

- **Framework:** Next.js 14 (App Router, standalone output)
- **Language:** TypeScript
- **Map:** MapLibre GL JS + react-map-gl + deck.gl v9
- **State:** Redux Toolkit
- **UI:** Ant Design + Tailwind CSS
- **Geospatial:** Turf.js, PapaParse
- **Containerization:** Docker (multi-stage, Node 22 Alpine)

## Features

- **File Upload** — CSV/JSON upload for SPL hub locations and competitor points
- **Walkable Coverage** — Isochrone calculation via GraphHopper API with configurable walking time (1–60 min)
- **Suggested Hubs** — Backend-generated optimal hub locations with coverage polygons
- **Population Coverage** — Upload population data and analyze coverage against hub locations
- **Location Search** — Autocomplete POI search with bilingual (EN/AR) results, polygon rendering, and marker placement
- **Map Layers** — Hexagon, Heatmap, Scatter, GeoJSON, and Icon layers via deck.gl
- **Real Estate Filters** — Cascading City → Neighbourhood → Unit Type filters with aggregated stats (rent, land area, price/sqm)
- **Coverage Statistics** — Current vs. suggested hub coverage comparison tables
- **Dark/Light Mode** — Night/day map themes and UI toggle
- **2D/3D Toggle** — Map pitch control for 3D viewing
- **RTL Support** — Arabic text rendering via Mapbox RTL plugin

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with Redux Provider
│   ├── page.tsx                # Entry page with auth guard
│   ├── globals.css             # Global styles
│   ├── config.ts               # BASE_URL from env
│   └── data/                   # Static GeoJSON data
├── components/
│   ├── Auth/
│   │   ├── AuthProvider.tsx    # Auth state hydration from localStorage
│   │   ├── LoginPage.tsx       # Login form with hardcoded credentials
│   │   └── ProtectedRoute.tsx  # Route guard redirecting to login
│   ├── Dashboard/
│   │   └── Dashboard.tsx       # Layout: LeftPanel + MapComponent
│   ├── LeftPanel/
│   │   ├── LeftPanel.tsx       # Sidebar: file upload, datasets, coverage, suggested hubs
│   │   └── CalculateWalkableCoverageModal.tsx
│   └── MapComponent/
│       ├── MapComponent.tsx    # Interactive map with deck.gl layers, isochrones, search
│       ├── SearchBar.tsx       # Autocomplete POI search (bilingual EN/AR)
│       ├── MapFilters.tsx      # City/Neighbourhood/Unit Type cascading filters
│       ├── MapControlButton.tsx# Reusable map overlay toggle button
│       ├── CoverageStats.tsx   # Coverage comparison statistics panel
│       └── FilterResults.tsx   # Real estate aggregated metrics display
├── store/
│   ├── store.ts                # Redux store configuration
│   ├── mapSlice.ts             # Map state: datasets, layers, filters, isochrones
│   └── authSlice.ts            # Auth state: login/logout
├── hooks/
│   └── useAuthPersistence.ts   # Persists auth state to localStorage
├── types/
│   ├── mapTypes.ts             # IsochroneData, DataPoint, HoverInfo
│   └── leftPanelTypes.ts       # LeftPanel-specific DataPoint
├── utils/
│   ├── filterData.ts           # Static real estate data + filter helpers
│   ├── localUtils.ts           # CSV normalization, color utils, isochrone transform
│   ├── neighbourhoodPolygons.ts
│   └── riyadhCityPolygon.ts
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yaml         # Production/staging deployment config
└── .env                        # Environment variables
```

## API Integrations

| Service | Endpoint | Purpose |
|---------|----------|---------|
| SPL Autocomplete Search | `na-maps.vng-solutions.com/spl/api/v1/search/autocomplete` | POI search with bilingual results |
| Backend Routing API | `NEXT_PUBLIC_BASE_URL/upload_hub_locations/`, `/upload_population/`, `/calculate_hubs/`, `/suggested_hubs/` | Hub calculation and coverage analysis |
| GraphHopper Isochrone | `gh.bmapsbd.com/sau/isochrone` | Walkable area polygon generation |
| Map Tiles | `na-maps.vng-solutions.com/styles/spl_dark`, `/spl_bgmaps` | Custom dark and light map styles |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_BASE_URL=https://na-routing.vng-solutions.com/api
NEXT_PUBLIC_BARIKOI_API_KEY=your_barikoi_api_key
NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_autocomplete_api_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

## Docker Deployment

### Build

```bash
docker build -t spl-geodashboard .
```

### Run (Staging)

```bash
docker compose up -d
```

The app is served under `/spl` base path. Docker image: `rilusmahmud/spl-geodashboard`.

### Required Environment Variables for Docker

```env
NEXT_PUBLIC_BASE_URL=https://na-routing.vng-solutions.com/api
NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_autocomplete_api_key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prepare` | Install Husky git hooks |

## License

Private — Saudi Post (SPL)
