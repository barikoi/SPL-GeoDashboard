// components/MapComponent.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { AttributionControl, Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL, { ScatterplotLayer, GeoJsonLayer } from "deck.gl";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  setHoverInfo,
  updateDatasetWithIsochrones,
  resetIsochrones,
} from "@/store/mapSlice";
import type { Geometry } from "geojson";
import { Progress } from "antd"; // Import Ant Design Progress
import Image from "next/image";
import bkoiLogo from "./bkoi-img.png";

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

function MapComponent() {
  const dispatch = useDispatch();
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const hoverInfo = useSelector((state: RootState) => state.map.hoverInfo);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const showIsochrones = useSelector(
    (state: RootState) => state.map.showIsochrones
  );
  const [isochrones, setIsochrones] = useState<IsochroneData[]>([]);
  const [progress, setProgress] = useState(0);
  const suggestedHubs = useSelector(
    (state: RootState) => state.map.suggestedHubs
  );
  const [isochronesCalculated, setIsochronesCalculated] = useState(false);
  const [isochroneLayers, setIsochroneLayers] = useState<any[]>([]);

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
        const newIsochrones = [];
        const totalPoints = datasets.reduce(
          (sum, dataset) => sum + (dataset.visible ? dataset.data.length : 0),
          0
        );
        let processedPoints = 0;
        setProgress(0);

        try {
          for (const dataset of datasets) {
            if (dataset.visible) {
              const updatedData = [];
              for (const point of dataset.data) {
                try {
                  const response = await fetch(
                    `https://gh.bmapsbd.com/sau/isochrone?point=${
                      point.latitude
                    },${point.longitude}&profile=foot&time_limit=${
                      timeLimit * 60
                    }&reverse_flow=true`
                  );
                  const isochroneData = await response.json();
                  const geometry = transformIsochroneToGeometry(isochroneData);
                  updatedData.push({
                    ...point,
                    isochrones: geometry ? JSON.stringify(geometry) : null,
                  });
                  newIsochrones.push({
                    data: isochroneData,
                    datasetId: dataset.id,
                  });
                  processedPoints++;
                  setProgress((processedPoints / totalPoints) * 100);
                } catch (error) {
                  console.error("Error fetching isochrone data:", error);
                  updatedData.push(point);
                }
              }
              dispatch(
                updateDatasetWithIsochrones({
                  datasetId: dataset.id,
                  updatedData,
                })
              );
            }
          }
          setIsochrones(newIsochrones);
          setIsochronesCalculated(true);

          // Create isochrone layers
          const newLayers = datasets
            .filter((dataset) => dataset.visible)
            .flatMap((dataset) =>
              dataset.data.some((d: any) => d.isochrones)
                ? [
                    new GeoJsonLayer({
                      id: `isochrone-layer-${dataset.id}`,
                      data: dataset.data
                        .filter((d: any) => d.isochrones)
                        .map((d: any) => ({
                          type: "Feature",
                          geometry: JSON.parse(d.isochrones),
                          properties: {},
                        })),
                      getFillColor: [...dataset.color, 100],
                      getLineColor: dataset.strokedColor,
                      getLineWidth: 2,
                    }),
                  ]
                : []
            );
          setIsochroneLayers(newLayers);

          setTimeout(() => {
            setProgress(0);
            dispatch(resetIsochrones());
          }, 1000);
        } catch (error) {
          console.error("Error in fetchIsochrones:", error);
          setProgress(0);
          dispatch(resetIsochrones());
          setIsochronesCalculated(false);
          setIsochroneLayers([]);
        }
      };

      fetchIsochrones();
    }
  }, [showIsochrones, datasets, dispatch, timeLimit]);

  const layers = [
    ...datasets
      .filter((dataset) => dataset.visible)
      .flatMap((dataset) => [
        new ScatterplotLayer({
          id: `scatterplot-layer-${dataset.id}`,
          data: dataset.data,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: 100,
          getFillColor: [...dataset.color, 200],
          pickable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onHover: (info: any) => {
            dispatch(setHoverInfo(info.object ? info : null));
          },
        }),
      ]),
    ...(isochronesCalculated ? isochroneLayers : []),
    ...(suggestedHubs
      ? [
          // Points layer for suggested hubs
          new ScatterplotLayer({
            id: "suggested-hubs-points",
            data: suggestedHubs,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: 150,
            getFillColor: [83, 19, 30, 200], // Green color for suggested hubs
            pickable: true,
            onHover: (info: any) => {
              dispatch(setHoverInfo(info.object ? info : null));
            },
          }),
          // Coverage polygons layer
          new GeoJsonLayer({
            id: "suggested-hubs-coverage",
            data: suggestedHubs.map((hub) => ({
              type: "Feature",
              geometry: JSON.parse(hub.coverage),
              properties: {}, // Optional metadata
            })),
            getFillColor: [83, 19, 30, 80], // Transparent green
            getLineColor: [83, 19, 30, 200],
            getLineWidth: 4,
          }),
        ]
      : []),
  ];

  return (
    <div className="relative w-full md:w-[78vw] h-[70vh] md:h-screen">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        <Map
          initialViewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`https://map.barikoi.com/styles/planet-liberty/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`}
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
          {Object.entries(hoverInfo.object?.properties || {}).map(
            ([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {String(value)}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default MapComponent;
