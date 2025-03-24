// components/MapComponent.tsx
import * as React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  AttributionControl,
  Map,
  useControl,
  MapRef,
  FullscreenControl,
  NavigationControl,
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
  toggleBuildingShow,
  toggleRegionShow,
} from "@/store/mapSlice";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Progress, message } from "antd"; 
import Image from "next/image";
import bkoiLogo from "../../app/images/bkoi-img.png";
import { PickingInfo } from "@deck.gl/core";
import Papa from "papaparse";
import { getRandomColor, getSequentialColor, transformIsochroneToGeometry } from "@/utils/localUtils";
import { IsochroneData, PopulationPoint, HoverInfo, DataPoint } from "@/types/mapTypes";
import { TbHexagon3D } from "react-icons/tb";
import MapControlButton from "./MapControlButton";
import { FaEye, FaEyeSlash, FaCalculator } from "react-icons/fa";
import { HeatMapOutlined } from "@ant-design/icons";
import * as turf from '@turf/turf';

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
  const isShowRegion = useSelector((state: RootState) => state.map.isShowRegion);
  const isShowCoveragePercetage = useSelector((state: RootState) => state.map.isShowCoveragePercetage);

  // Local States
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isochrones, setIsochrones] = useState<IsochroneData[]>([]);
  const [progress, setProgress] = useState(0);
  const [isochronesCalculated, setIsochronesCalculated] = useState(false);
  const [isochroneLayers, setIsochroneLayers] = useState<any[]>([]);
  const [populationPoints, setPopulationPoints] = useState<[number, number][]>([]);
  const [is3DMode, setIs3DMode] = useState(false);
  const [provincePolygons, setProvincePolygons] = useState<any[]>([]);
  const [coverageStats, setCoverageStats] = useState<{
    provinceName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
    timeLimit: number;
  }[]>([]);
  const [showCoverageStats, setShowCoverageStats] = useState(false);
  const [suggestedHubStats, setSuggestedHubStats] = useState<Array<{
    provinceName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
    hubCount: number;
    timestamp: number;
  }>>([]);

  // Toggle night and white modes
  const mapStyle = isNightMode
    ? `https://map.barikoi.com/styles/barikoi-dark-mode/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`
    : `https://map.barikoi.com/styles/planet-liberty/style.json?key=${process.env.NEXT_PUBLIC_BARIKOI_API_KEY}`;
  
  // Toggle 2D and 3D mode
  const handleToggle3DMode = () => {
    setIs3DMode(!is3DMode);
    const map = mapRef.current;
    if (map) {
      map.setPitch(is3DMode ? 60 : 0);
    }
  }

  // Function to merge city polygons into province polygons
  const mergeProvincePolygons = (data: any) => {
    const provinceMap = new window.Map<string, any>();

    data.features.forEach((feature: any) => {
      const provinceName = feature.properties.NAME_1;
      if (!provinceMap.has(provinceName)) {
        // Assign a random color to each region
        const color = getSequentialColor();
        provinceMap.set(provinceName, {
          type: "Feature",
          properties: {
            name: provinceName,
            color: color 
          },
          geometry: {
            type: "MultiPolygon",
            coordinates: []
          }
        });
      }
      
      const provinceFeature = provinceMap.get(provinceName);
      provinceFeature.geometry.coordinates.push(
        ...feature.geometry.coordinates
      );
    });

    return Array.from(provinceMap.values());
  };

  // Load and process the province data
  useEffect(() => {
    const loadProvinceData = async () => {
      try {
        const response = await fetch('/gadm41_SAU_2.json');
        const data = await response.json();
        const mergedPolygons = mergeProvincePolygons(data);
        setProvincePolygons(mergedPolygons);
      } catch (error) {
        console.error('Error loading province data:', error);
      }
    };

    loadProvinceData();
  }, []);

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasUploadedRef = useRef(false); // Track if upload has been performed

  useEffect(() => {
    if (showIsochrones) {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      hasUploadedRef.current = false; // Reset upload tracking

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
                      }&reverse_flow=true`,
                      { signal: abortControllerRef.current?.signal }
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
                    if (error.name !== 'AbortError') {
                      console.error("Error fetching isochrone:", error);
                    }
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

              // Only upload if it hasn't been done yet
              if (!hasUploadedRef.current) {
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

                // Upload processed file with AbortController
                const uploadResponse = await fetch(
                  "http://202.72.236.166:8000/upload_hub_locations/",
                  {
                    method: "POST",
                    body: formData,
                    // signal: abortControllerRef.current?.signal
                  }
                );

                if (uploadResponse.ok) {
                  hasUploadedRef.current = true; // Mark as uploaded
                  message.success({
                    content: "Coverage calculated and file processed successfully", 
                    key: "covergae-calculte", 
                    duration: 15
                  });
                }
              }
            }
          }
          setIsochronesCalculated(true);
          
          // Calculate coverage stats after isochrones are calculated
          calculateCoverageStats();
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error in fetchIsochrones:", error);
            message.error("Failed to process coverage data");
          }
        } finally {
          setProgress(0);
          dispatch(resetIsochrones());
          dispatch(setCalculatingCoverage(false));
        }
      };

      // Add a debounce delay to prevent rapid successive calls
      const debounceTimeout = setTimeout(fetchIsochrones, 500);

      // Cleanup function
      return () => {
        clearTimeout(debounceTimeout);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
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
  // useEffect(() => {
  //   // When datasets change, check if a new one was added
  //   if (datasets.length > 0 && !showIsochrones) {
  //     const latestDataset = datasets[datasets.length - 1];
  //     // Only fly if the dataset has data
  //     if (latestDataset && latestDataset.data && latestDataset.data.length > 0) {
  //       // Add a small delay to ensure the map is ready
  //       setTimeout(() => {
  //         flyToHighestDensityArea(latestDataset);
  //       }, 1000);
  //     }
  //   }
  // }, [datasets.length]); // Only trigger when the number of datasets changes

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
    ...(isShowRegion ? [
      new GeoJsonLayer({
        id: 'province-polygons',
        data: {
          type: 'FeatureCollection',
          features: provincePolygons
        },
        // @ts-ignore
        getFillColor: (d) => {
          return [...d.properties.color, 100]; 
        },
        // @ts-ignore
        getLineColor: (d) => {
          return [...d.properties.color, 200]; 
        },
        getLineWidth: 8,
        pickable: true,
        stroked: true,
        filled: true,
        wireframe: true,
        // @ts-ignore
        onHover: (info: any) => {
          if (info.object) {
            setHoverInfo({
              object: info.object,
              x: info.x,
              y: info.y,
              // @ts-ignore
              type: "province"
            });
          } else {
            setHoverInfo(null);
          }
        }
      })
    ] : []),
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

  // Add useEffect to fly to suggested hubs when they're loaded
  useEffect(() => {
    if (suggestedHubs && suggestedHubs.length > 0 && mapRef.current) {
      // Calculate the center of all suggested hubs
      const sumLon = suggestedHubs.reduce((sum, hub) => sum + hub.longitude, 0);
      const sumLat = suggestedHubs.reduce((sum, hub) => sum + hub.latitude, 0);
      const centerLon = sumLon / suggestedHubs.length;
      const centerLat = sumLat / suggestedHubs.length;
      
      console.log(`Flying to suggested hubs center: ${centerLat}, ${centerLon}`);
      
      // Add a small delay to ensure the map is ready
      setTimeout(() => {
        if (mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [centerLon, centerLat],
              zoom: 11,
              duration: 2000,
              essential: true
            });
          } catch (error) {
            console.error("Error during flyTo suggested hubs:", error);
          }
        }
      }, 500);
      
      // Calculate suggested hub stats when hubs are loaded
      calculateSuggestedHubStats();
    }
  }, [suggestedHubs]);

  // Calculate total country coverage 
  const calculateCoverageStats = useCallback(async () => {
    if (!provincePolygons.length || !datasets.length) return;

    try {
      // Step 1: Calculate the total area of the country
      let totalCountryArea = 0;
      provincePolygons.forEach(province => {
        try {
          const provinceFeature:any = {
            type: 'Feature',
            properties: province.properties,
            geometry: province.geometry
          };
          totalCountryArea += turf.area(provinceFeature);
        } catch (error) {
          console.error(`Error calculating area for province ${province.properties.name}:`, error);
        }
      });

      // Step 2: Calculate the total coverage area of the datasets
      let totalCoverageArea = 0;
      const allCoverageFeatures: any[] = [];

      // Create a map to track coverage by region
      const regionCoverage: Record<string, { 
        totalArea: number, 
        coveredArea: number, 
        coveragePercentage: number 
      }> = {};

      // Helper function to check if a name refers to Riyadh (case insensitive)
      const isRiyadh = (name: string) => {
        return name && name.toLowerCase().includes('riyad');
      };

      // First, calculate total area for each region from the GeoJSON data
      try {
        // Assuming you have the GeoJSON data loaded
        const geoJSONData = await fetch('/riyadh_city.json').then(res => res.json());
        
        // Find the Riyadh region in the GeoJSON data
        let riyadhRegionName = null;
        
        geoJSONData.features.forEach(feature => {
          const cityName = feature.properties.NAME_2;
          
          // Check if this is Riyadh (using any spelling variation)
          if (isRiyadh(cityName)) {
            riyadhRegionName = cityName;
            if (!regionCoverage["Riyadh"]) {
              regionCoverage["Riyadh"] = { 
                totalArea: 0, 
                coveredArea: 0, 
                coveragePercentage: 0 
              };
            }
            
            const regionFeature = turf.feature(feature.geometry);
            const regionArea = turf.area(regionFeature);
            regionCoverage["Riyadh"].totalArea += regionArea;
          } else {
            // For other regions, just add to total country area
            if (!regionCoverage[cityName]) {
              regionCoverage[cityName] = { 
                totalArea: 0, 
                coveredArea: 0, 
                coveragePercentage: 0 
              };
            }
            
            const regionFeature = turf.feature(feature.geometry);
            const regionArea = turf.area(regionFeature);
            regionCoverage[cityName].totalArea += regionArea;
          }
        });
        
      } catch (error) {
        console.error("Error processing region data:", error);
      }

      datasets.forEach(dataset => {
        if (dataset.visible) {
          dataset.data.forEach((point: any) => {
            if (point.coverage) {
              try {
                const coverage = typeof point.coverage === 'string' 
                  ? JSON.parse(point.coverage) 
                  : point.coverage;

                if (coverage && coverage.coordinates) {
                  const coverageFeature = turf.polygon(coverage.coordinates);
                  allCoverageFeatures.push(coverageFeature);
                  
                  // Calculate area
                  const coverageArea = turf.area(coverageFeature);
                  totalCoverageArea += coverageArea;
                  
                  // Check if this point is in Riyadh
                  // We'll use the City field from the original data
                  const originalPoint = dataset.originalFile.find(
                    (op: any) => 
                      op.latitude === point.latitude && 
                      op.longitude === point.longitude
                  );

                  if (originalPoint && isRiyadh(originalPoint.properties.City)) {
                    // Add to Riyadh region
                    if (!regionCoverage["Riyadh"]) {
                      regionCoverage["Riyadh"] = { 
                        totalArea: 0, 
                        coveredArea: 0, 
                        coveragePercentage: 0 
                      };
                    }
                    regionCoverage["Riyadh"].coveredArea += coverageArea;
                  }
                }
              } catch (error) {
                console.error("Error parsing coverage:", error);
              }
            } else {
              // Create default coverage for points without coverage data
              if (point.latitude && point.longitude) {
                const center = [parseFloat(point.longitude), parseFloat(point.latitude)];
                const radius = 5; // 5 kilometers
                const options = { steps: 64, units: 'kilometers' as turf.Units };
                const circle = turf.circle(center, radius, options);
                allCoverageFeatures.push(circle);
                
                const coverageArea = turf.area(circle);
                totalCoverageArea += coverageArea;
                
                // Check if this point is in Riyadh
                const originalPoint = dataset.originalFile.find(
                  (op: any) => 
                    op.latitude === point.latitude && 
                    op.longitude === point.longitude
                );
                
                if (originalPoint && isRiyadh(originalPoint.City)) {
                  // Add to Riyadh region
                  if (!regionCoverage["Riyadh"]) {
                    regionCoverage["Riyadh"] = { 
                      totalArea: 0, 
                      coveredArea: 0, 
                      coveragePercentage: 0 
                    };
                  }
                  regionCoverage["Riyadh"].coveredArea += coverageArea;
                }
              }
            }
          });
        }
      });

      // Calculate percentages for each region
      Object.entries(regionCoverage).forEach(([regionName, region]) => {
        if (region.totalArea > 0) {
          region.coveragePercentage = (region.coveredArea / region.totalArea) * 100;
        }
      });

      // Step 3: Calculate the percentage of coverage
      const coveragePercentage = (totalCoverageArea / totalCountryArea) * 100;

      // Step 4: Update the stats with the total coverage and Riyadh only
      // Create a new stat entry with the current time limit
      const newStat = {
        provinceName: "Riyadh",
        totalArea: regionCoverage["Riyadh"]?.totalArea || 0,
        coveredArea: regionCoverage["Riyadh"]?.coveredArea || 0,
        coveragePercentage: regionCoverage["Riyadh"]?.coveragePercentage || 0,
        timeLimit: timeLimit
      };

      // Update the stats array - remove any existing entry with the same time limit
      setCoverageStats(prevStats => {
        // Filter out any existing stats with the same time limit
        const filteredStats = prevStats.filter(stat => stat.timeLimit !== timeLimit);
        // Add the new stat
        return [...filteredStats, newStat];
      });
      
      setShowCoverageStats(true);
    } catch (error) {
      console.error("Error calculating coverage stats:", error);
      message.error("Error calculating coverage statistics");
    }
  }, [datasets, provincePolygons, timeLimit]);
  
  // Add this function to calculate suggested hub coverage stats
  const calculateSuggestedHubStats = useCallback(async () => {
    if (!suggestedHubs || suggestedHubs.length === 0) return;
    
    try {
      let totalCoveredArea = 0;
      
      // Calculate the total coverage area from suggested hubs
      suggestedHubs.forEach(hub => {
        if (hub.coverage) {
          try {
            const coverage = typeof hub.coverage === 'string' 
              ? JSON.parse(hub.coverage) 
              : hub.coverage;
              
            if (coverage && coverage.coordinates) {
              const coverageFeature = turf.polygon(coverage.coordinates);
              const coverageArea = turf.area(coverageFeature);
              totalCoveredArea += coverageArea;
            }
          } catch (error) {
            console.error("Error parsing suggested hub coverage:", error);
          }
        }
      });
      
      // Calculate Riyadh area using the same method as calculateCoverageStats
      let riyadhArea = 0;
      try {
        // Assuming you have the GeoJSON data loaded
        const geoJSONData = await fetch('/riyadh_city.json').then(res => res.json());
        
        // Find the Riyadh region in the GeoJSON data
        geoJSONData.features.forEach(feature => {
          const cityName = feature.properties.NAME_2;
          
          // Check if this is Riyadh (using any spelling variation)
          if (cityName && cityName.toLowerCase().includes('riyad')) {
            const regionFeature = turf.feature(feature.geometry);
            const regionArea = turf.area(regionFeature);
            riyadhArea += regionArea;
          }
        });
      } catch (error) {
        console.error("Error processing region data:", error);
      }
      
      // Calculate coverage percentage
      const coveragePercentage = riyadhArea > 0 ? (totalCoveredArea / riyadhArea) * 100 : 0;
      
      // Create a new stat entry with the current timestamp
      const newStat = {
        provinceName: "Riyadh",
        totalArea: riyadhArea,
        coveredArea: totalCoveredArea,
        coveragePercentage: coveragePercentage,
        hubCount: suggestedHubs.length,
        timestamp: Date.now()
      };
      
      // Update state with the calculated stats - remove any existing entry with the same hub count
      setSuggestedHubStats(prevStats => {
        // Filter out any existing stats with the same hub count
        const filteredStats = prevStats.filter(stat => stat.hubCount !== suggestedHubs.length);
        // Add the new stat
        return [...filteredStats, newStat];
      });
      
    } catch (error) {
      console.error("Error calculating suggested hub stats:", error);
      message.error("Failed to calculate suggested hub coverage statistics");
    }
  }, [suggestedHubs]);

  // Combine both calculations in one function
  const handleCalculateCoverage = useCallback(() => {
    setShowCoverageStats(prev => !prev);
    
    // If we're showing the stats, calculate both regular and suggested hub stats
    if (!showCoverageStats) {
      // First calculate the regular coverage stats
      calculateCoverageStats();
      
      // Then calculate suggested hub stats if available
      if (suggestedHubs && suggestedHubs.length > 0) {
        // Add a small delay to ensure coverage stats are calculated first
        setTimeout(() => {
          calculateSuggestedHubStats();
        }, 100);
      }
    }
  }, [showCoverageStats, calculateCoverageStats, suggestedHubs, calculateSuggestedHubStats]);

  // Update the CoverageStatsPanel to include suggested hub stats
  const CoverageStatsPanel = useMemo(() => {
    if (!showCoverageStats) return null;
    
    // Sort the stats by time limit
    // const sortedStats = [...coverageStats].sort((a, b) => a.timeLimit - b.timeLimit);
    const sortedStats = coverageStats;
    
    // Sort suggested hub stats by timestamp
    // const sortedSuggestedStats = [...suggestedHubStats].sort((a, b) => a.timestamp - b.timestamp);
    const sortedSuggestedStats = suggestedHubStats;
    
    return (
      <div className="absolute top-[260px] right-10 bg-white/90 p-4 rounded-lg shadow-lg z-[1000] max-h-[60vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">Coverage Statistics</h3>
          <button 
            onClick={() => setShowCoverageStats(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        {/* Current Hub Coverage Stats */}
        {sortedStats.length > 0 && (
          <>
            <h4 className="font-semibold text-md mb-2">Current Hub Coverage</h4>
            <table className="w-full text-sm border mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 border-r">Region</th>
                  <th className="text-right py-2 px-3 border-r">Time (min)</th>
                  <th className="text-right py-2 px-3 border-r">Area (km²)</th>
                  <th className="text-right py-2 px-3 border-r">Coverage (km²)</th>
                  <th className="text-right py-2 px-3">Coverage %</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((stat, index) => (
                  <tr key={index} className={index === sortedStats.length - 1 ? "border-b font-bold bg-gray-100" : "border-b"}>
                    <td className="py-2 px-3 border-r">{stat.provinceName}</td>
                    <td className="text-right py-2 px-3 border-r">{stat.timeLimit}</td>
                    <td className="text-right py-2 px-3 border-r">
                      {(stat.totalArea / 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3 border-r">
                      {(stat.coveredArea / 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3">
                      {stat.coveragePercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        
        {/* Suggested Hub Coverage Stats */}
        {sortedSuggestedStats.length > 0 && suggestedHubs && suggestedHubs.length > 0 && (
          <>
            <h4 className="font-semibold text-md mb-2">Suggested Hub Coverage</h4>
            <table className="w-full text-sm border">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 border-r">Region</th>
                  <th className="text-right py-2 px-3 border-r">Hubs</th>
                  <th className="text-right py-2 px-3 border-r">Area (km²)</th>
                  <th className="text-right py-2 px-3 border-r">Coverage (km²)</th>
                  <th className="text-right py-2 px-3">Coverage %</th>
                </tr>
              </thead>
              <tbody>
                {sortedSuggestedStats.map((stat, index) => (
                  <tr 
                    key={index} 
                    className={index === sortedSuggestedStats.length - 1 ? "border-b font-bold bg-green-50" : "border-b"}
                  >
                    <td className="py-2 px-3 border-r">{stat.provinceName}</td>
                    <td className="text-right py-2 px-3 border-r">{stat.hubCount}</td>
                    <td className="text-right py-2 px-3 border-r">
                      {(stat.totalArea / 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3 border-r">
                      {(stat.coveredArea / 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3">
                      {stat.coveragePercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Comparison section */}
            {sortedStats.length > 0 && sortedSuggestedStats.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-md mb-2">Coverage Comparison</h4>
                <p className="text-sm">
                  <span className="font-medium">Improvement: </span>
                  {(sortedSuggestedStats[sortedSuggestedStats.length - 1].coveragePercentage - 
                    sortedStats[sortedStats.length - 1].coveragePercentage).toFixed(2)}% 
                  {sortedSuggestedStats[sortedSuggestedStats.length - 1].coveragePercentage > 
                    sortedStats[sortedStats.length - 1].coveragePercentage 
                    ? " increase" 
                    : " decrease"} in coverage
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Hub Efficiency: </span>
                  {(sortedSuggestedStats[sortedSuggestedStats.length - 1].coveredArea / 
                    sortedSuggestedStats[sortedSuggestedStats.length - 1].hubCount / 1000000).toFixed(2)} km² per hub
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }, [showCoverageStats, coverageStats, suggestedHubStats, suggestedHubs]);

  // Add this inside your component, before the return statement
  useEffect(() => {
    // Add event listener for the calculateCoverage event
    const handleCalculateCoverage = () => {
      calculateCoverageStats();
    };

    window.addEventListener("calculateCoverage", handleCalculateCoverage);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("calculateCoverage", handleCalculateCoverage);
    };
  }, []); // Make sure to include calculateCoverageStats in the dependency array

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
          <FullscreenControl />
          <NavigationControl position="top-right" />
          <div
            style={typeof window !== 'undefined' && window.screen.width > 350 && { ...Style }}
          >
            <MapControlButton
              title={is3DMode ? "Switch to 3D" : "Switch to 2D"}
              onClick={handleToggle3DMode}
              icon={<TbHexagon3D color="#333333" />}
              isActive={is3DMode}
            />
            <MapControlButton
              title={isShowBuilding ? "Hide Buildings" : "Show Buildings"}
              onClick={() => dispatch(toggleBuildingShow())}
              icon={isShowBuilding ? <FaEyeSlash  color="#333333" /> : <FaEye  color="#333333" />}
              isActive={isShowBuilding}
            />
            <MapControlButton
              title={isShowRegion ? "Hide Regions" : "Show Regions"}
              onClick={() => dispatch(toggleRegionShow())}
              icon={ <HeatMapOutlined style={{ color: "#333333" }} /> }
              isActive={isShowRegion}
            />
            <MapControlButton
              title="Calculate Coverage"
              onClick={handleCalculateCoverage}
              icon={<FaCalculator color="#333333" />}
              isActive={showCoverageStats}
            />
          </div>
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
      
      {CoverageStatsPanel}
    </div>
  );
}

export default MapComponent;

const Style = {
  position: 'absolute' as const,
  top: 145,
  right: 10,
  background: 'none',
  zIndex: 9999,
};
