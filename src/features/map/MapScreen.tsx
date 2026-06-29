"use client";

import { useCallback, useState } from "react";
import MapClientWrapper from "./MapClientWrapper";
import MapSummarySheet from "./MapSummarySheet";

export default function MapScreen() {
  const [mapMode, setMapMode] = useState("browse");

  const handleModeChange = useCallback((mode: string) => {
    setMapMode(mode);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapClientWrapper onModeChange={handleModeChange} />
      <MapSummarySheet visible={mapMode === "browse"} />
    </div>
  );
}
