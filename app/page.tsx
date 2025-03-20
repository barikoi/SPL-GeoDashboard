'use client';
import MapComponent from '@/components/MapComponent/MapComponent';
import LeftPanel from '@/components/LeftPanel/LeftPanel';

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden">
      <LeftPanel />
      <MapComponent />
    </div>
  );
}
