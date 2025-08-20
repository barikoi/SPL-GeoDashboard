import geojsonData from '@/app/data/geojsons.json';

export interface NeighbourhoodPolygon {
  id: number;
  name: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export const getNeighbourhoodPolygons = (): NeighbourhoodPolygon[] => {
  return geojsonData.features.map((feature: any) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    geometry: feature.geometry
  }));
};

export const getNeighbourhoodPolygonByName = (name: string): NeighbourhoodPolygon | null => {
  const polygons = getNeighbourhoodPolygons();
  return polygons.find(polygon => polygon.name === name) || null;
};

export const getNeighbourhoodNames = (): string[] => {
  const polygons = getNeighbourhoodPolygons();
  return polygons.map(polygon => polygon.name);
}; 