"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MLMap, GeoJSONSource, MapMouseEvent, MapTouchEvent, Marker } from "maplibre-gl";
import type { GeoJSON } from "geojson";
import type { FieldPoint } from "../../types";
import { loadFarmData, saveFieldPolygon } from "../../lib/data/farm";
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
  IconWarningFill,
} from "../../components/ui/icons";

const INITIAL_CENTER: [number, number] = [138.8305, 37.4252];
const INITIAL_ZOOM = 14.4;
/** なぞり描き中、この画面距離(px)以上動いたら頂点を追加する */
const TRACE_MIN_DISTANCE_PX = 12;

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
  const [selectedPoint, setSelectedPoint] = useState<FieldPoint | null>(null);
  const [tileError, setTileError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liveEmpty, setLiveEmpty] = useState(false);
  const labeledFieldIds = useRef<Set<string>>(new Set());
  const locationMarkerRef = useRef<Marker | null>(null);

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

  // 名前確定時: ローカル表示に反映しつつSupabaseへ保存（T-042）
  const handleSaveField = () => {
    const name = pendingName.trim() || "新しい田んぼ";
    const vertices = drawState.mode === "naming" ? drawState.vertices : [];
    saveName(pendingName);
    if (vertices.length < 3) return;
    saveFieldPolygon(name, vertices).then((result) => {
      if (result === "saved") setToast("田んぼを保存しました");
      else if (result === "demo") setToast("ローカルに追加しました（ログインすると共有保存されます）");
      else setToast("保存に失敗しました。通信環境を確認してください");
    });
  };

  // トーストの自動消去
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** GPSで現在地へ移動し、青い現在地ドットを表示する */
  const flyToCurrentLocation = (silent = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (!("geolocation" in navigator)) {
      if (!silent) setToast("この端末では位置情報を利用できません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        import("maplibre-gl").then((maplibre) => {
          if (!mapRef.current) return;
          if (!locationMarkerRef.current) {
            const el = document.createElement("div");
            el.className =
              "h-4 w-4 rounded-full border-[3px] border-white bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.25)]";
            locationMarkerRef.current = new maplibre.Marker({ element: el, anchor: "center" })
              .setLngLat(lngLat)
              .addTo(mapRef.current);
          } else {
            locationMarkerRef.current.setLngLat(lngLat);
          }
          mapRef.current.flyTo({ center: lngLat, zoom: 16.5 });
        });
      },
      () => {
        if (!silent) setToast("現在地を取得できません。位置情報の許可を確認してください");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // クリックハンドラを付け替えずに済むよう、最新状態をrefで参照する
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const addVertexRef = useRef(addVertex);
  addVertexRef.current = addVertex;
  const flyToCurrentLocationRef = useRef(flyToCurrentLocation);
  flyToCurrentLocationRef.current = flyToCurrentLocation;

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: MLMap | undefined;
    let cancelled = false;

    // 地図ライブラリと田んぼデータ（Supabaseまたはサンプル）を並行読込
    Promise.all([import("maplibre-gl"), loadFarmData()]).then(([maplibre, farm]) => {
      if (cancelled || !mapContainerRef.current) return;

      // 参照モック同様、初期表示は先頭の地点を選択状態にする
      setSelectedPoint(farm.points[0] ?? null);

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

      // 通常モード: 選択解除（描画モードの頂点追加はなぞり描きハンドラが担当）
      map.on("click", () => {
        if (isDrawingRef.current) return;
        setSelectedPoint(null);
      });

      map.on("load", () => {
        if (!map) return;
        map.resize();

        // 初期表示位置: 自分のデータがあればそこへ、なければ現在地を取得
        const coords: [number, number][] = [
          ...farm.points.map((p) => p.lngLat),
          ...farm.fieldsGeoJSON.features.flatMap((f) =>
            f.geometry.type === "Polygon" ? (f.geometry.coordinates[0] as [number, number][]) : []
          ),
        ];
        if (farm.live && coords.length > 0) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, maxZoom: 16.5, duration: 0 }
          );
        } else if (farm.live) {
          // ログイン済みでまだ田んぼ未登録: 現在地から始める + 登録を促す
          setLiveEmpty(true);
          flyToCurrentLocationRef.current(true);
        }

        // ── 田んぼポリゴン ──────────────────────
        map.addSource("fields", {
          type: "geojson",
          data: farm.fieldsGeoJSON,
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
        farm.fieldsGeoJSON.features.forEach((feature) => {
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
        farm.points.forEach((point) => {
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

  // 描画モード: 地図の移動を止め、指・マウスのなぞり軌跡を頂点として記録する
  // （タップ/クリックは押した1点だけ追加されるので、1点ずつの打点も引き続き可能）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
    if (!isDrawing) return;

    map.dragPan.disable();
    let tracing = false;
    let lastPoint: { x: number; y: number } | null = null;

    const start = (e: MapMouseEvent | MapTouchEvent) => {
      // ピンチ操作（2本指）はズームに譲る
      if ("points" in e && e.points.length > 1) {
        tracing = false;
        return;
      }
      tracing = true;
      lastPoint = e.point;
      addVertexRef.current([e.lngLat.lng, e.lngLat.lat]);
    };
    const move = (e: MapMouseEvent | MapTouchEvent) => {
      if (!tracing || !lastPoint) return;
      if ("points" in e && e.points.length > 1) {
        tracing = false;
        return;
      }
      const dx = e.point.x - lastPoint.x;
      const dy = e.point.y - lastPoint.y;
      if (dx * dx + dy * dy < TRACE_MIN_DISTANCE_PX * TRACE_MIN_DISTANCE_PX) return;
      lastPoint = e.point;
      addVertexRef.current([e.lngLat.lng, e.lngLat.lat]);
    };
    const end = () => {
      tracing = false;
      lastPoint = null;
    };

    map.on("mousedown", start);
    map.on("mousemove", move);
    map.on("mouseup", end);
    map.on("touchstart", start);
    map.on("touchmove", move);
    map.on("touchend", end);
    map.on("touchcancel", end);

    return () => {
      map.off("mousedown", start);
      map.off("mousemove", move);
      map.off("mouseup", end);
      map.off("touchstart", start);
      map.off("touchmove", move);
      map.off("touchend", end);
      map.off("touchcancel", end);
      map.dragPan.enable();
    };
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
          <IconWarningFill className="h-5 w-5 shrink-0 text-amber-500" />
          <span>航空写真を読み込めません。区画・ピンは表示しています。</span>
        </div>
      )}

      {/* ── 通常モード UI ─────────────────────────────── */}
      {!isDrawing && !isNaming && (
        <>
          {/* ログイン済み・田んぼ未登録の案内 */}
          {liveEmpty && (
            <div className="absolute top-3 left-1/2 z-20 w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-xl bg-green-700 px-4 py-3 text-white shadow-lg">
              <p className="text-sm font-bold">まだ田んぼが登録されていません</p>
              <p className="mt-0.5 text-xs text-green-100">
                右下の緑の＋ボタンを押して、地図上の田んぼを指でなぞると登録できます
              </p>
            </div>
          )}

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
              onClick={() => flyToCurrentLocation()}
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
              onClick={() => {
                setLiveEmpty(false);
                startDraw();
              }}
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
          onSave={handleSaveField}
          onCancel={cancelDraw}
        />
      )}

      {/* 保存結果トースト */}
      {toast && (
        <div className="absolute bottom-[240px] left-1/2 z-40 -translate-x-1/2 rounded-xl bg-gray-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
