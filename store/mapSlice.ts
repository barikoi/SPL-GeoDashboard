//@ts-nocheck
// store/mapSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Dataset {
  id: string;
  name: string;
  data: any;
  visible: boolean;
  color: [number, number, number];
  strokedColor: [number, number, number];
}

interface MapState {
  datasets: Dataset[];
  hoverInfo: {
    x: number;
    y: number;
    object: any;
  } | null;
  isochrones: any[];
  timeLimit: number; // Add timeLimit to the state
  showIsochrones: boolean; // Add this property
}

const initialState: MapState = {
  datasets: [],
  hoverInfo: null,
  isochrones: [],
  timeLimit: 10, // Default time limit in minutes
  showIsochrones: false, // Add initial value
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    addDataset: (state, action: PayloadAction<Dataset>) => {
      state.datasets.push(action.payload);
      state.showIsochrones = false;
    },
    toggleDatasetVisibility: (state, action: PayloadAction<string>) => {
      const dataset = state.datasets.find((d) => d.id === action.payload);
      if (dataset) {
        dataset.visible = !dataset.visible;
      }
    },
    removeDataset: (state, action: PayloadAction<string>) => {
      state.datasets = state.datasets.filter((d) => d.id !== action.payload);
    },
    setHoverInfo: (
      state,
      action: PayloadAction<{ x: number; y: number; object: any } | null>
    ) => {
      state.hoverInfo = action.payload;
    },
    addIsochrone: (state, action: PayloadAction<any>) => {
      state.isochrones.push(action.payload);
    },
    setTimeLimit: (state, action: PayloadAction<number>) => {
      state.timeLimit = action.payload; // Update timeLimit
      state.showIsochrones = false;
    },
    showIsochrones: (state) => {
      state.showIsochrones = true; // Add a new state property
    },
    updateDatasetWithIsochrones: (
      state,
      action: PayloadAction<{ datasetId: string; updatedData: any[] }>
    ) => {
      const dataset = state.datasets.find(
        (d) => d.id === action.payload.datasetId
      );
      if (dataset) {
        dataset.data = action.payload.updatedData;
        dataset.hasIsochrones = true; // Add flag to indicate isochrones are available
      }
    },
  },
});

export const {
  addDataset,
  toggleDatasetVisibility,
  removeDataset,
  setHoverInfo,
  addIsochrone,
  setTimeLimit,
  showIsochrones,
  updateDatasetWithIsochrones,
} = mapSlice.actions;
export default mapSlice.reducer;
