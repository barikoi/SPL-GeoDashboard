//@ts-nocheck
// components/MapComponent.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { AttributionControl, Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL, { ScatterplotLayer, GeoJsonLayer } from "deck.gl";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setHoverInfo, updateDatasetWithIsochrones } from "@/store/mapSlice";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Progress } from "antd"; // Import Ant Design Progress
import Image from "next/image";
import bkoiLogo from "./bkoi-img.png";

const Tooltip = ({ hoveredObject, x, y }: any) => {
  if (!hoveredObject) return null;

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1,
        pointerEvents: "none",
        left: x,
        top: y,
        backgroundColor: "white",
        padding: "8px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <div>
        {Object.entries(hoveredObject.properties || {}).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong> {String(value)}
          </div>
        ))}
      </div>
    </div>
  );
};

const INITIAL_VIEW_STATE = {
  longitude: 46.6364439,
  latitude: 24.8335129,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

// Helper function to transform isochrone data to GeoJSON
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
  const [isochrones, setIsochrones] = useState<
    Array<{ data: any; datasetId: string }>
  >([]);
  const [progress, setProgress] = useState(0);

  // Filter out isochrones that belong to datasets that no longer exist
  useEffect(() => {
    const updatedIsochrones = isochrones.filter((isochrone) =>
      datasets.some((dataset) => dataset.id === isochrone.datasetId)
    );

    if (updatedIsochrones.length !== isochrones.length) {
      setIsochrones(updatedIsochrones);
    }
  }, [datasets]);

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
                // Transform to just the geometry and store it
                const geometry = transformIsochroneToGeometry(isochroneData);
                updatedData.push({
                  ...point,
                  isochrones: geometry ? JSON.stringify(geometry) : null, // Store just the geometry
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
        setTimeout(() => setProgress(0), 1000);
      };

      fetchIsochrones();
    }
  }, [showIsochrones]);

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
          onHover: (info: any) => {
            dispatch(setHoverInfo(info.object ? info : null));
          },
        }),
      ]),
    ...(showIsochrones
      ? isochrones
          .map((isochrone, index) => {
            const dataset = datasets.find((d) => d.id === isochrone.datasetId);
            // Skip if dataset is not found or not visible
            if (!dataset || !dataset.visible) return null;

            return new GeoJsonLayer({
              id: `isochrone-layer-${index}`,
              data: transformIsochroneToGeometry(isochrone.data),
              getFillColor: [...dataset.color, 100],
              getLineColor: dataset.strokedColor,
              getLineWidth: 2,
            });
          })
          .filter(Boolean)
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
