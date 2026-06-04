"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { gsiAerialStyle } from "../../lib/map/gsiStyle";
import { mapCenter } from "../../lib/map/sampleMapData";
import { AerialVisualFallback } from "./StaticMapOverlay";

export function MapCanvasLayer() {
  const mapNode = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapNode.current) return;

    const map = new maplibregl.Map({
      container: mapNode.current,
      style: gsiAerialStyle,
      center: mapCenter,
      zoom: 16.55,
      bearing: -8,
      pitch: 0,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("load", () => setReady(true));

    return () => map.remove();
  }, []);

  return (
    <>
      <AerialVisualFallback />
      <div
        ref={mapNode}
        className={`absolute inset-0 z-[1] transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        aria-label="国土地理院 空中写真マップ"
      />
    </>
  );
}
