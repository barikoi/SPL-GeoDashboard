# Features & User Flows

## Feature List

| # | Feature | Description |
|---|---------|-------------|
| 1 | Authentication | Login with static credentials, persisted in localStorage |
| 2 | Hub Location Upload | Upload CSV/JSON files with hub points (Parcelat & Competitor) |
| 3 | Walkable Coverage Calculation | Calculate isochrone polygons showing walkable area from each hub |
| 4 | Population Density Visualization | Upload population data, render as hexagon or heatmap layer |
| 5 | Population Coverage Analysis | Calculate what percentage of population is covered by hubs |
| 6 | Suggested Hubs | Get algorithmically optimal new hub locations |
| 7 | Suggested Hub Walking Distance | Calculate walking coverage for suggested hubs |
| 8 | Coverage Statistics | Compare current vs suggested hub coverage with area calculations |
| 9 | Map Search | Autocomplete POI search with polygon/marker display |
| 10 | Map Filters | Filter by city, neighbourhood, unit type |
| 11 | Real Estate Statistics | Show average rent, transaction data for Riyadh neighbourhoods |
| 12 | Day/Night Mode | Toggle between light and dark map themes |
| 13 | 2D/3D Toggle | Switch between flat and 3D perspective views |
| 14 | Building Layer | Toggle 3D building visualization (Riyadh area) |
| 15 | Region Overlay | Show Saudi Arabia province boundaries with color coding |
| 16 | Riyadh City Boundary | Show Riyadh city district boundaries |
| 17 | Dataset Management | Toggle visibility, delete, download datasets with coverage data |
| 18 | RTL Support | Arabic text support via MapLibre RTL plugin |

---

## User Flows

### Flow 1: Login

```
User opens /spl/
  → AuthProvider checks localStorage for auth state
  → If not authenticated: LoginPage renders
  → User enters email + password
  → Credentials validated against static list (no backend call)
  → On success: dispatch(loginSuccess()) → localStorage updated
  → ProtectedRoute renders Dashboard
```

**Valid credentials (hardcoded in LoginPage.tsx):**
- `Rnmotmi@splonline.com.sa` / `raghadspl2025`
- `phunsukhWangdu@spltest.com.sa` / `phunsukhWangdu@123`

---

### Flow 2: Upload Hub Locations & Calculate Coverage

```
Step 1: Upload Hub File
  → User clicks file input under "Parcelat Points" or "Competitor Points"
  → Selects CSV or JSON file
  → File validated for required columns (City, Latitude, Longitude)
  → Parsed → normalized → added to Redux store as new dataset
  → Dataset appears in list with random color, visibility toggle, delete button

Step 2: Configure Walking Time
  → After upload, "Calculate Walkable Coverage" section appears
  → User enters walking time in minutes (1-60)
  → Clicks "Calculate Coverage" button

Step 3: Select Dataset Type
  → Modal opens: user chooses "Parcelat Points" or "Competitor Points"
  → Clicks "Calculate"

Step 4: Coverage Calculation (automatic)
  → MapComponent fetches isochrone for each visible point in selected dataset
  → API call per point: GET gh.bmapsbd.com/sau/isochrone?point=lat,lng&profile=foot&time_limit=N
  → Each isochrone polygon stored in Redux dataset
  → Coverage CSV uploaded to SPL backend: POST /upload_hub_locations/
  → Coverage stats calculated (Turf.js area intersection with Riyadh city boundary)

Step 5: View Results
  → Coverage polygons rendered on map (semi-transparent, dataset color)
  → Hub points rendered as scatter dots
  → Coverage statistics table available via calculator button
```

**File formats accepted:**

CSV:
```csv
City,Latitude,Longitude,coverage
Riyadh,24.7136,46.6753,
Riyadh,24.7200,46.6800,
```

JSON (array):
```json
[
  { "City": "Riyadh", "Latitude": 24.7136, "Longitude": 46.6753 }
]
```

JSON (GeoJSON FeatureCollection):
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [46.6753, 24.7136] },
      "properties": { "City": "Riyadh" }
    }
  ]
}
```

---

### Flow 3: Population Coverage Analysis

```
Prerequisite: Hub locations uploaded + coverage calculated

Step 1: Upload Population File
  → User clicks "Select Population File" under "Population Coverage"
  → Selects CSV file with Latitude, Longitude columns
  → File validated → parsed → dispatched via CustomEvent to MapComponent
  → Population layer appears on map (hexagon or heatmap)

Step 2: Choose Layer Type
  → Radio buttons: "HexagonLayer" or "HeatmapLayer"
  → Hexagon: 3D extruded hexbins showing population density
  → Heatmap: 2D heat map with gradient colors

Step 3: Calculate Population Coverage
  → User clicks "Calculate Population Coverage"
  → Three sequential API calls:
    1. POST /upload_hub_locations/ (hub data with coverage)
    2. POST /upload_population/ (population file)
    3. POST /calculate_hubs/?radius=2000
  → Progress bar shows 33% → 66% → 100%
  → Success message on completion
```

---

### Flow 4: Suggested Hubs

```
Prerequisite: Hub locations uploaded

Step 1: Get Suggestions
  → User clicks "Get Suggested Hubs" button
  → GET /suggested_hubs/ called
  → Results rendered as:
    - Coverage polygons (green/red colored)
    - Hub points (scatter dots)
  → Map auto-flies to center of suggested hubs
  → Hub count displayed in left panel

Step 2: Get Walking Distance for Suggested Hubs
  → User clicks "Get Suggested Hubs Walking Distance"
  → Isochrone fetched per suggested hub (same GraphHopper API)
  → Walking coverage polygons rendered (orange colored)
  → Stats calculated and available in coverage comparison
```

---

### Flow 5: Search & Explore

```
Step 1: Search
  → User types in search bar (top of map)
  → After 2+ chars, debounced (1s) autocomplete query sent
  → Results show: name (EN + AR), address, category

Step 2: Select Result
  → Click on result → map flies to location (zoom 14)
  → SPL marker icon placed at location
  → If result has geometry: polygon rendered on map (light blue fill)
  → Hover on polygon/marker shows info tooltip

Step 3: Clear Search
  → Click X icon in search bar
  → Marker, polygon, and search layers removed from map
```

---

### Flow 6: Map Filters & Real Estate Data

```
Step 1: Filter by City
  → User selects city from dropdown (currently only "Riyadh")
  → Riyadh city boundary polygon rendered on map (orange outline)
  → Map flies to Riyadh city bounds

Step 2: Filter by Neighbourhood
  → User selects neighbourhood (Qurtubah, Sedra, Al Yasmeen, Al Malqa, Al Olaya)
  → Neighbourhood polygon rendered on map (orange/blue)
  → Map flies to neighbourhood bounds
  → Some neighbourhoods have multiple polygons (Qurtubah, Sedra)

Step 3: View Real Estate Statistics
  → "Filter Results" panel shows aggregated data:
    - Average Rent (Apartment / Villa / Store) in SAR
    - Average Land Area in SQM
    - Average Unit Price in Million SAR
    - Average Price Per SQM in SAR
    - Total Transaction Amount in Million SAR
    - Total Number of Transactions
  → Data sourced from static dataset in utils/filterData.ts

Step 4: Clear Filters
  → Click "Clear Filters" button
  → All polygon overlays and filter selections removed
```

---

### Flow 7: Map Controls

```
Right sidebar buttons (from top):
  1. 2D/3D Toggle — switches pitch between 0 and 60 degrees
  2. Buildings — toggles "Riyadh building 3d" layer visibility
  3. Regions — toggles Saudi Arabia province polygon overlay
  4. Riyadh City — toggles Riyadh city boundary overlay
  5. Coverage Calculator — opens/closes coverage statistics panel

Active buttons highlighted in green (#82CD47)
```

---

### Flow 8: Download Coverage Data

```
Prerequisite: Coverage calculated for dataset

Step 1: Click download icon on dataset in left panel
  → Only enabled if dataset has isochrones
  → Original data combined with coverage polygon data
  → Exported as CSV using PapaParse
  → File named: {original_name}_with_coverage.csv
```

---

### Flow 9: Night/Day Mode

```
Toggle switch in left panel header
  → ON: Dark map style + dark UI theme (gray-800/900 backgrounds)
  → OFF: Light map style + light UI theme (white/gray-50 backgrounds)
  → All components respect isNightMode state from Redux
```

---

## Map Layer Hierarchy (bottom to top)

1. Base map tiles (MapLibre style)
2. Province polygons (GeoJsonLayer, when "Regions" enabled)
3. Riyadh city boundary (GeoJsonLayer outline)
4. Neighbourhood polygons (GeoJsonLayer, when filter selected)
5. Population hexagon/heatmap layer (deck.gl)
6. Coverage polygons per dataset (GeoJsonLayer)
7. Hub scatter points per dataset (ScatterplotLayer)
8. Suggested hub coverage polygons (GeoJsonLayer)
9. Suggested hub scatter points (ScatterplotLayer)
10. Suggested hub walking distance polygons (GeoJsonLayer)
11. Search result polygon (GeoJsonLayer)
12. Search result marker (IconLayer)
