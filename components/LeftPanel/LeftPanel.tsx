// @ts-nocheck
// components/LeftPanel.tsx
"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addDataset,
  toggleDatasetVisibility,
  removeDataset,
  setTimeLimit,
  showIsochrones,
  setSuggestedHubs,
  togglePopulationLayer,
  toggleNightMode,
  setDeckglLayer,
  toggleBuildingShow,
  setIsShowCoveragePercetage,
  toggleSuggestedHubsVisibility,
  toggleWalkingDistanceVisibility,
  setIsGetSuggestedHubsWalkingDistanceButtonClicked,
  setIsWalkableCoverageModalVisible
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
import SPL from "../../app/images/mcodonlds.png";
import { Progress, message, Spin, Tooltip, Switch, Radio, Input } from "antd";
import { EyeFilled, EyeInvisibleFilled, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import { DataPoint } from "@/types/leftPanelTypes";
import { getRandomColor, normalizeData } from "@/utils/localUtils";
import CalculateWalkableCoverageModal from "./CalculateWalkableCoverageModal";
import { BASE_URL } from "@/app.config";
import { setIsShowPopulationFilter, setPopulationFileForFilter } from "@/store/filterSlice";
import FilterPanel from "./FilterPanel";

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

  // Local States
  // const [fileUploaded, setFileUploaded] = useState(false);
  const [fileUploadedForParcelat, setFileUploadedForParcelat] = useState(false);
  const [fileUploadedForCompetitor, setFileUploadedForCompetitor] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [populationFile, setPopulationFile] = useState<File | null>(null);
  const [suggestedHubsCount, setSuggestedHubsCount] = useState<number | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasCoverageColumn, setHasCoverageColumn] = useState<boolean>(false);

  // Redux States
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const isNightMode = useSelector((state: RootState) => state.map.isNightMode);
  const populationLayerVisible = useSelector((state: RootState) => state.map.populationLayerVisible);
  const isCalculatingCoverage = useSelector((state: RootState) => state.map.isCalculatingCoverage);
  const isShowSuggestedHubsCoverage = useSelector((state: RootState) => state.map.isShowSuggestedHubsCoverage);
  const isShowWalkingDistanceVisibility = useSelector((state: RootState) => state.map.isShowWalkingDistanceVisibility);
  const isFetchingIsochrones = useSelector((state: RootState) => state.map.isFetchingIsochrones);
  const selectedOptionForWalkableCoverage = useSelector((state: RootState) => state.map.selectedOptionForWalkableCoverage);
  const selectedGender = useSelector((state: RootState) => state.filter.selectedGender); 
  const selectedNationality = useSelector((state: RootState) => state.filter.selectedNationality); 
  const selectedOccupationMode = useSelector((state: RootState) => state.filter.selectedOccupationMode); 
  const selectedAgeGroup = useSelector((state: RootState) => state.filter.selectedAgeGroup); 

  const options: CheckboxGroupProps<string>['options'] = [
    { 
      label: 'Hexgonlayer', 
      value: 'Hexgonlayer',
      style: { color: isNightMode ? '#f9fafb' : '#374151' }
    },
    { 
      label: 'Heatmaplayer', 
      value: 'Heatmaplayer',
      style: { color: isNightMode ? '#f9fafb' : '#374151' }
    },
  ];

  const handleToggleMapStyle = (checked: boolean) => {
    dispatch(toggleNightMode()); // Dispatch the action to toggle night mode
  };

  const checkForCoverageColumn = (data: any[]): boolean => {
    if (!data || data.length === 0) return false;
    return Object.keys(data[0]).some((key) => key.toLowerCase() === "coverage");
  };

  // Hub Locations uploaded file
  const handleFileChangeForParcelat = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files.length > 1) {
      alert('Please select only one file.');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    
    // Check if the file has already been uploaded
    const isFileAlreadyUploaded = datasets.some(dataset => dataset.name === file.name);
    if (isFileAlreadyUploaded) {
      message.error("This file has already been uploaded. Please upload a different file.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        const id = `dataset-${Date.now()}`;
        const color = getRandomColor();
        const strokedColor = color.map((c) => Math.floor(c * 0.6)) as [ number, number, number ];

        try {
          if (file.name.endsWith(".csv")) {
            Papa.parse(content, {
              header: true,
              dynamicTyping: true,
              complete: (result) => {
                const headers = result.meta.fields || [];
                const requiredColumns = ['City', 'Latitude' ,'Longitude'];
                const missingColumns = requiredColumns.filter(col => 
                  !headers.some(header => header.toLowerCase() === col.toLowerCase())
                );

                if (missingColumns.length > 0) {
                  message.error(
                    `Missing required columns: ${missingColumns.join(', ')}. ` +
                    'Please ensure your file contains City, Latitude, and Longitude columns.'
                  );
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                  return;
                }

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
                    layerIds: {
                      coverage: `coverage-layer-${id}`,
                      scatterplot: `scatterplot-layer-${id}`
                    },
                    uploaded_file_for: "parcelat"
                  })
                );
                setFileUploadedForParcelat(true);
              },
              error: (error) => {
                console.error("Error parsing CSV file:", error);
                message.error("Failed to parse CSV file");
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }
            });
          } else if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content);
            
            const firstItem = jsonData[0];
            if (!firstItem || !firstItem.City || !firstItem.city || !firstItem.Latitude || !firstItem.latitude || !firstItem.Longitude || !firstItem.longitude) {
              message.error(
                'JSON file must contain City, Latitude, and Longitude fields'
              );
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
              return;
            }

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
                layerIds: {
                  coverage: `coverage-layer-${id}`,
                  scatterplot: `scatterplot-layer-${id}`
                },
                uploaded_file_for: "parcelat"
              })
            );
            setFileUploadedForParcelat(true);
          }
        } catch (error) {
          console.error("Error parsing file:", error);
          message.error("Failed to parse file");
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      }
    };

    reader.onerror = () => {
      console.error("Error reading file");
      message.error("Failed to read file");
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };

    reader.readAsText(file);
  }; 
  
  // @ts-ignore
  const handleFileChangeForCompetitor = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) {
      e.target.value = '';
      return;
    }

    const file = files[0];
    
    // Check if the file has already been uploaded
    const isFileAlreadyUploaded = datasets.some(dataset => dataset.name === file.name);
    if (isFileAlreadyUploaded) {
      message.error("This file has already been uploaded. Please upload a different file.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        const id = `dataset-${Date.now()}`;
        const color = getRandomColor();
        const strokedColor = color.map((c) => Math.floor(c * 0.6)) as [ number, number, number ];

        try {
          if (file.name.endsWith(".csv")) {
            Papa.parse(content, {
              header: true,
              dynamicTyping: true,
              complete: (result) => {
                const headers = result.meta.fields || [];
                const requiredColumns = ['City', 'Latitude', 'Longitude'];
                const missingColumns = requiredColumns.filter(col => 
                  !headers.some(header => header.toLowerCase() === col.toLowerCase())
                );

                if (missingColumns.length > 0) {
                  message.error(
                    `Missing required columns: ${missingColumns.join(', ')}. ` +
                    'Please ensure your file contains City, Latitude, and Longitude columns.'
                  );
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                  return;
                }

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
                    layerIds: {
                      coverage: `coverage-layer-${id}`,
                      scatterplot: `scatterplot-layer-${id}`
                    },
                    uploaded_file_for: "competitor"
                  })
                );
                setFileUploadedForCompetitor(true);
              },
              error: (error) => {
                console.error("Error parsing CSV file:", error);
                message.error("Failed to parse CSV file");
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }
            });
          } else if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content);
            
            const firstItem = jsonData[0];
            if (!firstItem || !firstItem.City || !firstItem.Latitude || !firstItem.Longitude) {
              message.error(
                'JSON file must contain City, Latitude, and Longitude fields'
              );
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
              return;
            }

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
                layerIds: {
                  coverage: `coverage-layer-${id}`,
                  scatterplot: `scatterplot-layer-${id}`
                },
                uploaded_file_for: "competitor"
              })
            );
            setFileUploadedForCompetitor(true);
          }
        } catch (error) {
          console.error("Error parsing file:", error);
          message.error("Failed to parse file");
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      }
    };

    reader.onerror = () => {
      console.error("Error reading file");
      message.error("Failed to read file");
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };

    reader.readAsText(file);
  };

  const handleDeleteDataset = (id: string) => {
    dispatch(removeDataset(id));
    // Check if there are any remaining datasets
    const remainingDatasets = datasets.filter((d) => d.id !== id);
    if (remainingDatasets.length === 0) {
      setFileUploadedForParcelat(false);
      setFileUploadedForCompetitor(false);
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

    console.log({file})

    const reader = new FileReader();
    const key = "error"
    reader.onload = (e) => {
      if (e.target?.result) {
        Papa.parse(e.target.result as string, {
          header: true,
          complete: (results) => {
            // Validate required columns
            const headers = results.meta.fields || [];
            const requiredColumns = ['Latitude', 'Longitude', 'Nationality', 'Gender', 'OccupationMode', 'Age Group'];
            
            const missingColumns = requiredColumns.filter(col => 
              !headers.includes(col)
            );

            if (missingColumns.length > 0) {
              message.error({
                content: `Missing required columns: ${missingColumns.join(', ')}. ` +
                'Please ensure your population file contains Nationality, Gender, OccupationMode, Age Group, Latitude and Longitude columns.',
                duration: 5,
                style: { marginTop: '25vh', width: '500px' },
                className: "validation-message",
                key
              }); 
              return;
            }

            // Validate data structure
            const sampleRow = results.data[0];
            if (!sampleRow?.Latitude || !sampleRow?.Longitude) {
              message.error("File must contain valid Latitude and Longitude columns");
              return;
            }

            // Dispatch population data to MapComponent
            const event = new CustomEvent("populationData", {
              detail: results.data, // Attach the parsed population data from the CSV
            });

            window.dispatchEvent(event);

            setPopulationFile(file);
            message.success("Population file loaded successfully");
            message.destroy()
          },
          error: (error) => {
            console.error("Error parsing population file:", error);
            message.error("Failed to parse population file")
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

    // Filter datasets based on selected option
    // const filteredDatasets = datasets.filter(dataset => 
    //   dataset.uploaded_file_for === selectedOptionForWalkableCoverage.toLowerCase()
    // );

    // Check if either coverage column exists or isochrones are calculated
    // const hasIsochrones = filteredDatasets.some((dataset) => dataset.hasIsochrones);
    // if (!hasCoverageColumn && !hasIsochrones) {
    //   message.error("Please calculate walkable coverage first.");
    //   return;
    // }

    setIsCalculating(true);
    setUploadProgress(0);

    try {
      // Get the dataset with coverage (either from file or calculated)
      // const dataset = hasCoverageColumn ? filteredDatasets[0] : filteredDatasets.find((d) => d.hasIsochrones);
      // if (!dataset) {
      //   throw new Error("No dataset with coverage found");
      // }

      // // Create CSV with coverage data
      // const csvData = dataset.data.map((point) => ({
      //   ...point.properties,
      //   latitude: point.latitude,
      //   longitude: point.longitude,
      //   coverage: point.coverage ? JSON.stringify(point.coverage) : null,
      // }));

      // // Create form data for hub locations
      // const hubFormData = new FormData();
      // const csvBlob = new Blob([Papa.unparse(csvData)], { type: "text/csv" });
      // hubFormData.append("file", csvBlob, dataset.name);

      // // Upload hub locations with coverage
      // const hubResponse = await fetch(
      //   `${BASE_URL}/upload_hub_locations/`,
      //   {
      //     method: "POST",
      //     body: hubFormData,
      //     headers: {
      //       Accept: "*/*",
      //     },
      //     mode: "cors",
      //   }
      // );

      // if (!hubResponse.ok) throw new Error("Hub locations upload failed.");
      setUploadProgress(33);

      // Upload population file
      const populationFormData = new FormData();
      populationFormData.append("file", populationFile);

      const populationResponse = await fetch(
        `${BASE_URL}/upload_population/`,
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
      const params = new URLSearchParams();
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedNationality) params.append('nationality', selectedNationality);
      if (selectedOccupationMode) params.append('occupation_mode', selectedOccupationMode);
      if (selectedAgeGroup) params.append('age_group', selectedAgeGroup);

      const calculateResponse = await fetch(
        `${BASE_URL}/calculate_hubs/?radius=2000&${params.toString()}`,
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
        `${BASE_URL}/suggested_hubs/`,
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
        if (populationLayerVisible) {
          dispatch(togglePopulationLayer()); 
        }
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

  const handleGetSuggestedHubsWalkingDistance = () => {
    dispatch(setIsGetSuggestedHubsWalkingDistanceButtonClicked())
  }

  const onLayerChange = (e:any) => {
    const layer = e.target.value
    dispatch(setDeckglLayer(layer))
  }

  // Change this condition
  const showPopulationSection = datasets.some((dataset) => dataset.visible);

  useEffect(()=> {
    if(populationFile){
      dispatch(setIsShowPopulationFilter(true))
      dispatch(setPopulationFileForFilter(populationFile))
    }
  }, [populationFile])

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
      {/* <div
        className={`mb-4 p-3 rounded-lg shadow-sm ${
          isNightMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <h2
          className={`text-xs md:text-sm font-bold mb-2 ${
            isNightMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Upload Hub Locations
        </h2>
        For Parcelat Points
        <h3
          className={`text-xs md:text-sm font-semibold mb-2 ${
            isNightMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Parcelat Points
        </h3>
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleFileChangeForParcelat}
          className={`w-full p-1.5 border-2 border-dashed rounded-lg mb-2 hover:border-blue-500 transition-colors cursor-pointer text-xs ${
            isNightMode
              ? "bg-gray-600 border-gray-500 text-gray-100"
              : "bg-white border-gray-300 text-gray-800"
          }`}
        />

        Dataset list with download options
        {fileUploadedForParcelat && (
          <div className="mb-3">
            <h3
              className={`text-xs font-medium mb-1.5 ${
                isNightMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Uploaded Datasets:
            </h3>
            {datasets
              .filter(dataset => dataset.uploaded_file_for === "parcelat")
              .map((dataset) => (
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
              ))
            }
          </div>
        )}

        For Competitor Points
        <h3
          className={`text-xs md:text-sm font-semibold mb-2 ${
            isNightMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Competitor Points
        </h3>
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleFileChangeForCompetitor}
          className={`w-full p-1.5 border-2 border-dashed rounded-lg mb-2 hover:border-blue-500 transition-colors cursor-pointer text-xs ${
            isNightMode
              ? "bg-gray-600 border-gray-500 text-gray-100"
              : "bg-white border-gray-300 text-gray-800"
          }`}
        />

        Dataset list with download options
        {fileUploadedForCompetitor && (
          <div className="mb-3">
            <h3
              className={`text-xs font-medium mb-1.5 ${
                isNightMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Uploaded Datasets:
            </h3>
            {datasets
              .filter(dataset => dataset.uploaded_file_for === "competitor")
              .map((dataset) => (
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
              ))
            }
          </div>
        )}

      </div> */}

      {/* Step 2: More compact dataset list and controls */}
      {(fileUploadedForParcelat || fileUploadedForCompetitor) && !hasCoverageColumn && (
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
            Calculate Walkable Coverage <span>({selectedOptionForWalkableCoverage.toUpperCase()})</span>
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
            <Input
              type="number"
              value={timeLimit || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  dispatch(setTimeLimit(0));
                } else {
                  dispatch(setTimeLimit(Number(value)));
                }
              }}
              min={1}
              max={60}
              disabled={isCalculatingCoverage}
              placeholder="1-60 minutes"
              className={`${isCalculatingCoverage ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ 
                backgroundColor: isNightMode ? '#4B5563' : '#FFFFFF',
                borderColor: isNightMode ? '#6B7280' : '#D1D5DB',
                color: isNightMode ? '#F9FAFB' : '#1F2937'
              }}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                dispatch(setIsWalkableCoverageModalVisible(true))
              }}
              disabled={isCalculatingCoverage}
              className={`flex-1 py-1.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs font-medium flex items-center justify-center ${
                isCalculatingCoverage ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isCalculatingCoverage ? (
                <div className="flex items-center justify-center space-x-2">
                  <Spin size="small" />
                  <span>Calculating...</span>
                </div>
              ) : (
                "Calculate Coverage"
              )}
            </button>
          </div>
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

          {
            populationFile && (
              <div className="py-2">
                <Radio.Group 
                  onChange={onLayerChange} 
                  block 
                  options={options} 
                  defaultValue="Hexgonlayer" 
                />
              </div>
            )
          }

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
            <FilterPanel/>
          }
          {
            <button
              onClick={handleCalculatePopulation}
              disabled={
                isCalculating ||
                !populationFile 
              }
              className={`w-full py-1.5 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs font-medium ${
                isCalculating ||
                !populationFile ?  "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isCalculating ? (
                <div className="flex items-center justify-center">
                  <Spin className="mr-1.5" size="small" />
                  Calculating...
                </div>
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
          className={`mb-4 p-3 rounded-lg shadow-sm ${
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
              className={`flex items-center justify-between mt-2 mb-2 p-1.5 rounded-lg ${
                isNightMode ? "bg-gray-600" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => dispatch(toggleSuggestedHubsVisibility())}
                  className={`mr-2 ${
                    isNightMode ? "text-gray-300" : "text-gray-500"
                  } hover:text-blue-500 transition-colors`}
                >
                  {isShowSuggestedHubsCoverage ? (
                    <FaEye size={14} />
                  ) : (
                    <FaEyeSlash size={14} />
                  )}
                </button>
                <div
                  className="w-3 h-3 mr-2 rounded-full shadow-inner"
                  style={{
                    backgroundColor: isNightMode ?  "rgb(145, 245, 173)" :  "rgb(251, 75, 78, 80)"
                  }}
                />
                <span
                  className={`text-xs font-medium ${
                    isNightMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Found {suggestedHubsCount} suggested hub
                  {suggestedHubsCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      }
      {/* Suggested Hubs with Walking Distance Section - more compact */}
      {
        <div
          className={`p-3 rounded-lg shadow-sm ${
            isNightMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <button
            onClick={handleGetSuggestedHubsWalkingDistance}
            disabled={isFetchingIsochrones}
            className={`w-full py-1.5 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-xs font-medium ${
              isFetchingIsochrones ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center justify-center space-x-1.5">
              <span>Get Suggested Hubs Walking Distance</span>
              {isFetchingIsochrones && <Spin size="small" />}
            </div>
          </button>

          {suggestedHubsCount !== null && (
            <div
              className={`flex items-center justify-between mt-2 mb-2 p-1.5 rounded-lg ${
                isNightMode ? "bg-gray-600" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => dispatch(toggleWalkingDistanceVisibility())}
                  className={`mr-2 ${
                    isNightMode ? "text-gray-300" : "text-gray-500"
                  } hover:text-blue-500 transition-colors`}
                >
                  {isShowWalkingDistanceVisibility ? (
                    <FaEye size={14} />
                  ) : (
                    <FaEyeSlash size={14} />
                  )}
                </button>
                <div
                  className="w-3 h-3 mr-2 rounded-full shadow-inner"
                  style={{
                    backgroundColor: "rgb(255, 140, 0, 120)",
                  }}
                />
                <span
                  className={`text-xs font-medium ${
                    isNightMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Suggested hub
                  {suggestedHubsCount !== 1 ? "s" : ""} walking distance
                </span>
              </div>
            </div>
          )}
        </div>
      }

      <CalculateWalkableCoverageModal />
    </div>
  );
};

export default LeftPanel;
