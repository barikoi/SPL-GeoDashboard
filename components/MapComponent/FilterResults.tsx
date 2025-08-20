import React from 'react';
import { Card, Statistic, Row, Col, Typography } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getFilteredData } from '@/utils/filterData';

const { Title, Text } = Typography;

interface FilterResultsProps {
  isNightMode?: boolean;
}

const FilterResults: React.FC<FilterResultsProps> = ({ isNightMode = false }) => {
  const selectedCity = useSelector((state: RootState) => state.map.selectedCity);
  const selectedUnitType = useSelector((state: RootState) => state.map.selectedUnitType);
  const selectedNeighbourhood = useSelector((state: RootState) => state.map.selectedNeighbourhood);

  const filteredData = getFilteredData(selectedCity, selectedUnitType, selectedNeighbourhood);

  // Calculate aggregated statistics
  const totalTransactions = filteredData.reduce((sum, item) => sum + (item.totalNumberOfTransactions || 0), 0);
  const avgRentApartment = filteredData
    .filter(item => item.avgRentApartment)
    .reduce((sum, item) => sum + (item.avgRentApartment || 0), 0) / 
    filteredData.filter(item => item.avgRentApartment).length || 0;
  
  const avgRentVilla = filteredData
    .filter(item => item.avgRentVilla)
    .reduce((sum, item) => sum + (item.avgRentVilla || 0), 0) / 
    filteredData.filter(item => item.avgRentVilla).length || 0;

  const avgLandArea = filteredData
    .filter(item => item.avgLandArea)
    .reduce((sum, item) => sum + (item.avgLandArea || 0), 0) / 
    filteredData.filter(item => item.avgLandArea).length || 0;

  const avgUnitPrice = filteredData
    .filter(item => item.avgUnitPrice)
    .reduce((sum, item) => sum + (item.avgUnitPrice || 0), 0) / 
    filteredData.filter(item => item.avgUnitPrice).length || 0;

  const avgPricePerSqm = filteredData
    .filter(item => item.avgPricePerSqm)
    .reduce((sum, item) => sum + (item.avgPricePerSqm || 0), 0) / 
    filteredData.filter(item => item.avgPricePerSqm).length || 0;

  const totalTransactionAmountSAR = filteredData
    .filter(item => item.totalTransactionAmountSAR)
    .reduce((sum, item) => sum + (item.totalTransactionAmountSAR || 0), 0);

  // Only show results if city is selected
  if (!selectedCity) {
    return null;
  }

  return (
    <Card
      style={{
        position: 'absolute',
        top: 120,
        left: 10,
        zIndex: 1000,
        width: 250,
        backgroundColor: isNightMode ? '#1f2937' : '#ffffff',
        border: isNightMode ? '1px solid #374151' : '1px solid #d1d5db',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Title level={5} style={{ margin: 0, marginBottom: '16px', color: isNightMode ? '#f9fafb' : '#374151' }}>
        Filter Results
      </Title>
      
      <Row gutter={[16, 16]}>
        {/* Average Rent */}
        {avgRentApartment > 0 && (
          <Col span={24}>
            <Statistic
              title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Avg Rent (Apartment)</span>}
              value={avgRentApartment.toFixed(0)}
              suffix="SAR"
              valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
              style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
            />
          </Col>
        )}
        {avgRentVilla > 0 && (
          <Col span={24}>
            <Statistic
              title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Avg Rent (Villa)</span>}
              value={avgRentVilla.toFixed(0)}
              suffix="SAR"
              valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
              style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
            />
          </Col>
        )}
        
        {/* Avg Land Area */}
        <Col span={24}>
          <Statistic
            title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Avg Land Area (SQM)</span>}
            value={avgLandArea.toFixed(1)}
            suffix="SQM"
            valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
            style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
          />
        </Col>
        
        {/* Avg Unit Price */}
        <Col span={24}>
          <Statistic
            title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Avg Unit Price (Million SAR)</span>}
            value={avgUnitPrice.toFixed(2)}
            suffix="M SAR"
            valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
            style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
          />
        </Col>
        
        {/* Average Price Per Sqm */}
        <Col span={24}>
          <Statistic
            title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Average Price Per Sqm</span>}
            value={avgPricePerSqm.toFixed(0)}
            suffix="SAR"
            valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
            style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
          />
        </Col>
        
        {/* Total Transaction Amount */}
        <Col span={24}>
          <Statistic
            title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Total Transaction Amount (SAR)</span>}
            value={(totalTransactionAmountSAR / 1000000).toFixed(1)}
            suffix="M SAR"
            valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
            style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
          />
        </Col>
        
        {/* Total Number Of Transactions */}
        <Col span={24}>
          <Statistic
            title={<span style={{ color: isNightMode ? '#f9fafb' : '#374151' }}>Total Number Of Transactions</span>}
            value={totalTransactions}
            valueStyle={{ color: isNightMode ? '#f9fafb' : '#374151', fontSize: '16px' }}
            style={{ color: isNightMode ? '#f9fafb' : '#374151' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default FilterResults; 