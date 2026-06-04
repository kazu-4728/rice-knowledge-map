import { StaticMapOverlay } from "./StaticMapOverlay";

export function FieldOverlayLayer() {
  return (
    <>
      <StaticMapOverlay />
      <div className="pointer-events-none absolute inset-0 z-[11] bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_18%,transparent_76%,rgba(0,0,0,0.2))]" />
    </>
  );
}
