// components/FileUpload.tsx
"use client";
import React, { ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { addDataset, updateDatasetWithDownloadable } from "@/store/mapSlice";
import { getRandomColor, normalizeData } from "@/utils/helpers";
import { message } from "antd";

interface FileUploadProps {
  onFileUploaded: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const dispatch = useDispatch();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onFileUploaded();
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

            if (file.name.endsWith(".json") || file.name.endsWith(".csv")) {
              const formData = new FormData();
              formData.append("file", file);

              try {
                const response = await fetch(
                  "http://202.72.236.166:8000/upload_hub_locations/",
                  {
                    method: "POST",
                    body: formData,
                    headers: {
                      Accept: "*/*",
                    },
                    mode: "cors",
                  }
                );

                if (!response.ok) throw new Error("Failed to process file");

                const processedData = await response.json();

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
                  dispatch(
                    updateDatasetWithDownloadable({
                      datasetId: id,
                      downloadableData: processedData,
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
                      dispatch(
                        updateDatasetWithDownloadable({
                          datasetId: id,
                          downloadableData: processedData,
                        })
                      );
                    },
                  });
                }
              } catch (error) {
                console.error("Error processing file:", error);
                message.error("Failed to process file");
              }
            }
          }
        };
        reader.readAsText(file);
      });
    }
  };

  return (
    <input
      type="file"
      accept=".json,.csv"
      onChange={handleFileChange}
      multiple
      className="w-full p-2 md:p-3 border-2 border-dashed border-gray-300 rounded-lg mb-4 md:mb-6 bg-white hover:border-blue-500 transition-colors cursor-pointer"
    />
  );
};

export default FileUpload;
