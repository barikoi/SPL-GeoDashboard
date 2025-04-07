import { DataPoint } from "@/types/leftPanelTypes";
import type { Geometry } from "geojson";

export const getRandomColor = (): [number, number, number] => {
  const colors: [number, number, number][] = [
    [235, 159, 239],
    [3, 37, 78],
    [245, 213, 71],
    [219, 48, 105],
    [247, 92, 3],
    [4, 167, 119],
    [214, 159, 126],
    [135, 0, 88],
    [200, 214, 175],
    [105, 56, 92],
    [62, 146, 204],
    [255, 99, 71], 
    [0, 191, 255], 
  ];

  // Remove the last used color from the array
  if (getRandomColor.lastColor) {
    const index = colors.indexOf(getRandomColor.lastColor);
    if (index > -1) {
      colors.splice(index, 1);
    }
  }

  // Get a random color from remaining colors
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // Store the last used color
  getRandomColor.lastColor = color;
  
  return color;
};

// Add a static property to store last used color
getRandomColor.lastColor = null;

export const parseString = (data: string): any => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing coverage string:", error);
    return null;
  }
};

export const normalizeData = ( data: Record<string, any>[], fileType: "csv" | "json"): DataPoint[] => {
  if (fileType === "csv") {
    return data.map((row) => ({
      latitude: parseFloat(String(row.latitude)),
      longitude: parseFloat(String(row.longitude)),
      properties: { ...row },
      geojson: JSON.stringify({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(String(row.longitude)),
            parseFloat(String(row.latitude)),
          ],
        },
        properties: { ...row },
      }),
      coverage: row.coverage ? parseString(row.coverage) : null,
    }));
  } else if (fileType === "json") {
    if ("features" in data) {
      // @ts-ignore
      return data.features.map((feature: any) => ({
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: feature.properties,
        geojson: JSON.stringify(feature),
      }));
    } else {
      return data.map((item: any) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        properties: { ...item },
        geojson: JSON.stringify({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.longitude, item.latitude],
          },
          properties: { ...item },
        }),
      }));
    }
  }
  return [];
};

export const transformIsochroneToGeometry = (isochrone: any): Geometry | null => {
  if (!isochrone || !isochrone.polygons || !Array.isArray(isochrone.polygons)) {
    console.error("Invalid isochrone data:", isochrone);
    return null;
  }

  // Return just the first polygon's geometry (assuming we want the main isochrone)
  return {
    type: "Polygon",
    coordinates: isochrone.polygons[0].geometry.coordinates,
  };
};

// Function to get colors sequentially from a fixed set of 13 colors
export const getSequentialColor = (): [number, number, number] => {
  const colors: [number, number, number][] = [
    [235, 159, 239], // Pink/Purple
    [3, 37, 78],     // Navy Blue
    [245, 213, 71],  // Yellow
    [219, 48, 105],  // Magenta
    [247, 92, 3],    // Orange
    [4, 167, 119],   // Teal
    [214, 159, 126], // Tan
    [135, 0, 88],    // Burgundy
    [200, 214, 175], // Sage Green
    [105, 56, 92],   // Plum
    [62, 146, 204],  // Sky Blue
    [255, 99, 71],   // Tomato Red
    [0, 191, 255]    // Deep Sky Blue
  ];

  // Get the current index or initialize to 0
  const currentIndex = getSequentialColor.currentIndex || 0;
  
  // Get the color at the current index
  const color = colors[currentIndex];
  
  // Update the index for the next call, cycling back to 0 after reaching the end
  getSequentialColor.currentIndex = (currentIndex + 1) % colors.length;
  
  return color;
};

// Add a static property to track the current index
getSequentialColor.currentIndex = 0;