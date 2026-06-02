"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSON } from "geojson";
import type { FieldPoint } from "../../types";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";
import MapDetailCard from "./MapDetailCard";
import FieldDrawOverlay from "./FieldDrawOverlay";
import FieldNameDialog from "./FieldNameDialog";
import { useFieldDraw } from "./useFieldDraw";

// GLOSSARY.md §6 全種別対応
const PIN_ICONS: Record<string, string> = {
  inlet: "💧", outlet: "⬇", canal: "〜", caution: "⚠️",
  weed: "🌿", levee_damage: "🧱", poor_drainage: "💦", other: "📍",
};

const PIN_BG: Record<string, string> = {
  inlet: "#3B82F6", outlet: "#6B7280", canal: "#0EA5E9", caution: "#F97316",
  weed: "#22C55E", levee_damage: "#B45309", poor_drainage: "#7C3AED", other: "#9CA3AF",
};

// GLOSSARY.md §5 ステータス表示ラベル・ボーダー色
const STATUS_LABEL: Record<string, string> = {
  normal: "正常", needs_check: "要確認", issue: "問題あり", resolved: "解決済み",
};
const STATUS_BORDER: Record<string, string> = {
  normal: "white", needs_check: "#F97316", issue: "#EF4444", resolved: "#9CA3AF",
};

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<FieldPoint | null>(null);
  const [tileError, setTileError] = useState(false);
  // ユーザー追加フィールドのラベル済み ID を管理（重複追加防止）
  const labeledFieldIds = useRef<Set<string>>(new Set());

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
    let cancelled = false; // P2-5: unmount guard

    import("maplibre-gl").then((maplibre) => {
      if (cancelled) return; // unmount済みなら何もしない
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

        // ── 田んぼ名ラベル（HTML Marker方式 ※glyphs不要・漢字対応） ──
        fieldGeoJSON.features.forEach((feature) => {
          if (feature.geometry.type !== "Polygon") return;
          const coords = feature.geometry.coordinates[0];
          // ポリゴン重心を簡易計算（頂点平均）
          const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
          const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
          const labelEl = document.createElement("div");
          labelEl.textContent = feature.properties?.name ?? "";
          labelEl.style.cssText = `
            color:#fff;font-size:13px;font-weight:700;
            text-shadow:0 1px 3px rgba(0,0,0,0.7);
            pointer-events:none;white-space:nowrap;
          `;
          new maplibre.Marker({ element: labelEl, anchor: "center" })
            .setLngLat([lng, lat]).addTo(map);
        });

        // ── ユーザー描画済みポリゴン ──────────────────
        map.addSource("user-fields", { type: "geojson",
          data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "user-fields-fill", type: "fill", source: "user-fields",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.4 } });
        map.addLayer({ id: "user-fields-outline", type: "line", source: "user-fields",
          paint: { "line-color": "#ffffff", "line-width": 2.5 } });

        // ── 描画中プレビュー（線・頂点） ───────────────
        map.addSource("drawing", { type: "geojson",
          data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "drawing-line", type: "line", source: "drawing",
          filter: ["==", "$type", "LineString"],
          paint: { "line-color": "#2563EB", "line-width": 2.5, "line-dasharray": [4, 3] } });
        map.addLayer({ id: "drawing-vertex", type: "circle", source: "drawing",
          filter: ["==", "$type", "Point"],
          paint: { "circle-radius": 7, "circle-color": "#ffffff",
            "circle-stroke-color": "#2563EB", "circle-stroke-width": 2.5 } });
        map.addLayer({ id: "drawing-vertex-first", type: "circle", source: "drawing",
          filter: ["all", ["==", "$type", "Point"], ["==", ["get", "isFirst"], true]],
          paint: { "circle-radius": 9, "circle-color": "#2563EB",
            "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });

        // ── ピン（Marker）― アクセシビリティ対応 ─────────────
        fieldPoints.forEach((point) => {
          const el = document.createElement("button");
          el.type = "button"; // フォーム submit 防止
          el.setAttribute(
            "aria-label",
            `${point.name}（${STATUS_LABEL[point.status] ?? point.status}）`
          );
          el.style.cssText = `
            width:32px;height:32px;border-radius:50%;
            background:${PIN_BG[point.type] ?? "#6B7280"};
            display:flex;align-items:center;justify-content:center;
            font-size:14px;cursor:pointer;
            border:2px solid ${STATUS_BORDER[point.status] ?? "white"};
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          `;
          el.textContent = PIN_ICONS[point.type] ?? "📍";
          const handleActivate = (e: Event) => {
            e.stopPropagation();
            setSelectedPoint(point);
          };
          el.addEventListener("click", handleActivate);
          el.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") { handleActivate(e); return; }
            if (e.key === " ") { e.preventDefault(); handleActivate(e); } // スクロール防止
          });
          new maplibre.Marker({ element: el }).setLngLat(point.lngLat).addTo(map);
        });
      });

      // P2-3 & P2-4: エラーを1箇所に統合（二重登録を排除）
      map.on("error", (e) => {
        console.error("[MapLibre error]", e);
        // タイル取得失敗を大文字小文字問わず検知
        const msg = (e.error?.message ?? String(e.error ?? "")).toLowerCase();
        if (msg.includes("fetch") || msg.includes("tile") || msg.includes("network")) {
          setTileError(true);
        }
      });
    });

    return () => {
      cancelled = true;
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

  // 保存済みフィールド GeoJSON を更新 + HTML ラベルを追加
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("user-fields");
    if (src) src.setData(savedFieldsGeoJSON);

    // 新規追加フィーチャーにのみ HTML Marker ラベルを付ける
    import("maplibre-gl").then((maplibre) => {
      savedFieldsGeoJSON.features.forEach((feature) => {
        const id = String(feature.id ?? feature.properties?.name ?? "");
        if (labeledFieldIds.current.has(id)) return;
        if (feature.geometry.type !== "Polygon") return;
        const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
        const labelEl = document.createElement("div");
        labelEl.textContent = feature.properties?.name ?? "";
        labelEl.style.cssText = `
          color:#fff;font-size:13px;font-weight:700;
          text-shadow:0 1px 3px rgba(0,0,0,0.7);
          pointer-events:none;white-space:nowrap;
        `;
        new maplibre.Marker({ element: labelEl, anchor: "center" })
          .setLngLat([lng, lat]).addTo(map);
        labeledFieldIds.current.add(id);
      });
    });
  }, [savedFieldsGeoJSON]);

  return (
    <div className="absolute inset-0">
      {/* マップキャンバス */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* P2-3: タイル取得失敗バナー */}
      {tileError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-xl px-4 py-2 shadow flex items-center gap-2 max-w-xs">
          <span>⚠️</span>
          <span>航空写真を読み込めません。区画・ピンは表示しています。</span>
        </div>
      )}

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
