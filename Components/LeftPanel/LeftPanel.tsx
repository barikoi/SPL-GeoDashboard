// components/LeftPanel.tsx
"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setTimeLimit,
  showIsochrones,
  setSuggestedHubs,
} from "@/store/mapSlice";
import { RootState } from "@/store/store";
import { FaInfoCircle } from "react-icons/fa";
import Image from "next/image";
import SPL from "./SPL_Logo.webp";
import FileUpload from "./FileUpload";
import DatasetList from "./DatasetList";
import PopulationCoverage from "./PopulationCoverage";
import { Tooltip } from "antd";

const LeftPanel = () => {
  const dispatch = useDispatch();
  const timeLimit = useSelector((state: RootState) => state.map.timeLimit);
  const [fileUploaded, setFileUploaded] = useState(false);
  const datasets = useSelector((state: RootState) => state.map.datasets);

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

  const hasDownloadableData = datasets.some(
    (dataset) => dataset.downloadableData && dataset.visible
  );

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

      <FileUpload onFileUploaded={() => setFileUploaded(true)} />

      <DatasetList />

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

      {hasDownloadableData && <PopulationCoverage />}

      {hasDownloadableData && (
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
