"use client";

import { useCallback, useState } from "react";
import MapClientWrapper from "./MapClientWrapper";
import MapSummarySheet from "./MapSummarySheet";

export default function MapScreen() {
  const [mapMode, setMapMode] = useState("browse");
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const handleModeChange = useCallback((mode: string) => {
    setMapMode(mode);
  }, []);

  const handleExpandChange = useCallback((expanded: boolean) => {
    setSheetExpanded(expanded);
  }, []);

  const isBrowse = mapMode === "browse";

  return (
    <div className="relative h-full w-full">
      <MapClientWrapper onModeChange={handleModeChange} hideControls={sheetExpanded} />
      <MapSummarySheet visible={isBrowse} onExpandChange={handleExpandChange} />
    </div>
  );
}
