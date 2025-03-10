// components/MapComponent.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { AttributionControl, Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL, { ScatterplotLayer, GeoJsonLayer } from "deck.gl";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { updateDatasetWithIsochrones, resetIsochrones } from "@/store/mapSlice";
import type { Geometry } from "geojson";
import { Progress } from "antd"; // Import Ant Design Progress
import Image from "next/image";
import bkoiLogo from "./bkoi-img.png";
import { PickingInfo } from "@deck.gl/core";
import Papa from "papaparse";
import { message } from "antd";

const INITIAL_VIEW_STATE = {
  longitude: 46.6364439,
  latitude: 24.8335129,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

// Add proper type for the isochrone data
interface IsochroneData {
  data: {
    polygons: Array<{
      geometry: {
        coordinates: number[][][];
      };
    }>;
  };
  datasetId: string;
}

// Add this type definition
interface DataPoint {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  geojson: string;
  coverage?: any; // Coverage polygon data
}

// Add this interface at the top with other interfaces
interface PopulationPoint {
  Latitude: number;
  Longitude: number;
  CityNameEn: string;
}

// Helper function to transform isochrone data to GeoJSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformIsochroneToGeometry = (isochrone: any): Geometry | null => {
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

// Update the hover info type
interface HoverInfo {
  object: any;
  x: number;
  y: number;
  type: "point" | "hexagon" | "suggested";
}

function MapComponent() {
  const dispatch = useDispatch();
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const showIsochrones = useSelector(
    (state: RootState) => state.map.showIsochrones
  );
  const suggestedHubs = useSelector(
    (state: RootState) => state.map.suggestedHubs
  );
  const populationLayerVisible = useSelector(
    (state: RootState) => state.map.populationLayerVisible
  );

  // Remove the redux hover info and use local state
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isochrones, setIsochrones] = useState<IsochroneData[]>([]);
  const [progress, setProgress] = useState(0);
  const [isochronesCalculated, setIsochronesCalculated] = useState(false);
  const [isochroneLayers, setIsochroneLayers] = useState<any[]>([]);
  const [populationPoints, setPopulationPoints] = useState<[number, number][]>(
    []
  );
  const isNightMode = useSelector((state: RootState) => state.map.isNightMode);

  const mapStyle = isNightMode
    ? `https://map.barikoi.com/styles/barikoi-dark-mode/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`
    : `https://map.barikoi.com/styles/planet-liberty/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`;
  // Update the tooltip handler
  const getTooltip = (info: PickingInfo) => {
    const { object, x, y } = info;

    if (!object) {
      setHoverInfo(null);
      return null;
    }

    if (object.points && info.layer.id === "population-hexagon") {
      setHoverInfo({ object, x, y, type: "hexagon" });
      return `
        Population Density
        Count: ${object.points.length} points
      `;
    } else if (object.properties) {
      // For point layers, only show the dataset name
      const datasetName =
        datasets.find((d) => d.data.some((point) => point === object))?.name ||
        "Unknown Dataset";

      setHoverInfo({
        object: { properties: { name: datasetName } },
        x,
        y,
        type: "point",
      });
      return datasetName;
    }
    return null;
  };

  // Fix useEffect dependencies
  useEffect(() => {
    const updatedIsochrones = isochrones.filter((isochrone) =>
      datasets.some((dataset) => dataset.id === isochrone.datasetId)
    );

    if (updatedIsochrones.length !== isochrones.length) {
      setIsochrones(updatedIsochrones);
    }
  }, [datasets, isochrones]);

  // Fix useEffect dependencies for fetchIsochrones
  useEffect(() => {
    if (showIsochrones) {
      const fetchIsochrones = async () => {
        try {
          for (const dataset of datasets) {
            if (dataset.visible) {
              const updatedData = await Promise.all(
                dataset.data.map(async (point) => {
                  try {
                    const response = await fetch(
                      `https://gh.bmapsbd.com/sau/isochrone?point=${
                        point.latitude
                      },${point.longitude}&profile=foot&time_limit=${
                        timeLimit * 60
                      }&reverse_flow=true`
                    );

                    if (!response.ok) {
                      throw new Error(`API Error: ${response.statusText}`);
                    }

                    const isochroneData = await response.json();
                    const geometry =
                      transformIsochroneToGeometry(isochroneData);

                    return {
                      ...point,
                      isochrones: geometry ? JSON.stringify(geometry) : null,
                    };
                  } catch (error) {
                    console.error("Error fetching isochrone:", error);
                    return point;
                  }
                })
              );

              // Update local state with isochrones
              dispatch(
                updateDatasetWithIsochrones({
                  datasetId: dataset.id,
                  updatedData,
                })
              );

              // Create CSV with coverage data
              const csvData = updatedData.map((point) => ({
                ...point.properties,
                latitude: point.latitude,
                longitude: point.longitude,
                coverage: point.isochrones,
              }));

              // Create form data for upload
              const formData = new FormData();
              const csvBlob = new Blob([Papa.unparse(csvData)], {
                type: "text/csv",
              });
              formData.append("file", csvBlob, dataset.name);

              // Upload processed file
              const uploadResponse = await fetch(
                "http://202.72.236.166:8000/upload_hub_locations/",
                {
                  method: "POST",
                  body: formData,
                }
              );

              if (!uploadResponse.ok) {
                throw new Error("Failed to upload processed file");
              }

              message.success(
                "Coverage calculated and file processed successfully"
              );
            }
          }
          setIsochronesCalculated(true);
        } catch (error) {
          console.error("Error in fetchIsochrones:", error);
          message.error("Failed to process coverage data");
        } finally {
          setProgress(0);
          dispatch(resetIsochrones());
        }
      };

      fetchIsochrones();
    }
  }, [showIsochrones, datasets, dispatch, timeLimit]);

  // Add useEffect to listen for population file changes
  useEffect(() => {
    const handlePopulationData = (data: PopulationPoint[]) => {
      const points = data
        .filter((row) => row.Latitude && row.Longitude)
        .map((row) => [
          parseFloat(String(row.Longitude)),
          parseFloat(String(row.Latitude)),
        ]);
      setPopulationPoints(points);
    };

    // Subscribe to population data updates
    window.addEventListener("populationData", ((e: CustomEvent) => {
      handlePopulationData(e.detail);
    }) as EventListener);

    return () => {
      window.removeEventListener("populationData", ((e: CustomEvent) => {
        handlePopulationData(e.detail);
      }) as EventListener);
    };
  }, []);

  const layers = [
    ...datasets
      .filter((dataset) => dataset.visible)
      .flatMap((dataset) => [
        new GeoJsonLayer({
          id: `coverage-layer-${dataset.id}`,
          data: dataset.data
            .filter((d: DataPoint) => d.coverage)
            .map((d: DataPoint) => ({
              type: "Feature",
              geometry: d.coverage,
              properties: {},
            })),
          getFillColor: [...dataset.color, 100],
          getLineColor: dataset.strokedColor,
          getLineWidth: 3,
          pickable: false,
        }),
        new ScatterplotLayer({
          id: `scatterplot-layer-${dataset.id}`,
          data: dataset.data,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: 100,
          getFillColor: [...dataset.color],
          pickable: true,
        }),
      ]),
    ...(isochronesCalculated ? isochroneLayers : []),
    ...(suggestedHubs
      ? [
          new GeoJsonLayer({
            id: "suggested-hubs-coverage",
            data: suggestedHubs.map((hub) => ({
              type: "Feature",
              geometry: JSON.parse(hub.coverage),
              properties: {},
            })),
            getFillColor: isNightMode ? [145, 245, 173] : [251, 75, 78, 80],
            getLineColor: [251, 75, 78, 200],
            getLineWidth: 4,
          }),
          new ScatterplotLayer({
            id: "suggested-hubs-points",
            data: suggestedHubs,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: 150,
            getFillColor: [83, 19, 30, 200],
            pickable: true,
          }),
        ]
      : []),
    populationLayerVisible &&
      // Only show population layer if no suggested hubs
      new HexagonLayer({
        id: "population-hexagon",
        data: populationPoints,
        getPosition: (d) => d,
        radius: 500,
        elevationScale: 20,
        pickable: true,
        extruded: true,
        colorRange: [
          [237, 248, 125], // Light Yellow (Low population)
          [254, 192, 206], // Light Teal
          [227, 135, 158], // Teal
          [209, 131, 201], // Medium Dark Blue
          [139, 95, 191], // Dark Blue
          [100, 58, 113], // Very Dark Blue (High population)
        ],

        coverage: 1,
        upperPercentile: 100,
        material: {
          ambient: 0.64,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [51, 51, 51],
        },
        transitions: {
          elevationScale: 500,
        },
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        onHover: (info: any) => {
          if (info.object) {
            setHoverInfo({
              object: info.object,
              x: info.x,
              y: info.y,
              type: "hexagon",
            });
          } else {
            setHoverInfo(null); // Clear hover info when not hovering
          }
        },
      }),
  ].filter(Boolean);

  return (
    <div className="relative w-full md:w-[78vw] h-[70vh] md:h-screen">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
      >
        <Map
          initialViewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          attributionControl={false}
        >
          <AttributionControl customAttribution="Barikoi" />
        </Map>
      </DeckGL>

      <div className="absolute bottom-2 md:bottom-2 left-2 md:left-2 z-[1000]">
        <Image
          src={bkoiLogo}
          alt="BKOI Logo"
          width={40}
          height={0}
          className="w-8 md:w-[60px]"
        />
      </div>

      {showIsochrones && progress > 0 && progress < 100 && (
        <div className="absolute bottom-4 md:bottom-20 left-1/2 transform -translate-x-1/2 w-[280px] md:w-[300px] bg-white/80 p-2 md:p-4 rounded-lg shadow-md">
          <Progress percent={Math.round(progress)} status="active" />
          <div className="text-center mt-2 text-sm md:text-base">
            {Math.round(progress)}% Complete
          </div>
        </div>
      )}

      {hoverInfo && (
        <div
          className="absolute z-10 pointer-events-none bg-white p-2 md:p-4 rounded-lg shadow-md text-sm md:text-base"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          {hoverInfo.type === "hexagon" ? (
            <div className="space-y-1">
              <div className="font-semibold text-gray-800">
                Population Density
              </div>
              <div>
                <strong>Count:</strong> {hoverInfo.object.count} points
              </div>
            </div>
          ) : (
            <div className="font-medium text-gray-800">
              {hoverInfo.object?.properties?.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MapComponent;
