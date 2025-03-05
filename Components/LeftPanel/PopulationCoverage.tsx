// components/PopulationCoverage.tsx
"use client";
import React, { ChangeEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { message, Progress, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const PopulationCoverage: React.FC = () => {
  const dispatch = useDispatch();
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [populationFile, setPopulationFile] = useState<File | null>(null);
  const hubLocationFile = useSelector(
    (state: RootState) => state.map.hubLocationFile
  );

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
      setUploadProgress(33);

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

  return (
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
          <span className="text-sm text-gray-600">{populationFile.name}</span>
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
  );
};

export default PopulationCoverage;
