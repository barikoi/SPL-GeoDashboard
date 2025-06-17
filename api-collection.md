# API Collection Documentation

## Base URL
The base URL for all API endpoints is configured through the environment variable `NEXT_PUBLIC_BASE_URL`.

## Authentication
The application uses the Barikoi API key for authentication, configured through the environment variable `NEXT_PUBLIC_BARIKOI_API_KEY`.

## API Endpoints

### 1. Upload Hub Locations
**Endpoint:** `${BASE_URL}/upload_hub_locations/`  
**Method:** POST  
**Content-Type:** multipart/form-data  
**Description:** Uploads hub location data with coverage information.

**Request Body:**
- `file`: CSV file containing hub locations with the following columns:
  - City
  - Latitude
  - Longitude

**Response:**
```json
{
  "message": "success"
}
```

### 2. Upload Population Data
**Endpoint:** `${BASE_URL}/upload_population/`  
**Method:** POST  
**Content-Type:** multipart/form-data  
**Description:** Uploads population data for analysis.

**Request Body:**
- `file`: CSV file containing population data

**Response:**
```json
{
  "message": "success"
}
```

### 3. Calculate Hubs
**Endpoint:** `${BASE_URL}/calculate_hubs/`  
**Method:** POST  
**Description:** Calculates optimal hub locations based on population data and filters.

**Query Parameters:**
- `radius`: Number (default: 2000) - Search radius in meters
- `gender`: String (optional) - Filter by gender
- `nationality`: String (optional) - Filter by nationality
- `occupation_mode`: String (optional) - Filter by occupation mode
- `age_group`: String (optional) - Filter by age group

**Response:**
```json
{
  "message": "success",
  "suggested_hubs": [
    {
      "latitude": number,
      "longitude": number,
      "coverage": string | null
    }
  ]
}
```

### 4. Get Suggested Hubs
**Endpoint:** `${BASE_URL}/suggested_hubs/`  
**Method:** GET  
**Description:** Retrieves previously calculated suggested hub locations.

**Response:**
```json
{
  "message": "success",
  "suggested_hubs": [
    {
      "latitude": number,
      "longitude": number,
      "coverage": string | null
    }
  ]
}
```

### 5. Isochrone Service
**Endpoint:** `https://gh.bmapsbd.com/sau/isochrone`  
**Method:** GET  
**Description:** Calculates isochrones (travel time areas) for given coordinates.

**Query Parameters:**
- `point`: String (format: "latitude,longitude")
- `profile`: String (options: "foot", "car") - Travel mode
- `time_limit`: Number - Time limit in seconds
- `reverse_flow`: Boolean - Whether to calculate reverse flow

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "time": number
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": number[][][]
      }
    }
  ]
}
```

## External Data Sources

### 1. Province Data
**URL:** `https://gist.githubusercontent.com/sarikamahboob/1b23e53b410c9904bc805241d085067e/raw/4a55a4d550a4bc45edac3bc957d6582348ec8438/gadm41_SAU_2.json`  
**Method:** GET  
**Description:** Retrieves province boundary data for Saudi Arabia.

### 2. Riyadh City Data
**URL:** `https://gist.githubusercontent.com/sarikamahboob/e268073d9415344faa00f043b5ebf58c/raw/90a5293be0aeab58db2cd6d4a5f7952acb97ee53/riyadh_city.json`  
**Method:** GET  
**Description:** Retrieves Riyadh city boundary data.

## Error Handling

All API endpoints follow standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses include a message describing the error:
```json
{
  "error": "Error message description"
}
```

## Data Formats

### CSV Format Requirements
1. Hub Locations CSV:
   - Required columns: City, Latitude, Longitude
   - Optional columns: Coverage

2. Population Data CSV:
   - Required columns: Latitude, Longitude, Nationality, Gender, OccupationMode, Age Group