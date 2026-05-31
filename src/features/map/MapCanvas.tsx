"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FieldPoint } from "../../types";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";
import MapDetailCard from "./MapDetailCard";
import FieldDrawOverlay from "./FieldDrawOverlay";
import FieldNameDialog from "./FieldNameDialog";
import { useFieldDraw } from "./useFieldDraw";

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

  const {
    drawState,
    pendingName,
    setPendingName,
    startDraw,
    addVertex,
    finishDraw,
    cancelDraw,
    saveName,
    undoVertex,
    drawingGeoJSON,
    savedFieldsGeoJSON,
  } = useFieldDraw();

  const isDrawing = drawState.mode === "drawing";
  const isNaming = drawState.mode === "naming";
  const vertexCount = drawState.mode === "drawing" ? drawState.vertices.length : 0;

  // map click → 描画モード時に頂点追加
  const handleMapClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (!isDrawing) return;
      addVertex([e.lngLat.lng, e.lngLat.lat]);
    },
    [isDrawing, addVertex]
  );

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: import("maplibre-gl").Map;

    import("maplibre-gl").then((maplibre) => {
      const container = mapContainerRef.current!;
      if (!container.offsetHeight) container.style.height = "100%";

      map = new maplibre.Map({
        container,
        style: {
          version: 8,
          sources: {
            gsi: {
              type: "raster",
              tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
              tileSize: 256,
              attribution:
                "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
            },
          },
          layers: [{ id: "gsi-layer", type: "raster", source: "gsi" }],
        },
        center: [138.830, 37.428],
        zoom: 15,
      });

      mapRef.current = map;

      map.on("error", (e) => console.error("[MapLibre error]", e));

      map.on("load", () => {
        map.resize();

        // ── ダミー田んぼポリゴン ──────────────────────
        map.addSource("fields", {
          type: "geojson",
          data: fieldGeoJSON as import("maplibre-gl").GeoJSONSourceSpecification["data"],
        });
        map.addLayer({ id: "fields-fill", type: "fill", source: "fields",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 } });
        map.addLayer({ id: "fields-outline", type: "line", source: "fields",
          paint: { "line-color": "#ffffff", "line-width": 2 } });
        map.addLayer({ id: "fields-label", type: "symbol", source: "fields",
          layout: { "text-field": ["get", "name"], "text-size": 14,
            "text-font": ["Open Sans Regular"], "text-anchor": "center" },
          paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.5)", "text-halo-width": 1.5 } });

        // ── ユーザー描画済みポリゴン ──────────────────
        map.addSource("user-fields", { type: "geojson",
          data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "user-fields-fill", type: "fill", source: "user-fields",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.4 } });
        map.addLayer({ id: "user-fields-outline", type: "line", source: "user-fields",
          paint: { "line-color": "#ffffff", "line-width": 2.5 } });
        map.addLayer({ id: "user-fields-label", type: "symbol", source: "user-fields",
          layout: { "text-field": ["get", "name"], "text-size": 14,
            "text-font": ["Open Sans Regular"], "text-anchor": "center" },
          paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.6)", "text-halo-width": 1.5 } });

        // ── 描画中プレビュー（線・頂点） ───────────────
        map.addSource("drawing", { type: "geojson",
          data: { type: "FeatureCollection", features: [] } });
        // 輪郭線
        map.addLayer({ id: "drawing-line", type: "line", source: "drawing",
          filter: ["==", "$type", "LineString"],
          paint: { "line-color": "#2563EB", "line-width": 2.5,
            "line-dasharray": [4, 3] } });
        // 頂点（円）
        map.addLayer({ id: "drawing-vertex", type: "circle", source: "drawing",
          filter: ["==", "$type", "Point"],
          paint: { "circle-radius": 7, "circle-color": "#ffffff",
            "circle-stroke-color": "#2563EB", "circle-stroke-width": 2.5 } });
        // 最初の頂点（濃い青で強調）
        map.addLayer({ id: "drawing-vertex-first", type: "circle", source: "drawing",
          filter: ["all", ["==", "$type", "Point"], ["==", ["get", "isFirst"], true]],
          paint: { "circle-radius": 9, "circle-color": "#2563EB",
            "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });

        // ── ピン（Marker） ──────────────────────────────
        fieldPoints.forEach((point) => {
          const el = document.createElement("div");
          el.style.cssText = `
            width:32px;height:32px;border-radius:50%;
            background:${PIN_BG[point.type]};
            display:flex;align-items:center;justify-content:center;
            font-size:14px;cursor:pointer;
            border:2px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          `;
          el.textContent = PIN_ICONS[point.type];
          if (point.status === "needs_check") {
            el.style.border = "2px solid #F97316";
          }
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedPoint(point);
          });
          new maplibre.Marker({ element: el }).setLngLat(point.lngLat).addTo(map);
        });
      });
    });

    return () => {
      if (map) { map.remove(); mapRef.current = null; }
    };
   
  }, []);

  // 描画クリックイベントの付け外し
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (isDrawing) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleMapClick);
    } else {
      map.getCanvas().style.cursor = "";
      map.off("click", handleMapClick);
    }
    return () => {
      map.off("click", handleMapClick);
    };
  }, [isDrawing, handleMapClick]);

  // 描画中 GeoJSON を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("drawing");
    if (src) src.setData(drawingGeoJSON);
  }, [drawingGeoJSON]);

  // 保存済みフィールド GeoJSON を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("user-fields");
    if (src) src.setData(savedFieldsGeoJSON);
  }, [savedFieldsGeoJSON]);

  return (
    <div className="absolute inset-0">
      {/* マップキャンバス */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* ── 通常モード UI ─────────────────────────────── */}
      {!isDrawing && !isNaming && (
        <>
          {/* フィルターバー */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow text-xs font-medium text-gray-700">
              <span>🗺️</span><span>マップ</span>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-1.5 pb-0.5">
                {["すべて", "水口", "異常", "圃場"].map((label, i) => (
                  <button key={label}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full shadow transition-colors ${
                      i === 0 ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >{label}</button>
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
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white"
                  style={{ background: item.color, fontSize: "10px" }}>
                  {item.icon}
                </span>
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>

          {/* ズーム + 田んぼ追加ボタン */}
          <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-1">
            <button onClick={() => mapRef.current?.zoomIn()}
              className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-600 text-lg font-bold hover:bg-gray-50">+</button>
            <button onClick={() => mapRef.current?.zoomOut()}
              className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-600 text-lg font-bold hover:bg-gray-50">−</button>
            <button onClick={() => mapRef.current?.flyTo({ center: [138.830, 37.428], zoom: 15 })}
              className="bg-white w-9 h-9 rounded-xl shadow flex items-center justify-center text-gray-500 text-sm hover:bg-gray-50">⊙</button>
          </div>

          {/* ＋田んぼを追加 ボタン */}
          <div className="absolute bottom-4 left-3 z-10">
            <button
              onClick={startDraw}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg transition-colors"
            >
              <span className="text-base">＋</span>
              田んぼを追加
            </button>
          </div>

          {/* 詳細カード */}
          <MapDetailCard point={selectedPoint} onClose={() => setSelectedPoint(null)} />
        </>
      )}

      {/* ── 描画モード UI ─────────────────────────────── */}
      {isDrawing && (
        <FieldDrawOverlay
          vertexCount={vertexCount}
          onFinish={finishDraw}
          onCancel={cancelDraw}
          onUndo={undoVertex}
        />
      )}

      {/* ── 名前入力ダイアログ ──────────────────────────── */}
      {isNaming && (
        <FieldNameDialog
          value={pendingName}
          onChange={setPendingName}
          onSave={() => saveName(pendingName)}
          onCancel={cancelDraw}
        />
      )}
    </div>
  );
}
