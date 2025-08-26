import geojsonData from '@/app/data/geojsons.json';

export interface NeighbourhoodPolygon {
  id: number;
  name: string;
  district?: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export const getNeighbourhoodPolygons = (): NeighbourhoodPolygon[] => {
  return geojsonData.features.map((feature: any) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    district: feature.properties.district,
    geometry: feature.geometry
  }));
};

export const getNeighbourhoodPolygonByName = (name: string): NeighbourhoodPolygon | null => {
  const polygons = getNeighbourhoodPolygons();
  return polygons.find(polygon => polygon.name === name) || null;
};

export const getNeighbourhoodPolygonsByName = (name: string): NeighbourhoodPolygon[] => {
  const polygons = getNeighbourhoodPolygons();
  return polygons.filter(polygon => polygon.name === name);
};

export const getNeighbourhoodNames = (): string[] => {
  const polygons = getNeighbourhoodPolygons();
  return Array.from(new Set(polygons.map(polygon => polygon.name)));
}; 