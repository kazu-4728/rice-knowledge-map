"use client";

import dynamic from "next/dynamic";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-gray-500 text-sm">地図を読み込み中...</p>
    </div>
  ),
});

type Props = {
  onModeChange?: (mode: string) => void;
  hideControls?: boolean;
  registerTrigger?: number;
};

export default function MapClientWrapper({ onModeChange, hideControls, registerTrigger }: Props) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapCanvas onModeChange={onModeChange} hideControls={hideControls} registerTrigger={registerTrigger} />
    </div>
  );
}
