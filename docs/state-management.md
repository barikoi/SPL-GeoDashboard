# State Management

## Store Configuration

```typescript
// store/store.ts
{
  reducer: {
    map: mapReducer,   // All map/dashboard state
    auth: authReducer,  // Authentication state
  }
}
```

---

## authSlice

**File:** `store/authSlice.ts`

### State Shape

```typescript
interface AuthState {
  isAuthenticated: boolean;  // Whether user is logged in
  isLoading: boolean;        // Loading state during login
  error: string | null;      // Error message from login attempt
}
```

### Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `loginStart` | none | Sets `isLoading: true`, clears error |
| `loginSuccess` | none | Sets `isAuthenticated: true`, `isLoading: false` |
| `loginFailure` | `string` | Sets `isAuthenticated: false`, stores error message |
| `logout` | none | Resets all auth state to defaults |

### Persistence

Auth state is persisted to `localStorage` via `useAuthPersistence` hook:
- Saves entire `authState` to `localStorage.auth` on every state change
- `AuthProvider` restores `isAuthenticated` on mount from localStorage

---

## mapSlice

**File:** `store/mapSlice.ts`

### State Shape

```typescript
interface MapState {
  // Dataset Management
  datasets: Dataset[];              // Uploaded hub location datasets
  hoverInfo: HoverInfo | null;      // Current tooltip hover information

  // Isochrone / Coverage
  isochrones: any[];                // Calculated isochrone data
  showIsochrones: boolean;          // Whether to trigger isochrone calculation
  timeLimit: number;                // Walking time in minutes (default: 10)
  isCalculatingCoverage: boolean;   // Loading state for coverage calculation

  // Suggested Hubs
  suggestedHubs: SuggestedHub[] | null;          // Backend-suggested hub locations
  suggestedHubsIsochrones: any[];                 // Isochrones for suggested hubs
  isShowSuggestedHubsCoverage: boolean;           // Visibility of suggested hub polygons
  isShowWalkingDistanceVisibility: boolean;        // Visibility of walking distance polygons
  isGetSuggestedHubsWalkingDistanceButtonClicked: boolean;  // Triggers isochrone fetch for suggested hubs
  isFetchingIsochrones: boolean;                  // Loading state for isochrone fetching

  // Population
  populationLayerVisible: boolean;  // Whether population layer is shown
  deckglLayer: 'Hexgonlayer' | 'Heatmaplayer';  // Population visualization type

  // Map Display
  isNightMode: boolean;             // Day/Night mode toggle
  isShowBuilding: boolean;          // 3D building layer toggle
  isShowRegion: boolean;            // Province polygon toggle
  isShowCoveragePercetage: boolean; // Coverage percentage display
  isShowRiyadhCity: boolean;        // Riyadh city boundary toggle

  // Modal
  isWalkableCoverageModalVisible: boolean;        // Calculate coverage modal
  selectedOptionForWalkableCoverage: 'parcelat' | 'competitor';  // Which dataset to calculate for

  // Filters
  selectedCity: string | null;                    // Currently selected city filter
  selectedUnitType: string | null;                // Currently selected unit type
  selectedNeighbourhood: string | null;           // Currently selected neighbourhood
  selectedNeighbourhoodPolygon: any | null;       // GeoJSON polygon for selected neighbourhood
  neighbourhoodBounds: number[][] | null;         // [[minLng, minLat], [maxLng, maxLat]] for fly-to

  // Riyadh City
  selectedRiyadhCityPolygon: any | null;          // GeoJSON polygon for Riyadh city
  riyadhCityBounds: number[][] | null;            // [[minLng, minLat], [maxLng, maxLat]] for fly-to
}
```

### Dataset Interface

```typescript
interface Dataset {
  id: string;                              // Unique ID (dataset-{timestamp})
  name: string;                            // Original filename
  data: DataPoint[];                       // Normalized point data
  visible: boolean;                        // Layer visibility
  color: [number, number, number];         // RGB color for rendering
  strokedColor: [number, number, number];  // Darker RGB for borders
  hasIsochrones?: boolean;                 // Whether isochrones have been calculated
  originalFile: any[];                     // Original parsed file data
  downloadableData?: any[];                // Processed data for download
  layerIds: {                              // Unique layer IDs for deck.gl
    coverage: string;
    scatterplot: string;
  };
  uploaded_file_for: 'parcelat' | 'competitor';  // Dataset category
}
```

### SuggestedHub Interface

```typescript
interface SuggestedHub {
  latitude: number;
  longitude: number;
  coverage: string;  // Stringified GeoJSON Polygon
}
```

---

### All Actions

#### Dataset Management

| Action | Payload | Description |
|--------|---------|-------------|
| `addDataset` | `Dataset` | Add new uploaded dataset |
| `toggleDatasetVisibility` | `string` (id) | Toggle dataset visibility |
| `removeDataset` | `string` (id) | Remove dataset |
| `updateDatasetWithIsochrones` | `{ datasetId, updatedData }` | Update dataset with isochrone data |
| `updateDatasetWithDownloadable` | `{ datasetId, downloadableData }` | Add downloadable data |

#### Isochrone Controls

| Action | Payload | Description |
|--------|---------|-------------|
| `setTimeLimit` | `number` | Set walking time (minutes) |
| `showIsochrones` | `boolean` | Trigger isochrone calculation |
| `addIsochrone` | `any` | Add isochrone data |
| `resetIsochrones` | none | Reset isochrone display |
| `setCalculatingCoverage` | `boolean` | Set loading state |

#### Suggested Hubs

| Action | Payload | Description |
|--------|---------|-------------|
| `setSuggestedHubs` | `SuggestedHub[]` | Store suggested hubs from API |
| `setSuggestedHubsIsochrones` | `any[]` | Store isochrone data for suggested hubs |
| `toggleSuggestedHubsVisibility` | none | Toggle suggested hub layer |
| `toggleWalkingDistanceVisibility` | none | Toggle walking distance layer |
| `setIsGetSuggestedHubsWalkingDistanceButtonClicked` | none | Trigger walking distance fetch |
| `setIsFetchingIsochrones` | `boolean` | Set isochrone loading state |

#### Population

| Action | Payload | Description |
|--------|---------|-------------|
| `togglePopulationLayer` | none | Toggle population layer visibility |
| `setDeckglLayer` | `'Hexgonlayer' \| 'Heatmaplayer'` | Switch population viz type |

#### Map Display

| Action | Payload | Description |
|--------|---------|-------------|
| `toggleNightMode` | none | Toggle day/night mode |
| `toggleBuildingShow` | none | Toggle 3D buildings |
| `toggleRegionShow` | none | Toggle province polygons |
| `toggleRiyadhCityShow` | none | Toggle Riyadh city boundary |
| `setIsShowCoveragePercetage` | `boolean` | Show coverage stats |
| `setHoverInfo` | `{ x, y, object } \| null` | Update hover tooltip |

#### Modal

| Action | Payload | Description |
|--------|---------|-------------|
| `setIsWalkableCoverageModalVisible` | `boolean` | Open/close coverage modal |
| `setSelectedOptionForWalkableCoverage` | `'parcelat' \| 'competitor'` | Select dataset type |

#### Filters

| Action | Payload | Description |
|--------|---------|-------------|
| `setSelectedCity` | `string \| null` | Set city filter |
| `setSelectedUnitType` | `string \| null` | Set unit type filter |
| `setSelectedNeighbourhood` | `string \| null` | Set neighbourhood filter |
| `setSelectedNeighbourhoodPolygon` | `any \| null` | Set neighbourhood polygon |
| `flyToNeighbourhoodBounds` | `number[][]` | Fly map to neighbourhood |
| `setSelectedRiyadhCityPolygon` | `any \| null` | Set Riyadh polygon |
| `flyToRiyadhCityBounds` | `number[][]` | Fly map to Riyadh city |
| `clearAllFilters` | none | Reset all filters and bounds |

---

## Data Flow Diagrams

### Dataset Upload → Redux → Map Rendering

```
LeftPanel handleFileChange
  │
  ├── Parse file (PapaParse / JSON.parse)
  ├── Validate columns (City, Latitude, Longitude)
  ├── normalizeData() → DataPoint[]
  │
  └── dispatch(addDataset({...}))
        │
        ▼
  Redux store: state.map.datasets.push(dataset)
        │
        ▼
  MapComponent useSelector([state.map.datasets])
        │
        └── layers = datasets.flatMap(dataset => [
              new GeoJsonLayer(coverage),      ← if dataset.data has coverage
              new ScatterplotLayer(points)      ← always rendered
            ])
              │
              ▼
        DeckGLOverlay layers={layers}
              │
              ▼
        MapLibre renders layers
```

### Coverage Calculation Flow

```
User clicks "Calculate Coverage"
  → Modal opens → selects parcelat/competitor → clicks "Calculate"
    │
    ├── dispatch(setIsWalkableCoverageModalVisible(false))
    └── dispatch(showIsochrones(true))
          │
          ▼
  MapComponent useEffect([showIsochrones])
    │
    ├── dispatch(setCalculatingCoverage(true))
    ├── Filter datasets by selectedOptionForWalkableCoverage
    ├── For each visible dataset:
    │     For each point:
    │       GET gh.bmapsbd.com/sau/isochrone?point=lat,lng...
    │       transformIsochroneToGeometry(response)
    │       return { ...point, isochrones: geometry }
    │
    ├── dispatch(updateDatasetWithIsochrones({ datasetId, updatedData }))
    ├── POST /upload_hub_locations/ (CSV with coverage)
    ├── calculateCoverageStats() → Turf.js area calculations
    │
    ├── dispatch(resetIsochrones())
    └── dispatch(setCalculatingCoverage(false))
```

### State Access Patterns

Components access state via `useSelector`:

```typescript
// Most components access a subset of map state
const isNightMode = useSelector((state: RootState) => state.map.isNightMode);

// MapComponent is the heaviest consumer (~20 useSelector calls)
const datasets = useSelector((state: RootState) => state.map.datasets);
const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
// ... etc
```

No memoized selectors are used. All `useSelector` calls create new references on every state change.

---

## Communication Patterns

### Redux (primary)

Standard dispatch/useSelector for all shared state.

### CustomEvent (population data)

LeftPanel → MapComponent communication for population upload:

```typescript
// LeftPanel dispatches
const event = new CustomEvent("populationData", { detail: parsedData });
window.dispatchEvent(event);

// MapComponent listens
window.addEventListener("populationData", handler);
```

Also used for `calculateCoverage` event from `CalculateWalkableCoverageModal`.

### Direct DOM manipulation (file input reset)

```typescript
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput) fileInput.value = '';
```

Used to reset file inputs after validation errors. Not idiomatic React but functional.
