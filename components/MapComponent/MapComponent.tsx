// components/MapComponent.tsx
import * as React from "react";
import { useEffect, useState, useRef } from "react";
import {
  AttributionControl,
  Map,
  useControl,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL, { ScatterplotLayer, GeoJsonLayer, DeckProps, HeatmapLayer } from "deck.gl";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import {
  updateDatasetWithIsochrones,
  resetIsochrones,
  setCalculatingCoverage,
} from "@/store/mapSlice";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Progress, message } from "antd"; 
import Image from "next/image";
import bkoiLogo from "../../app/images/bkoi-img.png";
import { PickingInfo } from "@deck.gl/core";
import Papa from "papaparse";
import { transformIsochroneToGeometry } from "@/utils/localUtils";
import { IsochroneData, PopulationPoint, HoverInfo, DataPoint } from "@/types/mapTypes";

const INITIAL_VIEW_STATE = {
  longitude: 46.7941,
  latitude: 24.8343,
  zoom: 10,
  pitch: 60,
  bearing: 20,
};

// Add DeckGLOverlay component
function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function MapComponent() {
  const dispatch = useDispatch();
  const mapRef = useRef<MapRef>(null);

  // Redux States
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const showIsochrones = useSelector((state: RootState) => state.map.showIsochrones);
  const suggestedHubs = useSelector((state: RootState) => state.map.suggestedHubs);
  const populationLayerVisible = useSelector((state: RootState) => state.map.populationLayerVisible);
  const isNightMode = useSelector((state: RootState) => state.map.isNightMode);
  const deckglLayer = useSelector((state: RootState) => state.map.deckglLayer);
  const isShowBuilding = useSelector((state: RootState) => state.map.isShowBuilding);

  // Remove the redux hover info and use local state
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isochrones, setIsochrones] = useState<IsochroneData[]>([]);
  const [progress, setProgress] = useState(0);
  const [isochronesCalculated, setIsochronesCalculated] = useState(false);
  const [isochroneLayers, setIsochroneLayers] = useState<any[]>([]);
  const [populationPoints, setPopulationPoints] = useState<[number, number][]>(
    []
  );

  // Toggle the modes
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
        dispatch(setCalculatingCoverage(true));
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
                    const geometry = transformIsochroneToGeometry(isochroneData);

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

              if (uploadResponse.ok) {
                message.success(
                  "Coverage calculated and file processed successfully"
                );
                
                // Fly to the area with highest data density
                flyToHighestDensityArea(dataset);
              }
            }
          }
          setIsochronesCalculated(true);
          // message.success(
          //   "Coverage calculated and file processed successfully"
          // );
        } catch (error) {
          console.error("Error in fetchIsochrones:", error);
          message.error("Failed to process coverage data");
        } finally {
          setProgress(0);
          dispatch(resetIsochrones());
          dispatch(setCalculatingCoverage(false));
        }
      };

      fetchIsochrones();
    }
  }, [showIsochrones, datasets, dispatch, timeLimit]);

  // Add useEffect to listen for population file changes
  useEffect(() => {
    const handlePopulationData = (data: PopulationPoint[]) => {
      const points:any = data
        .filter((row) => row.Latitude && row.Longitude)
        .map((row) => [
          parseFloat(String(row.Longitude)),
          parseFloat(String(row.Latitude)),
        ]);
        console.log({points})
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

  // Update the useEffect for datasets.length
  useEffect(() => {
    // When datasets change, check if a new one was added
    if (datasets.length > 0 && !showIsochrones) {
      const latestDataset = datasets[datasets.length - 1];
      // Only fly if the dataset has data
      if (latestDataset && latestDataset.data && latestDataset.data.length > 0) {
        // Add a small delay to ensure the map is ready
        setTimeout(() => {
          flyToHighestDensityArea(latestDataset);
        }, 1000);
      }
    }
  }, [datasets.length]); // Only trigger when the number of datasets changes

  console.log({deckglLayer})

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
            getRadius: 30,
            getFillColor: [83, 19, 30, 200],
            pickable: true,
          }),
        ]
      : []),
    populationLayerVisible &&
      // Only show population layer if no suggested hubs
      (deckglLayer === "Hexgonlayer" ? 
      [new HexagonLayer({
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
        // @ts-ignore
        onHover: (info: any) => {
          console.log({ info: info})
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
      })]:
      [new HeatmapLayer({
        id: 'HeatmapLayer',
        data: populationPoints,
        aggregation: 'SUM',
        getPosition: (d: any) => d,
        getWeight: (d: any) => 10,
        radiusPixels: 25,
        pickable: true,
        colorRange: isNightMode ? [
          [237, 248, 125], // Light Yellow (Low population)
          [254, 192, 206], // Light Teal
          [227, 135, 158], // Teal
          [209, 131, 201], // Medium Dark Blue
          [139, 95, 191], // Dark Blue
          [100, 58, 113], // Very Dark Blue (High population)
        ] : [
          [100, 150, 255], // Blue (Low population)
          [0, 128, 255], // Light Blue
          [0, 255, 255], // Cyan
          [255, 0, 0], // Red
          [255, 0, 128], // Pink
          [255, 0, 255] // Magenta (High population)
        ],
        // @ts-ignore
        onHover: (info:any) => {
          if (info.layer.count) {
            setHoverInfo({
              object: { count: info.layer.count},
              x: info.x,
              y: info.y,
              type: "HeatmapLayer"
            });
          } else {
            setHoverInfo(null);
          }
        }
      })])
  ].filter(Boolean);

  // Update the flyToHighestDensityArea function with proper typing
  const flyToHighestDensityArea = (dataset: any) => {
    if (!dataset || !dataset.data || dataset.data.length === 0) {
      return;
    }
    
    if (!mapRef.current) {
      return;
    }
    
    // Create a grid to count points in each cell
    const gridSize = 0.05; // Approximately 5km grid cells
    const grid: Record<string, {count: number, sumLon: number, sumLat: number}> = {};
    
    // Count points in each grid cell
    dataset.data.forEach((point: any) => {
      if (!point.longitude || !point.latitude) {
        return; // Skip invalid points
      }
      
      const gridX = Math.floor(point.longitude / gridSize);
      const gridY = Math.floor(point.latitude / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!grid[gridKey]) {
        grid[gridKey] = {
          count: 0,
          sumLon: 0,
          sumLat: 0,
        };
      }
      
      grid[gridKey].count += 1;
      grid[gridKey].sumLon += point.longitude;
      grid[gridKey].sumLat += point.latitude;
    });
    
    // Find the cell with the highest point density
    let maxCount = 0;
    let densestCell = null;
    
    Object.keys(grid).forEach(key => {
      if (grid[key].count > maxCount) {
        maxCount = grid[key].count;
        densestCell = grid[key];
      }
    });
    
    if (densestCell) {
      // Calculate the center of the densest cell
      const centerLon = densestCell.sumLon / densestCell.count;
      const centerLat = densestCell.sumLat / densestCell.count;
      
      console.log(`Flying to highest density area: ${centerLat}, ${centerLon} with ${maxCount} points`);
      
      // Add a small delay to ensure the map is fully loaded
      setTimeout(() => {
        if (mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [centerLon, centerLat],
              zoom: 12,
              duration: 2000,
              essential: true
            });
          } catch (error) {
            console.error("Error during flyTo:", error);
          }
        } 
      }, 500);
    } else {
      console.log("No dense cell found in the dataset");
    }
  };

  // Building showcasing by mainpuating map layers
  useEffect(() => {
    // Function to toggle building layers visibility
    const toggleBuildingLayers = () => {
      if (!mapRef.current) return;
      
      const map = mapRef.current.getMap();
      
      // List of building layers to toggle
      const buildingLayers = ['building', 'building-commercial', 'building-3d', 'building-3d-commercial', 'building-ada', 'building-metro'];
      
      // Set visibility based on isShowBuilding state (inverse logic as requested)
      const visibility = isShowBuilding ? 'none' : 'visible';
      
      buildingLayers.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          }
        } catch (error) {
          console.error(`Error toggling layer ${layerId}:`, error);
        }
      });
    };

    // Try immediately
    if (mapRef.current && mapRef.current.getMap()) {
      const map = mapRef.current.getMap();
      
      if (map.isStyleLoaded()) {
        toggleBuildingLayers();
      } else {
        // If not loaded, set up event listeners
        map.once('style.load', toggleBuildingLayers);
        map.once('idle', toggleBuildingLayers); // Additional safety
      }
    }
    
    // Set up a delayed attempt as a fallback
    const timeoutId = setTimeout(() => {
      toggleBuildingLayers();
    }, 2000);
    
    return () => {
      clearTimeout(timeoutId);
      // Clean up event listeners if component unmounts
      if (mapRef.current && mapRef.current.getMap()) {
        const map = mapRef.current.getMap();
        map.off('style.load', toggleBuildingLayers);
        map.off('idle', toggleBuildingLayers);
      }
    };
  }, [mapStyle, isShowBuilding]); // Re-run when mapStyle or isShowBuilding changes

  return (
    <div className="relative w-full md:w-[78vw] h-[70vh] md:h-screen">
      {/* <DeckGL 
        // @ts-ignore
        initialViewState={INITIAL_VIEW_STATE} 
        controller 
        layers={layers}
      > */}
        <Map
          initialViewState={INITIAL_VIEW_STATE} 
          // controller 
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          attributionControl={false}
          hash={true}
        >
          <AttributionControl
            customAttribution="Barikoi"
            position="bottom-right"
            style={{ zIndex: 1 }}
          />
          <DeckGLOverlay layers={ layers } />
        </Map>
      {/* </DeckGL> */}
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
          {(hoverInfo.type === "HeatmapLayer" || hoverInfo.type === "hexagon") ? (
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
