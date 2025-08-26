import React, { useState, useEffect } from 'react';
import { Select, Card, Space, Typography, Tooltip } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setSelectedCity, setSelectedUnitType, setSelectedNeighbourhood, clearAllFilters, setSelectedNeighbourhoodPolygon, flyToNeighbourhoodBounds, setSelectedRiyadhCityPolygon, flyToRiyadhCityBounds } from '@/store/mapSlice';
import { getFilterOptions, getDependentFilterOptions } from '@/utils/filterData';
import { getNeighbourhoodPolygonsByName } from '@/utils/neighbourhoodPolygons';
import { getRiyadhCityPolygon, getRiyadhCityBounds } from '@/utils/riyadhCityPolygon';

const { Option } = Select;
const { Title, Text } = Typography;

interface MapFiltersProps {
  isNightMode?: boolean;
}

const MapFilters: React.FC<MapFiltersProps> = ({ isNightMode = false }) => {
  const dispatch = useDispatch();
  
  // Get filter states from Redux
  const selectedCity = useSelector((state: RootState) => state.map.selectedCity);
  const selectedUnitType = useSelector((state: RootState) => state.map.selectedUnitType);
  const selectedNeighbourhood = useSelector((state: RootState) => state.map.selectedNeighbourhood);

  // Get filter options from utility
  const { cities } = getFilterOptions();
  const { neighbourhoods, unitTypes } = getDependentFilterOptions(selectedCity, selectedNeighbourhood);

  const handleCityChange = (value: string) => {
    dispatch(setSelectedCity(value));
    // Clear neighbourhood and unit type when city changes
    dispatch(setSelectedNeighbourhood(null));
    dispatch(setSelectedUnitType(null));
    
    // Handle Riyadh city polygon
    if (value === 'Riyadh') {
      const riyadhPolygon = getRiyadhCityPolygon();
      const riyadhBounds = getRiyadhCityBounds();
      
      if (riyadhPolygon) {
        dispatch(setSelectedRiyadhCityPolygon(riyadhPolygon));
      }
      
      if (riyadhBounds) {
        dispatch(flyToRiyadhCityBounds(riyadhBounds));
      }
    } else {
      // Clear Riyadh city polygon if other city is selected
      dispatch(setSelectedRiyadhCityPolygon(null));
    }
  };

  const handleUnitTypeChange = (value: string) => {
    dispatch(setSelectedUnitType(value));
  };

  const handleNeighbourhoodChange = (value: string) => {
    dispatch(setSelectedNeighbourhood(value));
    // Clear unit type when neighbourhood changes
    dispatch(setSelectedUnitType(null));
    
    // Set neighbourhood polygons if neighbourhood is selected
    if (value) {
      const polygons = getNeighbourhoodPolygonsByName(value);
      // For now, we'll use the first polygon for the Redux state (keeping backward compatibility)
      // The MapComponent will handle multiple polygons
      dispatch(setSelectedNeighbourhoodPolygon(polygons.length > 0 ? polygons[0] : null));
      
      // Fly to neighbourhood bounds (calculate bounds from all polygons)
      if (polygons.length > 0) {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        
        // Calculate bounds from all polygons
        polygons.forEach(polygon => {
          if (polygon.geometry && polygon.geometry.coordinates) {
            const coordinates = polygon.geometry.coordinates[0]; // Get the first ring of the polygon
            coordinates.forEach((coord: number[]) => {
              const [lng, lat] = coord;
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
            });
          }
        });
        
        // Add some padding to the bounds
        const padding = 0.01; // About 1km padding
        const bounds = [
          [minLng - padding, minLat - padding],
          [maxLng + padding, maxLat + padding]
        ];
        
        // Dispatch action to fly to bounds
        dispatch(flyToNeighbourhoodBounds(bounds));
      }
    } else {
      dispatch(setSelectedNeighbourhoodPolygon(null));
    }
  };

  const clearFilters = () => {
    dispatch(clearAllFilters());
  };

  return (
    <Card
      style={{
        position: 'absolute',
        top: 10,
        left: 310,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: (selectedCity || selectedUnitType || selectedNeighbourhood) ? 600 : 500,
        backgroundColor: isNightMode ? '#1f2937' : '#ffffff',
        border: isNightMode ? '1px solid #374151' : '1px solid #d1d5db',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FilterOutlined style={{ color: isNightMode ? '#f9fafb' : '#374151' }} />
          <Title level={5} style={{ margin: 0, color: isNightMode ? '#f9fafb' : '#374151' }}>
            Map Filters
          </Title>
        </div>
        
        <Space wrap style={{ width: '100%' }}>
          <Tooltip title={!selectedCity ? "Select city to enable other filters" : ""}>
            <Select
              placeholder="Select City"
              value={selectedCity}
              onChange={handleCityChange}
              allowClear
              style={{ 
                width: '150px',
                color: isNightMode ? '#f9fafb' : '#374151'
              }}
              dropdownStyle={{
                backgroundColor: isNightMode ? '#1f2937' : '#ffffff',
                color: isNightMode ? '#f9fafb' : '#374151'
              }}
              className={isNightMode ? 'dark-mode-select' : ''}
            >
              {cities.map(city => (
                <Option key={city} value={city} style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>{city}</Option>
              ))}
            </Select>
          </Tooltip>

          <Tooltip title={!selectedCity ? 'Select city first to enable this filter' : ''}>
            <Select
              placeholder="Select Neighbourhood"
              value={selectedNeighbourhood}
              onChange={handleNeighbourhoodChange}
              allowClear
              disabled={!selectedCity}
              style={{ 
                width: '150px',
                color: !selectedCity ? (isNightMode ? '#6b7280' : '#9ca3af') : (isNightMode ? '#f9fafb' : '#374151')
              }}
              dropdownStyle={{
                backgroundColor: isNightMode ? '#1f2937' : '#ffffff',
                color: isNightMode ? '#f9fafb' : '#374151'
              }}
              className={`${isNightMode ? 'dark-mode-select' : ''} ${!selectedCity ? 'disabled-select' : ''}`}
            >
              {neighbourhoods.map(neighbourhood => (
                <Option key={neighbourhood} value={neighbourhood} style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>{neighbourhood}</Option>
              ))}
            </Select>
          </Tooltip>

          <Tooltip title={!selectedCity ? 'Select city first to enable this filter' : ''}>
            <Select
              placeholder="Select Unit Type"
              value={selectedUnitType}
              onChange={handleUnitTypeChange}
              allowClear
              disabled={!selectedCity}
              style={{ 
                width: '150px',
                color: !selectedCity ? (isNightMode ? '#6b7280' : '#9ca3af') : (isNightMode ? '#f9fafb' : '#374151')
              }}
              dropdownStyle={{
                backgroundColor: isNightMode ? '#1f2937' : '#ffffff',
                color: isNightMode ? '#f9fafb' : '#374151'
              }}
              className={`${isNightMode ? 'dark-mode-select' : ''} ${!selectedCity ? 'disabled-select' : ''}`}
            >
              {unitTypes.map(type => (
                <Option key={type} value={type} style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>{type}</Option>
              ))}
            </Select>
          </Tooltip>
            {(selectedCity || selectedUnitType || selectedNeighbourhood) && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: isNightMode ? '#f9fafb' : '#374151',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
        </Space>
      </Space>
    </Card>
  );
};

export default MapFilters; 