export interface DataPoint {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  geojson: string;
  isochrones?: unknown;
  coverage?: unknown;
}