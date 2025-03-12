// components/LeftPanel.tsx
"use client";
import React, { ChangeEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addDataset,
  toggleDatasetVisibility,
  removeDataset,
  setTimeLimit,
  showIsochrones,
  updateDatasetWithDownloadable,
  setSuggestedHubs,
  togglePopulationLayer,
  toggleNightMode,
} from "@/store/mapSlice";
import { RootState } from "@/store/store";
import {
  FaTrash,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
} from "react-icons/fa";
import * as Papa from "papaparse";
import Image from "next/image";
import SPL from "./SPL_Logo.webp";
import { Progress, message, Spin, Tooltip } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Switch } from "antd";

// Add proper types for the data
interface DataPoint {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  geojson: string;
  isochrones?: unknown;
  coverage?: any;
}

const getRandomColor = (): [number, number, number] => {
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
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Add this helper function near the top with other helpers
const parseCoverageString = (coverageString: string): any => {
  try {
    return JSON.parse(coverageString);
  } catch (error) {
    console.error("Error parsing coverage string:", error);
    return null;
  }
};

// Update the normalizeData function to include coverage
const normalizeData = (
  data: Record<string, any>[],
  fileType: "csv" | "json"
): DataPoint[] => {
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
      coverage: row.coverage ? parseCoverageString(row.coverage) : null,
    }));
  } else if (fileType === "json") {
    if ("features" in data) {
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

// Update the downloadCSV function with proper types
const downloadCSV = (dataset: {
  data: DataPoint[];
  name: string;
  originalFile: any[];
}) => {
  // Combine the original data with the isochrone data
  const csvData = dataset.originalFile.map((row, index) => ({
    ...row,
    latitude: dataset.data[index].latitude,
    longitude: dataset.data[index].longitude,
    coverage: dataset.data[index].isochrones, // Add isochrone data
  }));

  const csv = Papa.unparse(csvData, { header: true });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${dataset.name.replace(/\.[^/.]+$/, "")}_with_coverage.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const LeftPanel = () => {
  const dispatch = useDispatch();
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [populationFile, setPopulationFile] = useState<File | null>(null);
  const [suggestedHubsCount, setSuggestedHubsCount] = useState<number | null>(
    null
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasCoverageColumn, setHasCoverageColumn] = useState<boolean>(false);

  const isNightMode = useSelector((state: RootState) => state.map.isNightMode);
  const populationLayerVisible = useSelector(
    (state: RootState) => state.map.populationLayerVisible
  );

  const handleToggleMapStyle = (checked: boolean) => {
    dispatch(toggleNightMode()); // Dispatch the action to toggle night mode
  };

  const checkForCoverageColumn = (data: any[]): boolean => {
    if (!data || data.length === 0) return false;
    return Object.keys(data[0]).some((key) => key.toLowerCase() === "coverage");
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) {
      setFileUploaded(false);
      return;
    }

    setFileUploaded(true);
    const file = files[0];

    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        const id = `dataset-${Date.now()}`;
        const color = getRandomColor();
        const strokedColor = color.map((c) => Math.floor(c * 0.6)) as [
          number,
          number,
          number
        ];

        if (file.name.endsWith(".csv")) {
          Papa.parse(content, {
            header: true,
            dynamicTyping: true,
            complete: (result) => {
              const hasCoverage = checkForCoverageColumn(result.data);
              setHasCoverageColumn(hasCoverage);
              const normalizedData = normalizeData(result.data, "csv");
              dispatch(
                addDataset({
                  id,
                  name: file.name,
                  data: normalizedData,
                  visible: true,
                  color,
                  strokedColor,
                  originalFile: result.data,
                })
              );
            },
          });
        } else if (file.name.endsWith(".json")) {
          const jsonData = JSON.parse(content);
          setHasCoverageColumn(false);
          const normalizedData = normalizeData(jsonData, "json");
          dispatch(
            addDataset({
              id,
              name: file.name,
              data: normalizedData,
              visible: true,
              color,
              strokedColor,
              originalFile: jsonData,
            })
          );
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteDataset = (id: string) => {
    dispatch(removeDataset(id));
    // Check if there are any remaining datasets
    const remainingDatasets = datasets.filter((d) => d.id !== id);
    if (remainingDatasets.length === 0) {
      setFileUploaded(false);
      setPopulationFile(null);
    }
  };

  const handlePopulationUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      message.error("Please upload a CSV file for population data.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        Papa.parse(e.target.result as string, {
          header: true,
          complete: (results) => {
            console.log("Population Data:", {
              data: results.data,
              totalRows: results.data.length,
              fields: results.meta.fields,
            });

            // Validate data structure
            const sampleRow = results.data[0];
            console.log("Sample Row:", sampleRow);

            if (!sampleRow?.Latitude || !sampleRow?.Longitude) {
              message.error("File must contain Latitude and Longitude columns");
              return;
            }

            // Dispatch population data to MapComponent
            const event = new CustomEvent("populationData", {
              detail: results.data,
            });
            window.dispatchEvent(event);

            setPopulationFile(file);
            message.success("Population file loaded successfully");
          },
          error: (error) => {
            console.error("Error parsing population file:", error);
            message.error("Failed to parse population file");
          },
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCalculatePopulation = async () => {
    if (!populationFile) {
      message.error("Please upload population file.");
      return;
    }

    // Check if either coverage column exists or isochrones are calculated
    const hasIsochrones = datasets.some((dataset) => dataset.hasIsochrones);
    if (!hasCoverageColumn && !hasIsochrones) {
      message.error("Please calculate walkable coverage first.");
      return;
    }

    setIsCalculating(true);
    setUploadProgress(0);

    try {
      // Get the dataset with coverage (either from file or calculated)
      const dataset = hasCoverageColumn
        ? datasets[0]
        : datasets.find((d) => d.hasIsochrones);
      if (!dataset) {
        throw new Error("No dataset with coverage found");
      }

      // Create CSV with coverage data
      const csvData = dataset.data.map((point) => ({
        ...point.properties,
        latitude: point.latitude,
        longitude: point.longitude,
        coverage: point.coverage ? JSON.stringify(point.coverage) : null,
      }));

      // Create form data for hub locations
      const hubFormData = new FormData();
      const csvBlob = new Blob([Papa.unparse(csvData)], { type: "text/csv" });
      hubFormData.append("file", csvBlob, dataset.name);

      // Upload hub locations with coverage
      const hubResponse = await fetch(
        "http://202.72.236.166:8000/upload_hub_locations/",
        {
          method: "POST",
          body: hubFormData,
          headers: {
            Accept: "*/*",
          },
          mode: "cors",
        }
      );

      if (!hubResponse.ok) throw new Error("Hub locations upload failed.");
      setUploadProgress(33);

      // Upload population file
      const populationFormData = new FormData();
      populationFormData.append("file", populationFile);

      const populationResponse = await fetch(
        "http://202.72.236.166:8000/upload_population/",
        {
          method: "POST",
          body: populationFormData,
          headers: {
            Accept: "*/*",
          },
          mode: "cors",
        }
      );

      if (!populationResponse.ok) throw new Error("Population upload failed.");
      setUploadProgress(66);

      // Calculate hubs
      const calculateResponse = await fetch(
        "http://202.72.236.166:8000/calculate_hubs/?radius=2000",
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!calculateResponse.ok) throw new Error("Hub calculation failed.");
      setUploadProgress(100);

      message.success("Population coverage analysis completed successfully.");
    } catch (error) {
      console.error("Error:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to calculate population coverage"
      );
    } finally {
      setIsCalculating(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleGetSuggestedHubs = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        "http://202.72.236.166:8000/suggested_hubs/",
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get suggested hubs");

      const data = await response.json();

      if (data.message === "success") {
        dispatch(setSuggestedHubs(data.suggested_hubs));
        dispatch(togglePopulationLayer(false));
        setSuggestedHubsCount(data.suggested_hubs.length);
        message.success("Successfully loaded suggested hubs");
      }
    } catch (error) {
      console.error("Error getting suggested hubs:", error);
      message.error("Failed to get suggested hubs");
      setSuggestedHubsCount(null);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Change this condition
  const showPopulationSection = datasets.some((dataset) => dataset.visible);

  return (
    <div
      className={`w-full md:w-[22vw] h-[50vh] md:h-screen p-3 md:p-4 z-10 shadow-xl overflow-y-auto ${
        isNightMode
          ? "bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100" // Night mode colors
          : "bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800" // Day mode colors
      }`}
    >
      {/* Header Section - more compact */}
      <div className="flex items-center mb-3">
        <Image
          src={SPL}
          alt="SPL Logo"
          width={32}
          height={0}
          className="w-6 md:w-12 rounded-lg shadow-md"
        />
        <h1
          className={`${
            !isNightMode ? "text-gray-900" : "text-gray-100"
          } md:text-lg font-bold ml-2`}
        >
          GeoDashboard
        </h1>
      </div>

      {/* Night Mode Toggle Button */}
      <div
        className={`mb-4 p-3 rounded-lg shadow-sm ${
          isNightMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs md:text-sm font-semibold ${
              isNightMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            {isNightMode ? "Night Mode" : "Day Mode"}
          </span>
          <Switch
            checked={isNightMode}
            onChange={handleToggleMapStyle}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </div>
      </div>

      {/* Step 1: More compact padding and text */}
      <div
        className={`mb-4 p-3 rounded-lg shadow-sm ${
          isNightMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <h2
          className={`text-xs md:text-sm font-semibold mb-2 ${
            isNightMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Upload Hub Locations
        </h2>
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleFileChange}
          className={`w-full p-1.5 border-2 border-dashed rounded-lg mb-2 hover:border-blue-500 transition-colors cursor-pointer text-xs ${
            isNightMode
              ? "bg-gray-600 border-gray-500 text-gray-100"
              : "bg-white border-gray-300 text-gray-800"
          }`}
        />

        {/* Dataset list with download options */}
        {fileUploaded && (
          <div className="mb-3">
            <h3
              className={`text-xs font-medium mb-1.5 ${
                isNightMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Uploaded Datasets:
            </h3>
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`flex items-center justify-between mb-1.5 p-1.5 rounded-lg ${
                  isNightMode ? "bg-gray-600" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      dispatch(toggleDatasetVisibility(dataset.id))
                    }
                    className={`mr-2 ${
                      isNightMode ? "text-gray-300" : "text-gray-500"
                    } hover:text-blue-500 transition-colors`}
                  >
                    {dataset.visible ? (
                      <FaEye size={14} />
                    ) : (
                      <FaEyeSlash size={14} />
                    )}
                  </button>
                  <div
                    className="w-3 h-3 mr-2 rounded-full shadow-inner"
                    style={{
                      backgroundColor: `rgb(${dataset.color.join(",")})`,
                    }}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isNightMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {dataset.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip title="Delete Dataset">
                    <button
                      onClick={() => handleDeleteDataset(dataset.id)}
                      className={`${
                        isNightMode ? "text-gray-300" : "text-gray-500"
                      } hover:text-red-500 transition-colors`}
                    >
                      <FaTrash size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip
                    title={
                      dataset.hasIsochrones
                        ? "Download Dataset with Coverage"
                        : "Calculate coverage first"
                    }
                  >
                    <button
                      onClick={() => downloadCSV(dataset)}
                      className={`${
                        isNightMode ? "text-gray-300" : "text-gray-500"
                      } transition-colors ${
                        dataset.hasIsochrones
                          ? "hover:text-blue-500"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!dataset.hasIsochrones}
                    >
                      <FaDownload size={14} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: More compact dataset list and controls */}
      {fileUploaded && !hasCoverageColumn && (
        <div
          className={`mb-4 p-3 rounded-lg shadow-sm ${
            isNightMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <h2
            className={`text-xs md:text-sm font-semibold mb-2 ${
              isNightMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Calculate Walkable Coverage
          </h2>

          {/* Walking time input and calculate button */}
          <div className="mb-2">
            <label
              className={`block text-xs font-medium mb-1 ${
                isNightMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Walking Time (min):
              <Tooltip title="Maximum walking time from each point. For example, in 10 minutes, you can cover a certain distance from each point.">
                <span>
                  <FaInfoCircle
                    className={`inline ml-1 ${
                      isNightMode ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={12}
                  />
                </span>
              </Tooltip>
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => dispatch(setTimeLimit(Number(e.target.value)))}
              min="1"
              max="60"
              className={`w-full p-1.5 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs ${
                isNightMode
                  ? "bg-gray-600 border-gray-500 text-gray-100"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
              placeholder="1-60 minutes"
            />
          </div>

          <button
            onClick={() => dispatch(showIsochrones())}
            className={`w-full py-1.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs font-medium flex items-center justify-center`}
          >
            Calculate Walkable Coverage
          </button>
        </div>
      )}

      {/* Step 3: More compact population analysis section */}
      {
        <div
          className={`mb-4 p-3 rounded-lg shadow-sm ${
            isNightMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <h2
            className={`text-xs md:text-sm font-semibold mb-2 ${
              isNightMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Population Coverage
          </h2>

          <div className="mb-2">
            <input
              type="file"
              accept=".csv"
              onChange={handlePopulationUpload}
              className="hidden"
              id="population-upload"
              disabled={isCalculating}
            />
            <label
              htmlFor="population-upload"
              className={`flex items-center px-2.5 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ${
                isCalculating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <UploadOutlined className="mr-1.5" />
              Select Population File
            </label>
            {populationFile && (
              <div
                className={`mt-1 text-xs ${
                  isNightMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Selected: {populationFile.name}
              </div>
            )}
          </div>

          {populationFile && (
            <div
              className={`flex items-center justify-between mt-2 mb-2 p-1.5 rounded-lg ${
                isNightMode ? "bg-gray-600" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => dispatch(togglePopulationLayer())}
                  className={`mr-2 ${
                    isNightMode ? "text-gray-300" : "text-gray-500"
                  } hover:text-blue-500 transition-colors`}
                >
                  {populationLayerVisible ? (
                    <FaEye size={14} />
                  ) : (
                    <FaEyeSlash size={14} />
                  )}
                </button>
                <div
                  className="w-3 h-3 mr-2 rounded-full shadow-inner"
                  style={{
                    backgroundColor: "rgb(139, 95, 191)",
                  }}
                />
                <span
                  className={`text-xs font-medium ${
                    isNightMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Population Density
                </span>
              </div>
            </div>
          )}

          {
            <button
              onClick={handleCalculatePopulation}
              disabled={
                isCalculating ||
                !populationFile ||
                (!hasCoverageColumn && !datasets.some((d) => d.hasIsochrones))
              }
              className={`w-full py-1.5 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs font-medium ${
                isCalculating ||
                !populationFile ||
                (!hasCoverageColumn && !datasets.some((d) => d.hasIsochrones))
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isCalculating ? (
                <div className="flex items-center justify-center">
                  <Spin className="mr-1.5" size="small" />
                  Calculating...
                </div>
              ) : !fileUploaded ? (
                "Upload Hub Locations"
              ) : !hasCoverageColumn &&
                !datasets.some((d) => d.hasIsochrones) ? (
                "Calculate Walkable Coverage"
              ) : !populationFile ? (
                "Upload Population File"
              ) : (
                "Calculate Population Coverage"
              )}
            </button>
          }

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <Progress
                percent={Math.round(uploadProgress)}
                size="small"
                status="active"
              />
            </div>
          )}
        </div>
      }

      {/* Suggested Hubs Section - more compact */}
      {
        <div
          className={`p-3 rounded-lg shadow-sm ${
            isNightMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <button
            onClick={handleGetSuggestedHubs}
            disabled={isLoadingSuggestions}
            className={`w-full py-1.5 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-xs font-medium ${
              isLoadingSuggestions ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center justify-center space-x-1.5">
              <span>Get Suggested Hubs</span>
              {isLoadingSuggestions && <Spin size="small" />}
            </div>
          </button>

          {suggestedHubsCount !== null && (
            <div
              className={`mt-2 p-1.5 rounded-lg text-xs text-center ${
                isNightMode
                  ? "bg-purple-800 border-purple-700 text-purple-100"
                  : "bg-purple-50 border-purple-200 text-purple-700"
              }`}
            >
              Found {suggestedHubsCount} suggested hub
              {suggestedHubsCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      }
    </div>
  );
};

export default LeftPanel;
