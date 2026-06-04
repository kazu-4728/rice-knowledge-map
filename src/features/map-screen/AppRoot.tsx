import { DesktopRail } from "./DesktopRail";
import { DesktopSidePanel } from "./DesktopSidePanel";
import { FieldOverlayLayer } from "./FieldOverlayLayer";
import { FloatingMapControls } from "./FloatingMapControls";
import { MapCanvasLayer } from "./MapCanvasLayer";
import { MapLegend } from "./MapLegend";
import { MapTopBar } from "./MapTopBar";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { MobileBottomSheet } from "./MobileBottomSheet";

type Props = {
  activeTab?: MobileTab;
};

export function AppRoot({ activeTab = "map" }: Props) {
  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-[#26351e] text-black">
      <MapCanvasLayer />
      <FieldOverlayLayer />
      <div className="pointer-events-none absolute inset-0 z-[12] bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.12),transparent_22%,transparent_72%,rgba(0,0,0,0.22))]" />
      <DesktopRail active={activeTab} />
      <MapTopBar />
      <MapLegend />
      <FloatingMapControls />
      <DesktopSidePanel />
      <MobileBottomSheet />
      <MobileBottomNav active={activeTab} />
    </main>
  );
}
