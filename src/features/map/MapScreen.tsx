"use client";

import { useCallback, useState } from "react";
import MapClientWrapper from "./MapClientWrapper";
import MapSummarySheet from "./MapSummarySheet";
import TodayStory from "../story/TodayStory";

export default function MapScreen() {
  const [mapMode, setMapMode] = useState("browse");
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // MapSummarySheetの「最初の田んぼを登録する」CTAからMapCanvasの場所合わせを起動する（Issue #69）
  const [registerTrigger, setRegisterTrigger] = useState(0);

  const handleModeChange = useCallback((mode: string) => {
    setMapMode(mode);
  }, []);

  const handleExpandChange = useCallback((expanded: boolean) => {
    setSheetExpanded(expanded);
  }, []);

  const handleRegisterField = useCallback(() => {
    setRegisterTrigger((n) => n + 1);
  }, []);

  const isBrowse = mapMode === "browse";

  return (
    <div className="relative h-full w-full">
      <MapClientWrapper onModeChange={handleModeChange} hideControls={sheetExpanded} registerTrigger={registerTrigger} />
      <MapSummarySheet visible={isBrowse} onExpandChange={handleExpandChange} onRegisterField={handleRegisterField} />
      {/* 1日1回のオープニングストーリー（閉じるとマップに着地する） */}
      <TodayStory />
    </div>
  );
}
