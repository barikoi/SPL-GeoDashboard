import riyadhCityData from '../app/data/riyadh.json';

export interface RiyadhCityPolygon {
  name: string;
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
  properties: {
    OBJECTID: number;
    DataSource: number;
    CreationUs: string;
    DateCreate: string;
    DateModifi: string;
    LastUser: string;
    pkCityID: number;
    ArabicName: string;
    EnglishNam: string;
    fkRegionID: number;
    fkEmirateI: number;
    fKGovernor: number;
    MarkazID: number;
    MOIClassif: number;
    Descriptio: string;
    Shape_STAr: number;
    Shape_STLe: number;
  };
}

export const getRiyadhCityPolygon = (): RiyadhCityPolygon | null => {
  if (riyadhCityData.features && riyadhCityData.features.length > 0) {
    const feature = riyadhCityData.features[0];
    return {
      name: feature.properties.EnglishNam,
      geometry: feature.geometry,
      properties: feature.properties
    };
  }
  return null;
};

export const getRiyadhCityBounds = (): number[][] | null => {
  const polygon = getRiyadhCityPolygon();
  if (!polygon || !polygon.geometry.coordinates) {
    return null;
  }

  // Calculate bounds from MultiPolygon coordinates
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  
  polygon.geometry.coordinates.forEach((polygon: number[][][]) => {
    polygon.forEach((ring: number[][]) => {
      ring.forEach((coord: number[]) => {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
    });
  });

  // Add padding
  const padding = 0.02; // About 2km padding
  return [
    [minLng - padding, minLat - padding],
    [maxLng + padding, maxLat + padding]
  ];
}; 