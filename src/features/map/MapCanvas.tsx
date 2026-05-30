"use client";

import { useEffect, useRef, useState } from "react";
import type { Field, FieldPoint } from "@/features/preview/types";

type MapCanvasProps = {
  fields: Field[];
  points: FieldPoint[];
  selectedPointId: string;
  onSelectPoint: (point: FieldPoint) => void;
};

const fieldShapes: Record<string, { className: string; labelX: number; labelY: number }> = {
  "field-a": { className: "fieldShape fieldShapeA", labelX: 34, labelY: 48 },
  "field-b": { className: "fieldShape fieldShapeB", labelX: 74, labelY: 36 },
  "field-c": { className: "fieldShape fieldShapeC", labelX: 72, labelY: 62 },
  "field-d": { className: "fieldShape fieldShapeD", labelX: 32, labelY: 72 },
};

function pointClass(point: FieldPoint) {
  if (point.type === "inlet") return "mapPin inletPin";
  if (point.type === "outlet") return "mapPin outletPin";
  if (point.type === "caution") return "mapPin cautionPin";
  return "mapPin weedPin";
}

function pointLabel(point: FieldPoint) {
  if (point.type === "inlet") return "入水口";
  if (point.type === "outlet") return "出水口";
  if (point.type === "caution") return "水位異常";
  return "雑草";
}

export function MapCanvas({ fields, points, selectedPointId, onSelectPoint }: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function mountMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          center: [138.89, 37.42],
          zoom: 15,
          interactive: false,
          attributionControl: false,
          style: {
            version: 8,
            sources: {
              "gsi-photo": {
                type: "raster",
                tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
                tileSize: 256,
                attribution: "国土地理院タイル",
              },
            },
            layers: [
              {
                id: "gsi-photo-layer",
                type: "raster",
                source: "gsi-photo",
              },
            ],
          },
        });

        map.on("load", () => {
          if (!cancelled) setMapReady(true);
        });
        map.on("error", () => {
          if (!cancelled) setMapReady(false);
        });

        mapRef.current = map;
      } catch {
        if (!cancelled) setMapReady(false);
      }
    }

    mountMap();

    return () => {
      cancelled = true;
      const currentMap = mapRef.current as { remove?: () => void } | null;
      currentMap?.remove?.();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`mapCanvas ${mapReady ? "mapCanvas-live" : ""}`}>
      <div ref={mapContainerRef} className="mapLibreLayer" aria-hidden="true" />
      <div className="mapFallbackLayer" aria-hidden="true" />
      <div className="waterway waterwayNorth" aria-hidden="true" />
      <div className="waterway waterwayCenter" aria-hidden="true" />
      <div className="road roadMain" aria-hidden="true" />
      <div className="road roadSide" aria-hidden="true" />

      {fields.map((field) => {
        const shape = fieldShapes[field.id];
        return <div key={field.id} className={`${shape.className} field-${field.color}`} />;
      })}

      {fields.map((field) => {
        const shape = fieldShapes[field.id];
        return (
          <span
            key={`${field.id}-label`}
            className="fieldMapLabel"
            style={{ left: `${shape.labelX}%`, top: `${shape.labelY}%` }}
          >
            {field.label}
          </span>
        );
      })}

      {points.map((point) => {
        const selected = point.id === selectedPointId;
        return (
          <button
            key={point.id}
            type="button"
            className={`${pointClass(point)} ${selected ? "selected" : ""}`.trim()}
            style={{ left: `${point.position.x}%`, top: `${point.position.y}%` }}
            onClick={() => onSelectPoint(point)}
            aria-label={point.name}
          >
            <span className="pinDot" />
            <span className="pinLabel">{pointLabel(point)}</span>
          </button>
        );
      })}

      <span className="mapAttribution">国土地理院タイル / Preview fallback</span>
    </div>
  );
}
