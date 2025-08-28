'use client';
import React from 'react';
import MapComponent from '@/components/MapComponent/MapComponent';
import LeftPanel from '@/components/LeftPanel/LeftPanel';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden">
      <LeftPanel />
      <MapComponent />
    </div>
  );
};

export default Dashboard; 