"use client";
import MapComponent from "@/Components/MapComponent/MapComponent";
import LeftPanel from "@/Components/LeftPanel/LeftPanel";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden">
      <LeftPanel />
      <MapComponent />
    </div>
  );
}
