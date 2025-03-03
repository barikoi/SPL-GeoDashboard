"use client";
import MapComponent from "@/Components/MapComponent/MapComponent";
import LeftPanel from "@/Components/LeftPanel/LeftPanel";

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <LeftPanel />
      <MapComponent />
    </div>
  );
}
