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
  hasIsochrones?: boolean;
  originalFile: any[];
  downloadableData?: any[]; // Add this to store the processed data from API
}

interface SuggestedHub {
  latitude: number;
  longitude: number;
  coverage: string;
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
  suggestedHubs: SuggestedHub[] | null;
  populationLayerVisible: boolean;
  isNightMode: boolean;
  isCalculatingCoverage: boolean;
  deckglLayer: 'Hexgonlayer' | 'Heatmaplayer',
  isShowBuilding: boolean;
  isShowRegion: boolean;
  isShowCoveragePercetage: boolean;
  suggestedHubsIsochrones: any[];
  isShowRiyadhCity: boolean;
  isShowSuggestedHubsCoverage: boolean;
  isShowWalkingDistanceVisibility: boolean;
  isGetSuggestedHubsWalkingDistanceButtonClicked: boolean;
  isFetchingIsochrones: boolean;
  isWalkableCoverageModalVisible: boolean;
  selectedOptionForWalkableCoverage: 'parcelat' | 'competitor'
}

const initialState: MapState = {
  datasets: [],
  hoverInfo: null,
  isochrones: [],
  timeLimit: 10, // Default time limit in minutes
  showIsochrones: false, // Add initial value
  suggestedHubs: null,
  populationLayerVisible: true,
  isNightMode: false,
  isCalculatingCoverage: false,
  deckglLayer: 'Hexgonlayer',
  isShowBuilding: false,
  isShowCoveragePercetage: false,
  suggestedHubsIsochrones: null,
  isShowRiyadhCity: false,
  isShowSuggestedHubsCoverage: true,
  isShowWalkingDistanceVisibility: true,
  isGetSuggestedHubsWalkingDistanceButtonClicked: false,
  isFetchingIsochrones: false,
  isWalkableCoverageModalVisible: false,
  selectedOptionForWalkableCoverage: 'parcelat'
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    addDataset: (state, action: PayloadAction<Dataset>) => {
      const dataset = {
        ...action.payload,
        originalFile: action.payload.data, // Store the original file data
      };
      state.datasets.push(dataset);
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
    showIsochrones: (state, action) => {
      state.showIsochrones = action.payload; // Add a new state property
    },
    updateDatasetWithIsochrones: (
      state,
      action: PayloadAction<{ datasetId: string; updatedData: any[] }>
    ) => {
      const dataset = state.datasets.find(
        (d) => d.id === action.payload.datasetId
      );
      if (dataset) {
        // Directly update the data with isochrones
        dataset.data = action.payload.updatedData.map((point) => ({
          ...point,
          coverage: point.isochrones ? JSON.parse(point.isochrones) : null,
        }));
        dataset.hasIsochrones = true;
      }
    },
    resetIsochrones: (state) => {
      state.showIsochrones = false;
    },
    updateDatasetWithDownloadable: (
      state,
      action: PayloadAction<{ datasetId: string; downloadableData: any[] }>
    ) => {
      const dataset = state.datasets.find(
        (d) => d.id === action.payload.datasetId
      );
      if (dataset) {
        dataset.downloadableData = action.payload.downloadableData;
      }
    },
    setSuggestedHubs: (state, action: PayloadAction<SuggestedHub[]>) => {
      state.suggestedHubs = action.payload;
    },
    togglePopulationLayer: (state) => {
      state.populationLayerVisible = !state.populationLayerVisible;
    },
    toggleNightMode: (state) => {
      state.isNightMode = !state.isNightMode; // Toggle night mode
    },
    setCalculatingCoverage: (state, action: PayloadAction<boolean>) => {
      state.isCalculatingCoverage = action.payload;
    },
    setDeckglLayer: (state, action) => {
      state.deckglLayer = action.payload;
    },
    toggleBuildingShow: (state) => {
      state.isShowBuilding = !state.isShowBuilding; 
    },
    toggleRegionShow: (state) => {
      state.isShowRegion = !state.isShowRegion; 
    },
    toggleRiyadhCityShow: (state) => {
      state.isShowRiyadhCity = !state.isShowRiyadhCity; 
    },
    toggleSuggestedHubsVisibility: (state) => {
      state.isShowSuggestedHubsCoverage = !state.isShowSuggestedHubsCoverage; 
    },
    setIsShowCoveragePercetage:  (state, action) => {
      state.isShowCoveragePercetage = action.payload; 
    },
    setSuggestedHubsIsochrones: (state, action) => {
      state.suggestedHubsIsochrones = action.payload; 
    }, 
    setIsGetSuggestedHubsWalkingDistanceButtonClicked: (state) => {
      state.isGetSuggestedHubsWalkingDistanceButtonClicked = !state.isGetSuggestedHubsWalkingDistanceButtonClicked; 
    },
    toggleWalkingDistanceVisibility: (state) => {
      state.isShowWalkingDistanceVisibility = !state.isShowWalkingDistanceVisibility; 
    }, 
    setIsFetchingIsochrones: (state, action) => {
      state.isFetchingIsochrones = action.payload; 
    },
    setIsWalkableCoverageModalVisible: (state, action) => {
      state.isWalkableCoverageModalVisible = action.payload; 
    },
    setSelectedOptionForWalkableCoverage: (state, action) => {
      state.selectedOptionForWalkableCoverage = action.payload; 
    }
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
  resetIsochrones,
  updateDatasetWithDownloadable,
  setSuggestedHubs,
  togglePopulationLayer,
  toggleNightMode,
  setCalculatingCoverage,
  setDeckglLayer,
  toggleBuildingShow,
  toggleRegionShow,
  setIsShowCoveragePercetage,
  setSuggestedHubsIsochrones,
  toggleRiyadhCityShow,
  toggleSuggestedHubsVisibility,
  toggleWalkingDistanceVisibility,
  setIsGetSuggestedHubsWalkingDistanceButtonClicked,
  setIsFetchingIsochrones,
  setIsWalkableCoverageModalVisible,
  setSelectedOptionForWalkableCoverage
} = mapSlice.actions;
export default mapSlice.reducer;
