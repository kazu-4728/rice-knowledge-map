"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MLMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import type { GeoJSON } from "geojson";
import type { FieldPoint } from "../../types";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";
import MapBottomSheet from "./MapBottomSheet";
import FieldDrawOverlay from "./FieldDrawOverlay";
import FieldNameDialog from "./FieldNameDialog";
import { useFieldDraw } from "./useFieldDraw";
import { pinSVG, TYPE_LABELS, PIN_COLORS, STATUS_LABELS } from "./mapPins";
import {
  IconLocate,
  IconMinus,
  IconPinFill,
  IconPlus,
} from "../../components/ui/icons";

const INITIAL_CENTER: [number, number] = [138.8305, 37.4252];
const INITIAL_ZOOM = 14.4;

/** 田んぼ名ラベル（白チップ）をHTML Markerとして追加する */
function addFieldLabel(
  maplibre: typeof import("maplibre-gl"),
  map: MLMap,
  name: string,
  lngLat: [number, number]
) {
  const el = document.createElement("div");
  el.textContent = name;
  el.className =
    "rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md pointer-events-none whitespace-nowrap";
  new maplibre.Marker({ element: el, anchor: "center" }).setLngLat(lngLat).addTo(map);
}

function polygonCentroid(coords: number[][]): [number, number] {
  const pts = coords.slice(0, -1).length >= 3 ? coords.slice(0, -1) : coords;
  const lng = pts.reduce((s, c) => s + c[0], 0) / pts.length;
  const lat = pts.reduce((s, c) => s + c[1], 0) / pts.length;
  return [lng, lat];
}

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<FieldPoint | null>(fieldPoints[0]);
  const [tileError, setTileError] = useState(false);
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

  // クリックハンドラを付け替えずに済むよう、最新状態をrefで参照する
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const addVertexRef = useRef(addVertex);
  addVertexRef.current = addVertex;

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: MLMap | undefined;
    let cancelled = false;

    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !mapContainerRef.current) return;

      map = new maplibre.Map({
        container: mapContainerRef.current,
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
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      map.on("error", (e) => {
        console.error("[MapLibre error]", e);
        const msg = (e.error?.message ?? String(e.error ?? "")).toLowerCase();
        if (msg.includes("fetch") || msg.includes("tile") || msg.includes("network")) {
          setTileError(true);
        }
      });

      // 描画モード: 頂点追加 / 通常モード: 選択解除
      map.on("click", (e: MapMouseEvent) => {
        if (isDrawingRef.current) {
          addVertexRef.current([e.lngLat.lng, e.lngLat.lat]);
        } else {
          setSelectedPoint(null);
        }
      });

      map.on("load", () => {
        if (!map) return;
        map.resize();

        // ── 田んぼポリゴン ──────────────────────
        map.addSource("fields", {
          type: "geojson",
          data: fieldGeoJSON as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: "fields-fill",
          type: "fill",
          source: "fields",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.45 },
        });
        map.addLayer({
          id: "fields-outline",
          type: "line",
          source: "fields",
          paint: { "line-color": "#ffffff", "line-width": 2.5 },
        });

        // 田んぼ名ラベル（白チップ）
        fieldGeoJSON.features.forEach((feature) => {
          if (feature.geometry.type !== "Polygon") return;
          const center = polygonCentroid(feature.geometry.coordinates[0]);
          addFieldLabel(maplibre, map!, feature.properties?.name ?? "", center);
        });

        // ── ユーザー描画済みポリゴン ──────────────────
        map.addSource("user-fields", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "user-fields-fill",
          type: "fill",
          source: "user-fields",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.45 },
        });
        map.addLayer({
          id: "user-fields-outline",
          type: "line",
          source: "user-fields",
          paint: { "line-color": "#ffffff", "line-width": 2.5 },
        });

        // ── 描画中プレビュー（線・頂点） ───────────────
        map.addSource("drawing", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "drawing-line",
          type: "line",
          source: "drawing",
          filter: ["==", "$type", "LineString"],
          paint: { "line-color": "#2563EB", "line-width": 2.5, "line-dasharray": [4, 3] },
        });
        map.addLayer({
          id: "drawing-vertex",
          type: "circle",
          source: "drawing",
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 7,
            "circle-color": "#ffffff",
            "circle-stroke-color": "#2563EB",
            "circle-stroke-width": 2.5,
          },
        });
        map.addLayer({
          id: "drawing-vertex-first",
          type: "circle",
          source: "drawing",
          filter: ["all", ["==", "$type", "Point"], ["==", ["get", "isFirst"], true]],
          paint: {
            "circle-radius": 9,
            "circle-color": "#2563EB",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });

        // ── 地点ピン（ティアドロップ＋ラベルチップ） ─────────
        fieldPoints.forEach((point) => {
          const el = document.createElement("button");
          el.type = "button";
          el.setAttribute(
            "aria-label",
            `${point.name}（${STATUS_LABELS[point.status] ?? point.status}）`
          );
          el.style.cssText = "position:relative;background:none;border:none;padding:0;cursor:pointer;";
          el.innerHTML = pinSVG(point.type);

          // ピン右横の白チップラベル
          const chip = document.createElement("span");
          chip.textContent = point.pinLabel ?? TYPE_LABELS[point.type];
          chip.className =
            "absolute left-full top-1 ml-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-800 shadow whitespace-nowrap pointer-events-none";
          el.appendChild(chip);

          const handleActivate = (e: Event) => {
            e.stopPropagation();
            setSelectedPoint(point);
          };
          el.addEventListener("click", handleActivate);
          el.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              handleActivate(e);
              return;
            }
            if (e.key === " ") {
              e.preventDefault();
              handleActivate(e);
            }
          });

          new maplibre.Marker({ element: el, anchor: "bottom" })
            .setLngLat(point.lngLat)
            .addTo(map!);
        });
      });
    });

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 描画中はカーソルを十字に
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
  }, [isDrawing]);

  // 描画中 GeoJSON を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource<GeoJSONSource>("drawing");
    if (src) src.setData(drawingGeoJSON);
  }, [drawingGeoJSON]);

  // 保存済みフィールド GeoJSON を更新 + ラベルを追加
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource<GeoJSONSource>("user-fields");
    if (src) src.setData(savedFieldsGeoJSON);

    import("maplibre-gl").then((maplibre) => {
      savedFieldsGeoJSON.features.forEach((feature) => {
        const id = String(feature.id ?? feature.properties?.name ?? "");
        if (labeledFieldIds.current.has(id)) return;
        if (feature.geometry.type !== "Polygon") return;
        const center = polygonCentroid((feature.geometry as GeoJSON.Polygon).coordinates[0]);
        addFieldLabel(maplibre, map, feature.properties?.name ?? "", center);
        labeledFieldIds.current.add(id);
      });
    });
  }, [savedFieldsGeoJSON]);

  return (
    <div className="absolute inset-0">
      {/* マップキャンバス（maplibreのCSSがpositionを上書きするためh-fullで明示サイズ指定） */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* タイル取得失敗バナー */}
      {tileError && (
        <div className="absolute top-3 left-1/2 z-20 flex max-w-xs -translate-x-1/2 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow">
          <span>⚠️</span>
          <span>航空写真を読み込めません。区画・ピンは表示しています。</span>
        </div>
      )}

      {/* ── 通常モード UI ─────────────────────────────── */}
      {!isDrawing && !isNaming && (
        <>
          {/* 凡例 */}
          <div className="absolute left-3 top-3 z-10 space-y-2 rounded-xl bg-white px-2.5 py-2.5 shadow-md">
            {[
              { type: "inlet" as const, label: "入水口" },
              { type: "outlet" as const, label: "出水口" },
              { type: "caution" as const, label: "異常箇所" },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <IconPinFill className="h-5 w-5" style={{ color: PIN_COLORS[item.type] }} />
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* 右側コントロール（現在地・ズーム・田んぼ追加） */}
          <div className="absolute bottom-[230px] right-3 z-10 flex flex-col items-center gap-2">
            <button
              onClick={() =>
                mapRef.current?.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM })
              }
              aria-label="現在地に戻る"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-50"
            >
              <IconLocate className="h-5.5 w-5.5" />
            </button>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                aria-label="拡大"
                className="flex h-11 w-11 items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                <IconPlus className="h-5 w-5" />
              </button>
              <div className="mx-2 h-px bg-gray-200" />
              <button
                onClick={() => mapRef.current?.zoomOut()}
                aria-label="縮小"
                className="flex h-11 w-11 items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                <IconMinus className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={startDraw}
              aria-label="田んぼを追加"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 text-white shadow-md hover:bg-green-800"
            >
              <IconPlus className="h-6 w-6" strokeWidth={2.2} />
            </button>
          </div>

          {/* 常設ボトムシート */}
          <MapBottomSheet point={selectedPoint} />
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
