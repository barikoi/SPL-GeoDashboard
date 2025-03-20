export interface IsochroneData {
  data: {
    polygons: Array<{
      geometry: {
        coordinates: number[][][];
      };
    }>;
  };
  datasetId: string;
}

export interface DataPoint {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  geojson: string;
  coverage?: any; // Coverage polygon data
}

export interface PopulationPoint {
  Latitude: number;
  Longitude: number;
  CityNameEn: string;
}

export interface HoverInfo {
  object: any;
  x: number;
  y: number;
  type: "point" | "hexagon" | "suggested" | "HeatmapLayer";
}