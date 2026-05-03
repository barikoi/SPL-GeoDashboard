# API Collection

All external API endpoints consumed by the dashboard.

---

## 1. SPL Backend API

**Base URL:** `NEXT_PUBLIC_BASE_URL` (e.g., `https://na-routing.vng-solutions.com/api/v1`)

### 1.1 Upload Hub Locations

Uploads hub location data with coverage polygons to the backend.

```
POST /upload_hub_locations/
```

| Part | Type | Description |
|------|------|-------------|
| `file` | CSV file | CSV containing hub locations with columns: City, Latitude, Longitude, coverage (GeoJSON polygon) |

**Headers:**
```
Accept: */*
```

**Request Body:** `multipart/form-data`

**Response:** `200 OK`

**Called by:** `MapComponent.tsx` (after isochrone calculation), `LeftPanel.tsx` (population coverage flow)

---

### 1.2 Upload Population Data

Uploads population density CSV for analysis.

```
POST /upload_population/
```

| Part | Type | Description |
|------|------|-------------|
| `file` | CSV file | CSV with columns: Latitude, Longitude, and optionally population density data |

**Headers:**
```
Accept: */*
```

**Request Body:** `multipart/form-data`

**Response:** `200 OK`

**Called by:** `LeftPanel.tsx` → `handleCalculatePopulation()`

---

### 1.3 Calculate Hubs

Triggers hub calculation on the backend after both hub and population data are uploaded.

```
POST /calculate_hubs/?radius=2000
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `radius` | number | 2000 | Search radius in meters |

**Headers:**
```
accept: application/json
```

**Response:** `200 OK`

**Called by:** `LeftPanel.tsx` → `handleCalculatePopulation()`

---

### 1.4 Get Suggested Hubs

Returns algorithmically suggested optimal hub locations.

```
GET /suggested_hubs/
```

**Headers:**
```
accept: application/json
```

**Response:**
```json
{
  "message": "success",
  "suggested_hubs": [
    {
      "latitude": 24.7136,
      "longitude": 46.6753,
      "coverage": "{ \"type\": \"Polygon\", \"coordinates\": [...] }"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `suggested_hubs[].latitude` | number | Hub latitude |
| `suggested_hubs[].longitude` | number | Hub longitude |
| `suggested_hubs[].coverage` | string | GeoJSON Polygon (stringified) representing coverage area |

**Called by:** `LeftPanel.tsx` → `handleGetSuggestedHubs()`

---

## 2. GraphHopper Isochrone API

**Base URL:** `https://gh.bmapsbd.com/sau`

### 2.1 Get Walkable Isochrone

Returns a walkable coverage polygon for a given point and time limit.

```
GET /isochrone
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `point` | string | yes | Comma-separated `latitude,longitude` |
| `profile` | string | yes | Routing profile (always `foot`) |
| `time_limit` | number | yes | Time in seconds (e.g., `600` for 10 min) |
| `reverse_flow` | boolean | yes | Always `true` |

**Example:**
```
GET https://gh.bmapsbd.com/sau/isochrone?point=24.7136,46.6753&profile=foot&time_limit=600&reverse_flow=true
```

**Response:**
```json
{
  "polygons": [
    {
      "geometry": {
        "coordinates": [[[46.67, 24.71], [46.68, 24.72], ...]]
      }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `polygons[].geometry.coordinates` | number[][][] | GeoJSON Polygon coordinates (first polygon = main isochrone) |

**Called by:** `MapComponent.tsx` (isochrone fetching for datasets and suggested hubs)

**Rate limiting:** Sequential requests per dataset point (no parallel batch). Large datasets can take minutes.

---

## 3. Map Tile Server

**Base URL:** `https://na-maps.vng-solutions.com`

### 3.1 Map Styles

| Style | URL | Usage |
|-------|-----|-------|
| Day Mode | `/styles/spl_bgmaps/style.json` | Default map style |
| Night Mode | `/styles/spl_dark/style.json` | Dark theme map |

**Layers available in styles:**
- `Riyadh building 3d` — 3D building extrusions (Riyadh area)

**Called by:** `MapComponent.tsx` → `mapStyle` variable

---

## 4. Search Autocomplete API

**Base URL:** `https://na-maps.vng-solutions.com/spl/api/v1`

### 4.1 Autocomplete Search

Returns POI (Point of Interest) search results.

```
GET /search/autocomplete
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query (min 2 chars) |
| `limit` | number | no | Max results (default 10) |
| `page` | number | no | Page number (default 1) |

**Headers:**
```
accept: application/json
X-API-KEY: <NEXT_PUBLIC_AUTOCOMPLETE_API_KEY>
```

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "poi_id": "string",
      "name_en": "string",
      "name_ar": "string",
      "address_en": "string",
      "address_ar": "string",
      "category": "string",
      "sub_category": "string",
      "poi_type": "string",
      "latitude": 24.7136,
      "longitude": 46.6753,
      "geom": [lat1, lng1, lat2, lng2, ...],
      "city_en": "string",
      "city_ar": "string",
      "district_en": "string",
      "district_ar": "string",
      "country": "string",
      "country_code": "string"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `results[].name_en` | string | English name |
| `results[].name_ar` | string | Arabic name |
| `results[].latitude` | number | POI latitude |
| `results[].longitude` | number | POI longitude |
| `results[].geom` | number[] | Flat array of `[lat, lng, lat, lng, ...]` polygon coordinates |
| `results[].address_en` | string | English address |

**Called by:** `SearchBar.tsx` → `searchLocations()` with 1-second debounce

---

## 5. Static Data Sources (GitHub Gists)

### 5.1 Saudi Arabia Province Boundaries

```
GET https://gist.githubusercontent.com/sarikamahboob/1b23e53b410c9904bc805241d085067e/raw/.../gadm41_SAU_2.json
```

GeoJSON FeatureCollection with `NAME_1` (province) and `NAME_2` (city) properties. Used for province polygon overlay and coverage area calculations.

### 5.2 Riyadh City Boundary

```
GET https://gist.githubusercontent.com/sarikamahboob/e268073d9415344faa00f043b5ebf58c/raw/.../riyadh_city.json
```

GeoJSON FeatureCollection of Riyadh city districts with `NAME_2` property. Fetched multiple times during coverage calculations (not cached — optimization opportunity).

---

## 6. Vector Tile Source

### 6.1 Arid Grid

```
Source URL: https://tiles.bmapsbd.com/arid_grid
Source Layer: arid_grid
Bounds: [46.551409, 24.826581, 46.653344, 24.969812]
```

Vector tile source for arid grid contour lines in the Riyadh area. Rendered as pink lines (`#ff69b4`).

**Called by:** `MapComponent.tsx` → `addAridGridLayer()` (currently commented out in UI)

---

## API Error Handling

| Endpoint | Error Handling |
|----------|---------------|
| Isochrone API | Per-point try/catch. Failed points return without coverage. No retry. |
| SPL Backend | Checks `response.ok`. Shows `message.error()` on failure. |
| Autocomplete | try/catch with empty results on failure. |
| Static Gists | try/catch with `console.error`. Stats calculation skips on failure. |
| All fetches | No global error boundary. Errors logged to console. |
