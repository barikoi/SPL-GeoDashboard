//@ts-nocheck
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
} from "@/store/mapSlice";
import { RootState } from "@/store/store";
import { FaTrash, FaDownload, FaEye, FaEyeSlash } from "react-icons/fa";
import * as Papa from "papaparse";
import Image from "next/image";
import SPL from "./SPL_Logo.webp";

// Helper function to generate random colors
const getRandomColor = (): [number, number, number] => {
  // Predefined distinct colors
  const colors: [number, number, number][] = [
    [255, 0, 0], // Red
    [0, 255, 0], // Green
    [0, 0, 255], // Blue
    [255, 165, 0], // Orange
    [128, 0, 128], // Purple
    [0, 128, 128], // Teal
    [255, 192, 203], // Pink
    [165, 42, 42], // Brown
  ];

  // Get a random color from the array
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

// Normalize data to a consistent format
const normalizeData = (data: any[], fileType: "csv" | "json"): any[] => {
  if (fileType === "csv") {
    // Normalize CSV data
    return data.map((row) => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      properties: { ...row }, // Include all other fields as properties
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
    // Normalize JSON data (assuming GeoJSON or custom JSON)
    if (data?.features) {
      // GeoJSON FeatureCollection
      return data?.features.map((feature: any) => ({
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: feature.properties,
        geojson: JSON.stringify(feature),
      }));
    } else {
      // Custom JSON format
      return data.map((item: any) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        properties: { ...item }, // Include all other fields as properties
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

// Function to convert dataset to CSV and trigger download
const downloadCSV = (dataset: any) => {
  const csvData = dataset.data.map((row: any) => ({
    ...row.properties,
    latitude: row.latitude,
    longitude: row.longitude,
    geojson: row.geojson,
    isochrones: row.isochrones, // This will now contain just the geometry object
  }));

  const csv = Papa.unparse(csvData, { header: true });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${dataset.name.replace(
    /\.[^/.]+$/,
    ""
  )}_with_isochrones.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const LeftPanel = () => {
  const dispatch = useDispatch();
  const datasets = useSelector((state: RootState) => state.map.datasets);
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const [fileUploaded, setFileUploaded] = useState(false); // Track file upload

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFileUploaded(true);
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            const content = e.target.result as string;
            const id = `dataset-${Date.now()}`;
            const color = getRandomColor();
            // Make stroked color darker version of the main color
            const strokedColor: [number, number, number] = color.map((c) =>
              Math.floor(c * 0.6)
            ) as [number, number, number];

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

  return (
    <div
      className="p-6 bg-gradient-to-b from-gray-50 to-gray-100 h-screen text-gray-800 z-10 shadow-xl"
      style={{ width: "22vw" }}
    >
      <div className="flex items-center mb-8">
        <Image
          src={SPL} // Add your logo file to the public directory
          alt="SPL Logo"
          width={60}
          height={0}
          className="rounded-lg shadow-md"
        />
        <h1 className="text-2xl font-bold ml-3 text-gray-900">GeoDashboard</h1>
      </div>
      <h2 className="text-xl font-semibold mb-6 text-gray-700">
        Upload JSON or CSV Files
      </h2>
      <input
        type="file"
        accept=".json,.csv"
        onChange={handleFileChange}
        multiple
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg mb-6 bg-white hover:border-blue-500 transition-colors cursor-pointer"
      />
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 text-gray-700">Datasets</h3>
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="flex items-center justify-between mb-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
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
              <button
                onClick={() => handleDeleteDataset(dataset.id)}
                className="text-gray-500 hover:text-red-500 transition-colors mr-3"
              >
                <FaTrash size={16} />
              </button>
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
            </div>
          </div>
        ))}
      </div>
      {fileUploaded && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Walking Distance (minutes):
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => dispatch(setTimeLimit(Number(e.target.value)))}
                min="1"
                max="60"
                className="w-full p-3 border border-gray-300 rounded-lg mt-1 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </label>
          </div>
          <button
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:shadow-inner"
            onClick={() => dispatch(showIsochrones())}
          >
            Calculate Walkable Coverage
          </button>
        </>
      )}
    </div>
  );
};

export default LeftPanel;
