import { Col, Row } from 'antd'
import React, { useEffect, useState } from 'react'
import StyledSelect from '../Common/StyledSelect'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import * as Papa from 'papaparse';
import { setSelectedGender,  setSelectedNationality, setSelectedOccupationMode, setSelectedAgeGroup } from '@/store/filterSlice';

const FilterPanel = () => {
  const dispatch = useDispatch();
  const populationFileForFilter = useSelector((state: RootState) => state.filter.populationFileForFilter); 
  const isShowPopulationFilter = useSelector((state: RootState) => state.filter.isShowPopulationFilter); 
  const selectedGender = useSelector((state: RootState) => state.filter.selectedGender); 
  const selectedNationality = useSelector((state: RootState) => state.filter.selectedNationality); 
  const selectedOccupationMode = useSelector((state: RootState) => state.filter.selectedOccupationMode); 
  const selectedAgeGroup = useSelector((state: RootState) => state.filter.selectedAgeGroup); 
  const isNightMode = useSelector((state: RootState) => state.map.isNightMode);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [occupationModes, setOccupationModes] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);

  useEffect(() => {
    if (populationFileForFilter) {
      Papa.parse(populationFileForFilter, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const data = results.data;
          
          // Get unique values for each column
          // @ts-ignore
          const uniqueNationalities = [...new Set(data.map((row:any) => { 
            const value = row.nationality || row.Nationality;
            return value && typeof value === 'string' ? value.toLowerCase() : null;
          }).filter(val => val !== null && val !== 'null'))];
          // @ts-ignore
          const uniqueGenders = [...new Set(data.map((row:any) => {
            const value = row.gender || row.Gender;
            return value && typeof value === 'string' ? value.toLowerCase() : null;
          }).filter(val => val !== null && val !== 'null'))];
          // @ts-ignore
          const uniqueOccupationModes = [...new Set(data.map((row:any) => {
            const value = row.occupationmode || row.OccupationMode || row.occupationMode;
            return value && typeof value === 'string' ? value.toLowerCase() : null;
          }).filter(val => val !== null && val !== 'null'))];
          // @ts-ignore
          const uniqueAgeGroups = [...new Set(data.map((row:any) => {
            const value = row['age group'] || row['Age Group'];
            return value && typeof value === 'string' ? value.toLowerCase() : null;
          }).filter(val => val !== null && val !== 'null'))];

          setNationalities(uniqueNationalities);
          setGenders(uniqueGenders);
          setOccupationModes(uniqueOccupationModes);
          setAgeGroups(uniqueAgeGroups);
          
        }
      });
    }
  }, [populationFileForFilter]);

  // Filter function
  const filterData = (data: any[]) => {
    return data.filter(row => {
      const genderMatch = !selectedGender || 
        (row.gender || row.Gender)?.toLowerCase() === selectedGender.toLowerCase();
      const nationalityMatch = !selectedNationality || 
        (row.nationality || row.Nationality)?.toLowerCase() === selectedNationality.toLowerCase();
      const occupationMatch = !selectedOccupationMode || 
        (row.occupationmode || row.OccupationMode || row.occupationMode)?.toLowerCase() === selectedOccupationMode.toLowerCase();
      const ageMatch = !selectedAgeGroup || 
        (row['age group'] || row['Age Group'])?.toLowerCase() === selectedAgeGroup.toLowerCase();
      
      return genderMatch && nationalityMatch && occupationMatch && ageMatch;
    });
  };

  // Dispatch event function
  const filterAndDispatchEvent = (data: any[]) => {
    const filteredData = filterData(data);
    console.log({filteredData})
    const event = new CustomEvent("populationData", {
      detail: filteredData
    });
    window.dispatchEvent(event);
  };

  // Watch for filter changes
  useEffect(() => {
    if (populationFileForFilter) {
      Papa.parse(populationFileForFilter, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          filterAndDispatchEvent(results.data);
        }
      });
    }
  }, [selectedGender, selectedNationality, selectedOccupationMode, selectedAgeGroup]);

  // On set Selected Gender
  const _onSetSelectedGender = (data: any) => {
    dispatch(setSelectedGender(data?.value ?? ''))
  }
  
  // On set Selected Nationality
  const _onSetSelectedNationality = (data: any) => {
    dispatch(setSelectedNationality(data?.value ?? ''))
  }
  
  // On set Selected OccupationMode
  const _onSetSelectedOccupationMode = (data: any) => {
    dispatch(setSelectedOccupationMode(data?.value ?? ''))
  } 
  
  // On set Selected AgeGroup
  const _onSetSelectedAgeGroup = (data: any) => {
    dispatch(setSelectedAgeGroup(data?.value ?? ''))
  }

  return (
    <div>
      {
        isShowPopulationFilter && (
          <>
            <span className={`text-xs md:text-sm font-semibold ${
              isNightMode ? "text-gray-200" : "text-gray-700"
            }`}>Filters</span>
            <Row gutter={[32, 8]}>
              <Col span={24} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <span className="field-label roboto-font">Gender</span>
                  <StyledSelect
                    options={genders.map(gender => ({ label: gender.charAt(0).toUpperCase() + gender.slice(1), value: gender }))}
                    placeholder="Select Gender"
                    onChange={ _onSetSelectedGender }
                    value={ selectedGender }
                    clearText
                  />
                </div>
              </Col>
              <Col span={24} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <span className="field-label roboto-font">Nationality</span>
                  <StyledSelect
                    options={nationalities.map(nationality => ({ label: nationality.charAt(0).toUpperCase() + nationality.slice(1), value: nationality }))}
                    placeholder="Select Nationality"
                    onChange={ _onSetSelectedNationality }
                    value={ selectedNationality }
                    clearText
                  />
                </div>
              </Col>
              <Col span={24} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <span className="field-label roboto-font">Occupation Mode</span>
                  <StyledSelect
                    options={occupationModes.map(mode => ({ label: mode.charAt(0).toUpperCase() + mode.slice(1), value: mode }))}
                    placeholder="Select Occupation Mode"
                    onChange={ _onSetSelectedOccupationMode }
                    value={ selectedOccupationMode }
                    clearText
                  />
                </div>
              </Col>
              <Col span={24} style={{ display: 'flex', gap: 16, marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <span className="field-label roboto-font">Age Group</span>
                  <StyledSelect
                    options={ageGroups.map(age => ({ label: age.charAt(0).toUpperCase() + age.slice(1), value: age }))}
                    placeholder="Select Age Group"
                    onChange={ _onSetSelectedAgeGroup }
                    value={ selectedAgeGroup }
                    clearText
                  />
                </div>
              </Col>
            </Row>
          </>
        )
      }
    </div>
  )
}

export default FilterPanel