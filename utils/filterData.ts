export interface FilterData {
  city: string;
  unitType: string;
  neighbourhood: string;
  avgRentApartment?: number;
  avgRentVilla?: number;
  avgLandArea?: number;
  avgUnitPrice?: number;
  avgPricePerSqm?: number;
  totalTransactionAmount?: string;
  totalNumberOfTransactions?: number;
  totalTransactionAmountSAR?: number; // Add the SAR amount as number
}

export const filterData: FilterData[] = [
  {
    city: 'Riyadh',
    unitType: 'Apartment',
    neighbourhood: 'Al Yasmeen',
    avgRentApartment: 50650,
    avgLandArea: 143.7,
    avgUnitPrice: 0.92,
    avgPricePerSqm: 6416,
    totalTransactionAmount: '1598M',
    totalTransactionAmountSAR: 1598000000,
    totalNumberOfTransactions: 1883
  },
  {
    city: 'Riyadh',
    unitType: 'Villa',
    neighbourhood: 'Al Yasmeen',
    avgRentVilla: 99173,
    avgLandArea: 348.3,
    avgUnitPrice: 3.23,
    avgPricePerSqm: 8412,
    totalTransactionAmount: '2873M',
    totalTransactionAmountSAR: 2873000000,
    totalNumberOfTransactions: 882
  },
  {
    city: 'Riyadh',
    unitType: 'Apartment',
    neighbourhood: 'Al Malqa',
    avgRentApartment: 58396,
    avgLandArea: 123.2,
    avgUnitPrice: 0.94,
    avgPricePerSqm: 7457,
    totalTransactionAmount: '2570M',
    totalTransactionAmountSAR: 2570000000,
    totalNumberOfTransactions: 2852
  },
  {
    city: 'Riyadh',
    unitType: 'Villa',
    neighbourhood: 'Al Malqa',
    avgRentVilla: 124492,
    avgLandArea: 530.2,
    avgUnitPrice: 6.25,
    avgPricePerSqm: 11796,
    totalTransactionAmount: '5439M',
    totalTransactionAmountSAR: 5439000000,
    totalNumberOfTransactions: 864
  },
  {
    city: 'Riyadh',
    unitType: 'Apartment',
    neighbourhood: 'Al Olaya',
    avgRentApartment: 50840,
    avgLandArea: 558.8,
    avgUnitPrice: 7.03,
    avgPricePerSqm: 12575,
    totalTransactionAmount: '1176M',
    totalTransactionAmountSAR: 1176000000,
    totalNumberOfTransactions: 314
  },
  {
    city: 'Riyadh',
    unitType: 'Villa',
    neighbourhood: 'Al Olaya',
    avgRentVilla: 92191,
    avgLandArea: 407.8,
    avgUnitPrice: 4.13,
    avgPricePerSqm: 10126,
    totalTransactionAmount: '734M',
    totalTransactionAmountSAR: 734000000,
    totalNumberOfTransactions: 176
  }
];

export const getFilterOptions = () => {
  const cities = Array.from(new Set(filterData.map(item => item.city)));
  const unitTypes = Array.from(new Set(filterData.map(item => item.unitType)));
  const neighbourhoods = Array.from(new Set(filterData.map(item => item.neighbourhood)));
  
  return { cities, unitTypes, neighbourhoods };
};

export const getDependentFilterOptions = (
  selectedCity: string | null,
  selectedNeighbourhood: string | null
) => {
  let filteredData = filterData;
  
  // Filter by city if selected
  if (selectedCity) {
    filteredData = filteredData.filter(item => item.city === selectedCity);
  }
  
  // Get all neighbourhoods for the selected city (don't filter by selected neighbourhood)
  const availableNeighbourhoods = selectedCity 
    ? Array.from(new Set(filteredData.map(item => item.neighbourhood)))
    : Array.from(new Set(filterData.map(item => item.neighbourhood)));
  
  // For unit types, filter based on selected neighbourhood if any
  let unitTypeData = filterData;
  if (selectedCity) {
    unitTypeData = unitTypeData.filter(item => item.city === selectedCity);
  }
  if (selectedNeighbourhood) {
    unitTypeData = unitTypeData.filter(item => item.neighbourhood === selectedNeighbourhood);
  }
  
  const availableUnitTypes = Array.from(new Set(unitTypeData.map(item => item.unitType)));
  
  return {
    neighbourhoods: availableNeighbourhoods,
    unitTypes: availableUnitTypes
  };
};

export const getFilteredData = (
  city: string | null,
  unitType: string | null,
  neighbourhood: string | null
): FilterData[] => {
  return filterData.filter(item => {
    const cityMatch = !city || item.city === city;
    const unitTypeMatch = !unitType || item.unitType === unitType;
    const neighbourhoodMatch = !neighbourhood || item.neighbourhood === neighbourhood;
    
    return cityMatch && unitTypeMatch && neighbourhoodMatch;
  });
}; 