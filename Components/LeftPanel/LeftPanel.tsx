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

// Add proper types for the data
interface DataPoint {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  geojson: string;
}

// Helper function to generate random colors
const getRandomColor = (): [number, number, number] => {
  const colors: [number, number, number][] = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 165, 0],
    [128, 0, 128],
    [0, 128, 128],
    [255, 192, 203],
    [165, 42, 42],
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Update the normalizeData function with proper types
const normalizeData = (
  data: Record<string, unknown>[],
  fileType: "csv" | "json"
): DataPoint[] => {
  if (fileType === "csv") {
    return data.map((row) => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      properties: { ...row },
      geojson: JSON.stringify({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)],
        },
        properties: { ...row },
      }),
    }));
  } else if (fileType === "json") {
    if (data?.features) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data?.features.map((feature: any) => ({
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: feature.properties,
        geojson: JSON.stringify(feature),
      }));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [hubLocationFile, setHubLocationFile] = useState<File | null>(null);
  const [populationFile, setPopulationFile] = useState<File | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFileUploaded(true);
      setHubLocationFile(files[0]);

      Array.from(files).forEach((file) => {
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

            // Only process file for visualization, don't upload to API yet
            if (file.name.endsWith(".json")) {
              const jsonData = JSON.parse(content);
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
            } else if (file.name.endsWith(".csv")) {
              Papa.parse(content, {
                header: true,
                dynamicTyping: true,
                complete: (result) => {
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
            }
          }
        };
        reader.readAsText(file);
      });
    }
  };

  const handleDeleteDataset = (id: string) => {
    dispatch(removeDataset(id));
  };

  const handlePopulationUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      message.error("Please upload a CSV file for population data.");
      return;
    }

    setPopulationFile(file);
    message.success("Population file selected successfully.");
  };

  const handleCalculatePopulation = async () => {
    if (!hubLocationFile || !populationFile) {
      message.error("Please upload both hub locations and population files.");
      return;
    }

    setIsCalculating(true);
    setUploadProgress(0);

    try {
      // First upload hub locations
      const hubFormData = new FormData();
      hubFormData.append("file", hubLocationFile);

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

      const processedData = await hubResponse.json();

      // Update dataset with processed data
      const dataset = datasets.find((d) => d.visible);
      if (dataset) {
        dispatch(
          updateDatasetWithDownloadable({
            datasetId: dataset.id,
            downloadableData: processedData,
          })
        );
      }

      setUploadProgress(33);

      // Continue with population upload and calculation
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
          : "Failed to calculate population coverage."
      );
    } finally {
      setIsCalculating(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleGetSuggestedHubs = async () => {
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
        message.success("Successfully loaded suggested hubs");
      }
    } catch (error) {
      console.error("Error getting suggested hubs:", error);
      message.error("Failed to get suggested hubs");
    }
  };

  // Change this condition
  const showPopulationSection = datasets.some((dataset) => dataset.visible);

  return (
    <div className="w-full md:w-[22vw] h-[50vh] md:h-screen p-4 md:p-6 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 z-10 shadow-xl overflow-y-auto">
      <div className="flex items-center mb-4 md:mb-8">
        <Image
          src={SPL}
          alt="SPL Logo"
          width={60}
          height={0}
          className="w-12 md:w-[60px] rounded-lg shadow-md"
        />
        <h1 className="text-xl md:text-2xl font-bold ml-3 text-gray-900">
          GeoDashboard
        </h1>
      </div>

      <h2 className="text-md md:text-lg font-semibold mb-4 md:mb-6 text-gray-700">
        Upload Hub Locations (JSON or CSV)
      </h2>

      <input
        type="file"
        accept=".json,.csv"
        onChange={handleFileChange}
        multiple
        className="w-full p-2 md:p-3 border-2 border-dashed border-gray-300 rounded-lg mb-4 md:mb-6 bg-white hover:border-blue-500 transition-colors cursor-pointer"
      />

      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-gray-700">
          Uploaded Datasets
        </h3>
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="flex items-center justify-between mb-2 md:mb-3 p-2 md:p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center">
              <button
                onClick={() => dispatch(toggleDatasetVisibility(dataset.id))}
                className="mr-3 text-gray-500 hover:text-blue-500 transition-colors"
              >
                {dataset.visible ? (
                  <FaEye size={16} />
                ) : (
                  <FaEyeSlash size={16} />
                )}
              </button>
              <div
                className="w-4 h-4 mr-3 rounded-full shadow-inner"
                style={{ backgroundColor: `rgb(${dataset.color.join(",")})` }}
              />
              <span className="text-sm font-medium text-gray-700">
                {dataset.name}
              </span>
            </div>
            <div className="flex items-center">
              <Tooltip title="Delete Dataset">
                <button
                  onClick={() => handleDeleteDataset(dataset.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors mr-3"
                >
                  <FaTrash size={16} />
                </button>
              </Tooltip>
              <Tooltip title="Download Dataset with Coverage">
                <button
                  onClick={() => downloadCSV(dataset)}
                  className={`text-gray-500 transition-colors ${
                    dataset.hasIsochrones
                      ? "hover:text-blue-500"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!dataset.hasIsochrones}
                >
                  <FaDownload size={16} />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {fileUploaded && (
        <div className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Coverage Time Limit (minutes):
              <Tooltip title="Enter the maximum walking time in minutes to calculate the area that can be reached on foot from each point">
                <FaInfoCircle className="inline ml-2 text-gray-400" />
              </Tooltip>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => dispatch(setTimeLimit(Number(e.target.value)))}
                min="1"
                max="60"
                className="w-full p-2 md:p-3 border border-gray-300 rounded-lg mt-1 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter walking time (1-60 minutes)"
              />
            </label>
          </div>
          <button
            className="w-full py-2 md:py-3 px-4 md:px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm text-sm md:text-base flex items-center justify-center"
            onClick={() => dispatch(showIsochrones())}
          >
            Calculate Walkable Coverage
            <Tooltip title="Calculate the area that can be reached on foot from each point shown on the map">
              <FaInfoCircle className="ml-2 text-white" />
            </Tooltip>
          </button>
        </div>
      )}

      {/* Change the condition here */}
      {showPopulationSection && (
        <div className="mb-4 mt-4 md:mb-6">
          <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-gray-700">
            Population Coverage Analysis
          </h3>
          <div className="flex items-center space-x-2">
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
              className={`flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer ${
                isCalculating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <UploadOutlined className="mr-2" />
              Select Population File
            </label>
            {populationFile && (
              <span className="text-sm text-gray-600">
                {populationFile.name}
              </span>
            )}
          </div>

          {hubLocationFile && populationFile && (
            <button
              onClick={handleCalculatePopulation}
              disabled={isCalculating}
              className={`w-full mt-6 py-3 md:py-4 px-6 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl active:shadow-inner ${
                isCalculating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isCalculating ? (
                <div className="flex items-center justify-center text-base">
                  <Spin className="mr-2" size="small" />
                  Calculating...
                </div>
              ) : (
                <>Calculate Population Coverage</>
              )}
            </button>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <Progress
                percent={Math.round(uploadProgress)}
                size="small"
                status="active"
              />
            </div>
          )}
        </div>
      )}

      {/* Change this condition too */}
      {datasets.some(
        (dataset) => dataset.downloadableData && dataset.visible
      ) && (
        <div className="mt-4">
          <button
            onClick={handleGetSuggestedHubs}
            className="w-full py-3 px-6 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl active:shadow-inner"
          >
            Get Suggested Hubs
          </button>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
