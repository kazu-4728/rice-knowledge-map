"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FieldPoint } from "../../types";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";
import MapDetailCard from "./MapDetailCard";

const PIN_ICONS: Record<string, string> = {
  inlet: "💧",
  outlet: "⬇",
  caution: "⚠️",
  weed: "🌿",
};

const PIN_BG: Record<string, string> = {
  inlet: "#3B82F6",
  outlet: "#6B7280",
  caution: "#F97316",
  weed: "#22C55E",
};

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<FieldPoint | null>(null);

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: import("maplibre-gl").Map;

    import("maplibre-gl").then((maplibre) => {
      const container = mapContainerRef.current!;
      // コンテナに明示的な高さがなければ強制設定
      if (!container.offsetHeight) {
        container.style.height = "100%";
      }

      map = new maplibre.Map({
        container: mapContainerRef.current!,
        style: {
          version: 8,
          sources: {
            gsi: {
              type: "raster",
              tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
              tileSize: 256,
              attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
            },
          },
          layers: [{ id: "gsi-layer", type: "raster", source: "gsi" }],
        },
        center: [138.830, 37.428],
        zoom: 15,
      });

      mapRef.current = map;

      map.on("error", (e) => {
        console.error("[MapLibre error]", e);
      });

      map.on("load", () => {
        // コンテナサイズが変わっている場合リサイズ
        map.resize();
        // 田んぼポリゴン追加
        map.addSource("fields", { type: "geojson", data: fieldGeoJSON as import("maplibre-gl").GeoJSONSourceSpecification["data"] });

        map.addLayer({
          id: "fields-fill",
          type: "fill",
          source: "fields",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.35,
          },
        });

        map.addLayer({
          id: "fields-outline",
          type: "line",
          source: "fields",
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
          },
        });

        // 田んぼラベル
        map.addLayer({
          id: "fields-label",
          type: "symbol",
          source: "fields",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 14,
            "text-font": ["Open Sans Regular"],
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0,0,0,0.5)",
            "text-halo-width": 1.5,
          },
        });

        // ピン（MapLibre Marker）を追加
        fieldPoints.forEach((point) => {
          const el = document.createElement("div");
          el.style.cssText = `
            width: 32px; height: 32px; border-radius: 50%;
            background: ${PIN_BG[point.type]};
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          `;
          el.textContent = PIN_ICONS[point.type];
          el.title = point.name;

          // needs_check の場合は赤い点滅リングを追加
          if (point.status === "needs_check") {
            el.style.border = "2px solid #F97316";
            el.style.animation = "pulse 1.5s infinite";
          }

          el.addEventListener("click", () => {
            setSelectedPoint(point);
          });

          new maplibre.Marker({ element: el })
            .setLngLat(point.lngLat)
            .addTo(map);
        });
      });
    });

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {/* マップコンテナ: MapLibre が管理するキャンバス */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* フィルターバー */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow text-xs font-medium text-gray-700">
          <span>🗺️</span>
          <span>マップ</span>
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1.5 pb-0.5">
            {["すべて", "水口", "異常", "圃場"].map((label, i) => (
              <button
                key={label}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full shadow transition-colors ${
                  i === 0 ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button className="bg-white rounded-xl px-3 py-1.5 shadow text-xs text-gray-600 shrink-0">
          🔲 圃場一覧
        </button>
      </div>

      {/* 凡例 */}
      <div className="absolute top-16 left-3 z-10 bg-white rounded-xl shadow p-2 space-y-1">
        {[
          { icon: "💧", label: "入水口", color: "#3B82F6" },
          { icon: "⬇", label: "出水口", color: "#6B7280" },
          { icon: "⚠️", label: "異常箇所", color: "#F97316" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white border border-white"
              style={{ background: item.color, fontSize: "10px" }}
            >
              {item.icon}
            </span>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* ズームコントロール */}
      <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-600 text-lg font-bold hover:bg-gray-50"
        >+</button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-600 text-lg font-bold hover:bg-gray-50"
        >−</button>
        <button
          onClick={() => mapRef.current?.flyTo({ center: [138.830, 37.428], zoom: 15 })}
          className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-500 text-sm hover:bg-gray-50"
        >⊙</button>
      </div>

      {/* 詳細カード */}
      <MapDetailCard point={selectedPoint} onClose={() => setSelectedPoint(null)} />
    </div>
  );
}
