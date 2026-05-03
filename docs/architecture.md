# Architecture

## System Overview

SPL GeoDashboard is a client-side web application for Saudi Post Logistics (SPL) that visualizes hub locations, walkable coverage areas, population density, and real estate data on an interactive map. It helps analysts evaluate hub placement and coverage gaps.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │ LeftPanel │  │  MapView  │  │  SearchBar / Filters │ │
│  │ (Upload,  │  │ (MapLibre │  │  (Autocomplete,      │ │
│  │  Calc,    │  │  +deck.gl)│  │   City/Neighbourhood)│ │
│  │  Export)  │  │           │  │                      │ │
│  └─────┬─────┘  └─────┬─────┘  └──────────┬───────────┘ │
│        │              │                   │             │
│        └──────────────┼───────────────────┘             │
│                       │                                 │
│              ┌────────┴────────┐                        │
│              │   Redux Store   │                        │
│              │ (mapSlice +     │                        │
│              │  authSlice)     │                        │
│              └────────┬────────┘                        │
│                       │                                 │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTP / Fetch
          ┌─────────────┼─────────────────┐
          │             │                 │
          ▼             ▼                 ▼
┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
│ SPL Backend   │ │ Map Tiles    │ │ GraphHopper      │
│ API           │ │ Server       │ │ Isochrone API    │
│ (na-routing)  │ │ (na-maps)    │ │ (gh.bmapsbd)     │
│               │ │              │ │                  │
│ - Hub CRUD    │ │ - Dark style │ │ - Walk isochrone │
│ - Population  │ │ - Light style│ │ - Time-based     │
│ - Suggested   │ │ - RTL support│ │   polygons       │
│   hubs        │ │              │ │                  │
└───────────────┘ └──────────────┘ └──────────────────┘
```

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 14.x | SSR, routing, standalone build |
| UI | React | 18.x | Component model |
| Language | TypeScript | 5.x | Type safety (currently non-strict) |
| State | Redux Toolkit | 2.x | Global state management |
| Map | MapLibre GL | 5.x | Base map rendering |
| Map Layers | deck.gl | 9.x | Scatter, GeoJSON, Hexagon, Heatmap layers |
| UI Kit | Ant Design | 5.x | Forms, modals, buttons, statistics |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Geospatial | Turf.js | 7.x | Area calculations, polygon operations |
| CSV | PapaParse | 5.x | CSV parsing and generation |
| HTTP | Axios | 1.x | Search autocomplete API |
| Build | Docker (multi-stage) | Node 22 Alpine | Production deployment |

## Component Tree

```
app/layout.tsx (Redux Provider)
└── app/page.tsx
    └── AuthProvider
        └── ProtectedRoute
            ├── LoginPage (if not authenticated)
            └── Dashboard
                ├── LeftPanel
                │   ├── File Upload (Parcelat Points)
                │   ├── File Upload (Competitor Points)
                │   ├── Dataset List (with visibility/delete/download)
                │   ├── Calculate Walkable Coverage
                │   │   └── CalculateWalkableCoverageModal
                │   ├── Population Coverage
                │   │   └── Layer Switcher (Hexagon / Heatmap)
                │   ├── Suggested Hubs
                │   └── Suggested Hubs Walking Distance
                └── MapComponent
                    ├── SearchBar (Autocomplete)
                    ├── MapFilters (City / Neighbourhood / Unit Type)
                    ├── FilterResults (Real Estate Stats)
                    ├── MapLibre GL Map
                    │   └── DeckGLOverlay (deck.gl layers)
                    ├── MapControlButtons (2D/3D, Buildings, Regions, etc.)
                    └── CoverageStats (Coverage comparison table)
```

## Data Flow

### Hub Upload & Coverage Calculation

```
1. User uploads CSV/JSON via LeftPanel
2. File parsed (PapaParse / JSON.parse) → normalized → dispatched to Redux
3. User sets walking time → clicks "Calculate Coverage"
4. Modal appears → user selects "Parcelat" or "Competitor"
5. MapComponent useEffect triggers isochrone fetch per point
   → GET gh.bmapsbd.com/sau/isochrone?point=lat,lng&profile=foot&time_limit=N
6. Isochrone polygons stored in Redux per dataset
7. Coverage CSV uploaded to SPL backend
   → POST /api/upload_hub_locations/
8. Coverage stats calculated using Turf.js (area intersection)
9. Stats displayed in CoverageStats panel
```

### Population Analysis

```
1. User uploads population CSV
2. Data dispatched via CustomEvent → MapComponent listener
3. Hexagon/Heatmap layer renders population points
4. User clicks "Calculate Population Coverage"
   → POST /api/upload_hub_locations/
   → POST /api/upload_population/
   → POST /api/calculate_hubs/?radius=2000
```

### Suggested Hubs

```
1. User clicks "Get Suggested Hubs"
   → GET /api/suggested_hubs/
2. Hubs rendered as ScatterplotLayer + GeoJsonLayer (coverage polygons)
3. User clicks "Get Suggested Hubs Walking Distance"
4. Isochrones fetched per suggested hub (same GraphHopper endpoint)
5. Walking distance coverage polygons rendered and compared
```

### Search

```
1. User types in SearchBar (debounced 1s, min 2 chars)
   → GET na-maps.vng-solutions.com/spl/api/v1/search/autocomplete?q=...
2. Results displayed with Ant Design AutoComplete
3. On selection: map flies to location, marker + polygon rendered
```

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Next.js standalone output | Docker-optimized production build without full node_modules |
| `basePath: /spl` | Application served under `/spl` path prefix |
| `ignoreBuildErrors: true` | Currently skips TS/ESLint errors during build (tech debt) |
| `strict: false` in tsconfig | Non-strict TS mode (tech debt) |
| localStorage auth | Simple client-side auth persistence, no JWT/session |
| CustomEvent for population data | Decouples LeftPanel from MapComponent for population upload |
| Runtime env substitution via entrypoint.sh | Allows Docker containers to receive env vars at startup instead of build time |

## External Dependencies

| Service | URL | Purpose |
|---------|-----|---------|
| SPL Backend API | `NEXT_PUBLIC_BASE_URL` (na-routing.vng-solutions.com/api) | Hub CRUD, population, suggested hubs |
| Map Tiles (Dark) | `na-maps.vng-solutions.com/styles/spl_dark/style.json` | Night mode map style |
| Map Tiles (Light) | `na-maps.vng-solutions.com/styles/spl_bgmaps/style.json` | Day mode map style |
| Autocomplete API | `na-maps.vng-solutions.com/spl/api/v1/search/autocomplete` | POI search |
| Isochrone API | `gh.bmapsbd.com/sau/isochrone` | Walking distance polygons |
| Province GeoJSON | `gist.githubusercontent.com/sarikamahboob/...` (gadm41_SAU_2.json) | Saudi Arabia province boundaries |
| Riyadh City GeoJSON | `gist.githubusercontent.com/sarikamahboob/...` (riyadh_city.json) | Riyadh city boundary polygons |
| Contour Tiles | `tiles.bmapsbd.com/arid_grid` | Arid grid overlay (Riyadh area) |
