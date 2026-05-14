import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Spin, Button } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import splLogo from "../../app/images/spl_logo.png";

interface SearchResult {
  id: string;
  poi_id: string;
  name_en: string;
  name_ar: string;
  name?: string;
  address_en?: string;
  address_ar?: string;
  category?: string;
  sub_category?: string;
  poi_type?: string;
  poi_priority?: string;
  country?: string;
  country_ar?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  location?: number[];
  geom?: number[];
  city_en?: string;
  city_ar?: string;
  city_id?: string;
  district_en?: string;
  district_ar?: string;
  district_id?: string;
  governorate_en?: string;
  governorate_ar?: string;
  governorate_id?: string;
  region_en?: string;
  region_ar?: string;
  region_id?: string;
  zip_code?: string;
  popularity_ranking?: number;
  source?: string;
  addendum_json?: Record<string, any>;
}

interface SearchBarProps {
  onLocationSelect: (location: SearchResult) => void;
  showPolygon?: (geojson: any, locationInfo: any) => void;
  flyToLocation?: (coordinates: [number, number], zoom?: number) => void;
  externalSearchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onClear?: () => void; // New prop for clearing markers/polygons
}

const SearchBar: React.FC<SearchBarProps> = ({
  onLocationSelect,
  showPolygon,
  flyToLocation,
  externalSearchValue,
  onSearchValueChange,
  onClear,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode; data: SearchResult }[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update search value when external value changes
  useEffect(() => {
    if (externalSearchValue !== undefined && externalSearchValue !== searchValue) {
      setSearchValue(externalSearchValue);
      if (externalSearchValue.length >= 2) {
        searchLocations(externalSearchValue);
      } else {
        setOptions([]);
      }
    }
  }, [externalSearchValue]);

  // Debounced search function
  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        'https://na-maps.vng-solutions.com/spl/api/v2.0/search/autocomplete',
        {
          params: {
            q: query,
            limit: 10,
            page: 1,
          },
          headers: {
            'accept': 'application/json',
            'X-API-KEY': process.env.NEXT_PUBLIC_AUTOCOMPLETE_API_KEY || '',
          },
        }
      );

      if (response.data && response.data.results) {
        const searchOptions = response.data.results.map((result: SearchResult, index: number) => ({
          value: `${result.name_en}-${index}`,
          label: (
            <div className="flex flex-col">
              {/* Logo & Name */}
              <div className="flex items-center">
                <img src={splLogo.src} alt="SPL Logo" className="w-4 h-5 mr-2" />
                <span className="font-bold mr-2">{result.name_en}</span>
                {result.name_ar && (
                  <span className="font-bold mr-2 text-gray-600" dir="rtl">{result.name_ar}</span>
                )}
              </div>

              {/* Address & Category */}
              {result.address_en && (
                <div className="flex flex-col mt-1 ml-6">
                  <span className="text-xs text-gray-500 font-medium">{result.address_en}</span>
                  {result.address_ar && result.address_ar !== result.address_en && (
                    <span className='text-xs text-gray-400' dir='rtl'>
                      {result.address_ar}
                    </span>
                  )}
                  {result.category && (
                    <span className="text-xs text-gray-400 mt-1">{`(${result.sub_category})`}</span>
                  )}
                </div>
              )}
            </div>

          ),
          data: result,
        }));
        setOptions(searchOptions);
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearchValueChange) {
      onSearchValueChange(value);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 1000);
  };

  // Handle selection from dropdown
  // Handle selection from dropdown
  const handleSelect = (_value: string, option: any) => {
    const selectedResult = option.data as SearchResult;
    // Set search bar value to the selected English name
    setSearchValue(selectedResult.name_en);
    if (onSearchValueChange) {
      onSearchValueChange(selectedResult.name_en);
    }

    onLocationSelect(selectedResult);

    if (showPolygon) {
      const locationInfo = {
        name_en: selectedResult.name_en,
        name_ar: selectedResult.name_ar,
        address_en: selectedResult.address_en,
        address_ar: selectedResult.address_ar,
        category: selectedResult.category,
        sub_category: selectedResult.sub_category,
        country: selectedResult.country,
      };

      if (selectedResult.geom && selectedResult.geom.length > 0) {
        showPolygon(selectedResult.geom, locationInfo);
      } else if (selectedResult.latitude && selectedResult.longitude) {
        const coordinates: [number, number] = [selectedResult.longitude, selectedResult.latitude];
        showPolygon(coordinates, locationInfo);
      }
    }

    if (selectedResult.latitude && selectedResult.longitude && flyToLocation) {
      flyToLocation([selectedResult.longitude, selectedResult.latitude], 14);
    }

    // Do not clear options to allow dropdown to persist
  };

  // Handle focus to show dropdown
  const handleFocus = () => {
    if (searchValue.length >= 2) {
      searchLocations(searchValue);
    }
  };

  // Handle blur to clear options only if search bar is empty
  const handleBlur = () => {
    setTimeout(() => {
      if (!searchValue) {
        setOptions([]);
      }
    }, 200);
  };

  // Handle clear button click
  const handleClear = () => {
    setSearchValue('');
    setOptions([]);
    if (onSearchValueChange) {
      onSearchValueChange('');
    }
    if (onClear) {
      onClear();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-[14px] left-16 z-[1000]">
      <AutoComplete
        value={searchValue}
        options={options}
        style={{ width: 400 }}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search for places..."
        notFoundContent={loading ? <Spin size="small" /> : 'No results found'}
        className='search-bar'
      >
        <Input
          size="large"
          className="shadow-lg"
          prefix={<SearchOutlined />}
          suffix={
            searchValue && (
              <CloseOutlined
                onClick={handleClear}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                title="Clear search and remove markers"
              />
            )
          }
        />
      </AutoComplete>
    </div>
  );
};

export default SearchBar;