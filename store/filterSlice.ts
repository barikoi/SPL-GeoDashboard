//@ts-nocheck
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface FilterState {
  isShowPopulationFilter: boolean;
  populationFileForFilter: any;
  selectedGender: string;
  selectedNationality: string;
  selectedOccupationMode: string;
  selectedAgeGroup: string;
}

const initialState: FilterState = {
  isShowPopulationFilter: false,
  populationFileForFilter: null,
  selectedGender: null,
  selectedNationality: null,
  selectedOccupationMode: null,
  selectedAgeGroup: null,
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setIsShowPopulationFilter: (state, action) => {
      state.isShowPopulationFilter = action.payload; 
    }, 
    setPopulationFileForFilter: (state, action) => {
      state.populationFileForFilter = action.payload; 
    }, 
    setSelectedGender: (state, action) => {
      state.selectedGender = action.payload; 
    }, 
    setSelectedNationality: (state, action) => {
      state.selectedNationality = action.payload; 
    }, 
    setSelectedOccupationMode: (state, action) => {
      state.selectedOccupationMode = action.payload; 
    },  
    setSelectedAgeGroup: (state, action) => {
      state.selectedAgeGroup = action.payload; 
    }, 
  },
});

export const {
  setIsShowPopulationFilter,
  setPopulationFileForFilter,
  setSelectedGender,
  setSelectedNationality,
  setSelectedOccupationMode,
  setSelectedAgeGroup
} = filterSlice.actions;
export default filterSlice.reducer;
