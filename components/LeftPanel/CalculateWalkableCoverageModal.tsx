import React, { useState } from 'react';
import { Modal, Radio, Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setIsWalkableCoverageModalVisible, setSelectedOptionForWalkableCoverage, showIsochrones } from '@/store/mapSlice';

const CalculateWalkableCoverageModal = () => {
  const dispatch = useDispatch();

  // Redux States
  const isWalkableCoverageModalVisible = useSelector((state: RootState) => state.map.isWalkableCoverageModalVisible);
  const selectedOptionForWalkableCoverage = useSelector((state: RootState) => state.map.selectedOptionForWalkableCoverage);

  const handleCancel = () => {
    dispatch(setIsWalkableCoverageModalVisible(false))
  };

  const handleCalculate = () => {
    // Add your calculation logic here based on selectedOption
    dispatch(showIsochrones(true));  
    // Dispatch a custom event to trigger coverage calculation in MapComponent
    const event = new CustomEvent("calculateCoverage", {
      detail: { triggered: true }
    });
    dispatch(setIsWalkableCoverageModalVisible(false))
  };

  return (
    <div>
      <Modal
        title="Calculate Walkable Coverage"
        open={isWalkableCoverageModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="calculate" type="primary" onClick={handleCalculate}>
            Calculate
          </Button>,
        ]}
      >
        <Radio.Group
          onChange={(e) => dispatch(setSelectedOptionForWalkableCoverage(e.target.value))}
          value={selectedOptionForWalkableCoverage}
        >
          <Radio value="parcelat">Parcelat Points</Radio>
          <Radio value="competitor">Competitor Points</Radio>
        </Radio.Group>
      </Modal>
    </div>
  );
};

export default CalculateWalkableCoverageModal;