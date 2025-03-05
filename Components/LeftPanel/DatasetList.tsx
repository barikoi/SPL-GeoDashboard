// components/DatasetList.tsx
"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleDatasetVisibility, removeDataset } from "@/store/mapSlice";
import { RootState } from "@/store/store";
import { FaTrash, FaDownload, FaEye, FaEyeSlash } from "react-icons/fa";
import { Tooltip } from "antd";

const DatasetList: React.FC = () => {
  const dispatch = useDispatch();
  const datasets = useSelector((state: RootState) => state.map.datasets);

  const handleDeleteDataset = (id: string) => {
    dispatch(removeDataset(id));
  };

  return (
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
              {dataset.visible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
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
  );
};

export default DatasetList;
