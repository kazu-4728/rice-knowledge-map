"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  Map as MLMap,
  GeoJSONSource,
  MapMouseEvent,
  MapTouchEvent,
  Marker,
} from "maplibre-gl";
import type { GeoJSON } from "geojson";
import type { FieldPoint, FieldPointType } from "../../types";
import {
  loadFarmData,
  saveFieldPolygon,
  updateField,
  deleteField,
  saveFieldPoint,
  updateFieldPoint,
  deleteFieldPoint,
} from "../../lib/data/farm";
import MapBottomSheet from "./MapBottomSheet";
import FieldDrawOverlay from "./FieldDrawOverlay";
import FieldNameDialog from "./FieldNameDialog";
import AddPinSheet from "./AddPinSheet";
import PointEditDialog from "./PointEditDialog";
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

/** タップで選択された田んぼ */
type SelectedField = { id: string; name: string };

/**
 * ピンMarkerを作成してマップに追加する。
 * クリック時にonActivateを呼ぶ。戻り値はMarkerインスタンス。
 */
function createPinMarker(
  maplibre: typeof import("maplibre-gl"),
  map: MLMap,
  point: FieldPoint,
  onActivate: () => void
): Marker {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${point.name}（${STATUS_LABELS[point.status] ?? point.status}）`);
  el.style.cssText = "position:relative;background:none;border:none;padding:0;cursor:pointer;";
  el.innerHTML = pinSVG(point.type);

  const chip = document.createElement("span");
  chip.textContent = point.pinLabel ?? TYPE_LABELS[point.type];
  chip.className =
    "absolute left-full top-1 ml-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-800 shadow whitespace-nowrap pointer-events-none";
  el.appendChild(chip);

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onActivate();
  });
  return new maplibre.Marker({ element: el, anchor: "bottom" }).setLngLat(point.lngLat).addTo(map);
}

/** 田んぼ名ラベル（白チップ）をHTML Markerとして追加する */
function addFieldLabel(
  maplibre: typeof import("maplibre-gl"),
  map: MLMap,
  name: string,
  lngLat: [number, number]
): Marker {
  const el = document.createElement("div");
  el.textContent = name;
  el.className =
    "rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md pointer-events-none whitespace-nowrap";
  return new maplibre.Marker({ element: el, anchor: "center" }).setLngLat(lngLat).addTo(map);
}

/** 点がリング（経度緯度の多角形）の内側にあるか（ray casting法） */
function pointInRing([x, y]: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
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
  const [anonMode, setAnonMode] = useState(false);
  const [serverFields, setServerFields] = useState<GeoJSON.FeatureCollection | null>(null);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  const [redrawTarget, setRedrawTarget] = useState<SelectedField | null>(null);
  const [renameTarget, setRenameTarget] = useState<SelectedField | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  /** ピン追加モード: trueのときマップタップで座標を取得する */
  const [addingPin, setAddingPin] = useState(false);
  /** ピン追加の仮座標（タップ済み） */
  const [pendingPinLngLat, setPendingPinLngLat] = useState<[number, number] | null>(null);
  /** 編集対象のピン */
  const [editingPoint, setEditingPoint] = useState<FieldPoint | null>(null);
  /** マップ上のピンMarker登録簿 id → Marker */
  const pinMarkersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  /** サーバーから読み込んだ field 一覧（AddPinSheet 用） */
  const [fieldList, setFieldList] = useState<{ id: string; name: string }[]>([]);
  const locationMarkerRef = useRef<Marker | null>(null);
  const fieldLabelsRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const farmLiveRef = useRef(false);

  const {
    drawState,
    pendingName,
    setPendingName,
    startDraw,
    addVertex,
    finishDraw,
    cancelDraw,
    saveName,
    closeNaming,
    undoVertex,
    updateSavedField,
    deleteSavedField,
    replaceSavedFieldId,
    savedFields,
    drawingGeoJSON,
    savedFieldsGeoJSON,
  } = useFieldDraw();

  const isDrawing = drawState.mode === "drawing";
  const isNaming = drawState.mode === "naming";
  const vertexCount = drawState.mode === "drawing" ? drawState.vertices.length : 0;

  /** サーバー由来フィールドの名前・輪郭をローカル状態へ反映する */
  const applyServerFieldUpdate = (id: string, name: string, vertices?: [number, number][]) => {
    setServerFields((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: prev.features.map((f) =>
          String(f.id ?? f.properties?.id) === id
            ? {
                ...f,
                properties: { ...f.properties, name },
                geometry: vertices
                  ? { type: "Polygon" as const, coordinates: [[...vertices, vertices[0]]] }
                  : f.geometry,
              }
            : f
        ),
      };
    });
  };

  /** ローカル表示（サーバー由来・このセッションで描いた両方）から田んぼを取り除く */
  const removeFieldLocally = (id: string) => {
    deleteSavedField(id);
    setServerFields((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: prev.features.filter((f) => String(f.id ?? f.properties?.id) !== id),
      };
    });
  };

  // 名前確定時: 新規保存 or 描き直しの更新（T-042）
  const handleSaveField = () => {
    const vertices = drawState.mode === "naming" ? drawState.vertices : [];
    const name = pendingName.trim() || redrawTarget?.name || "新しい田んぼ";

    // 描き直し: 既存の田んぼの輪郭・名前を更新する
    // （権限なし等でDBに保存されない変更を見せないよう、ローカル反映は成功後に行う）
    if (redrawTarget) {
      const target = redrawTarget;
      setRedrawTarget(null);
      closeNaming();
      if (vertices.length < 3) return;
      const applyLocally = () => {
        updateSavedField(target.id, name, vertices);
        applyServerFieldUpdate(target.id, name, vertices);
      };
      if (farmLiveRef.current) {
        updateField(target.id, name, vertices).then((result) => {
          if (result === "saved") {
            applyLocally();
            setToast("田んぼを描き直しました");
          } else if (result === "demo") {
            applyLocally();
            setToast("ローカルで更新しました（ログインすると共有されます）");
          } else if (result === "denied") {
            setToast("変更できませんでした（編集権限がありません）");
          } else {
            setToast("更新を保存できませんでした。通信環境を確認してください");
          }
        });
      } else {
        applyLocally();
        setToast("田んぼを描き直しました");
      }
      return;
    }

    // 新規: ローカル表示に追加しつつSupabaseへ保存
    const localId = saveName(pendingName);
    if (vertices.length < 3) return;
    saveFieldPolygon(name, vertices).then(({ status, id }) => {
      if (status === "saved") {
        // 保存直後の編集・削除ができるよう、ローカルidをDBのidへ差し替える。
        // 保存完了前に操作カード等を開いていた場合も選択中idを同期する
        if (id) {
          replaceSavedFieldId(localId, id);
          const sync = (prev: SelectedField | null) =>
            prev && prev.id === localId ? { ...prev, id } : prev;
          setSelectedField(sync);
          setRedrawTarget(sync);
          setRenameTarget(sync);
        }
        setToast("田んぼを保存しました");
      } else if (status === "demo") {
        setToast("ローカルに追加しました（ログインすると共有保存されます）");
      } else {
        setToast("保存に失敗しました。通信環境を確認してください");
      }
    });
  };

  /** 操作カードの「描き直す」 */
  const startRedraw = () => {
    if (!selectedField) return;
    setRedrawTarget(selectedField);
    setSelectedField(null);
    startDraw();
  };

  /** 名前変更ダイアログの確定（ローカル反映はDB更新の成功後） */
  const commitRename = () => {
    const target = renameTarget;
    if (!target) return;
    const name = renameValue.trim() || target.name;
    setRenameTarget(null);
    setSelectedField(null);
    const applyLocally = () => {
      updateSavedField(target.id, name);
      applyServerFieldUpdate(target.id, name);
    };
    if (farmLiveRef.current) {
      updateField(target.id, name).then((result) => {
        if (result === "saved") {
          applyLocally();
          setToast("名前を変更しました");
        } else if (result === "demo") {
          applyLocally();
          setToast("ローカルで変更しました（ログインすると共有されます）");
        } else if (result === "denied") {
          setToast("変更できませんでした（編集権限がありません）");
        } else {
          setToast("名前の変更を保存できませんでした");
        }
      });
    } else {
      applyLocally();
      setToast("名前を変更しました");
    }
  };

  /** 削除確認の確定 */
  const handleDeleteConfirmed = () => {
    const target = selectedField;
    if (!target) return;
    setConfirmingDelete(false);
    setSelectedField(null);
    if (farmLiveRef.current) {
      deleteField(target.id).then((result) => {
        if (result === "deleted") {
          removeFieldLocally(target.id);
          setToast("田んぼを削除しました");
        } else if (result === "denied") {
          setToast("削除は管理者のみ行えます");
        } else if (result === "demo") {
          removeFieldLocally(target.id);
          setToast("ローカルで削除しました");
        } else {
          setToast("削除に失敗しました。通信環境を確認してください");
        }
      });
    } else {
      removeFieldLocally(target.id);
      setToast("田んぼを削除しました");
    }
  };

  /** AddPinSheetの「ここに追加」確定 */
  const handleAddPinConfirm = async (params: {
    name: string;
    pointType: FieldPointType;
    fieldId: string | null;
  }) => {
    const lngLat = pendingPinLngLat;
    if (!lngLat) return;
    setPendingPinLngLat(null);
    setAddingPin(false);

    const newPoint: FieldPoint = {
      id: `local-${crypto.randomUUID()}`,
      fieldId: params.fieldId ?? "",
      name: params.name,
      type: params.pointType,
      status: "normal",
      lastRecord: "記録なし",
      lngLat,
    };

    // 楽観的にローカル表示
    setSelectedPoint(newPoint);

    // Markerをマップへ追加してから DB保存へ進む（awaitで順序を保証し二重表示を防ぐ）
    {
      const maplibre = await import("maplibre-gl");
      const map = mapRef.current;
      if (map) {
        const marker = createPinMarker(maplibre, map, newPoint, () => {
          setSelectedPoint(newPoint);
          setSelectedField(null);
        });
        pinMarkersRef.current.set(newPoint.id, marker);
      }
    }

    // DB保存（未ログイン時は saveFieldPoint が "demo" を返す）
    const { status, id } = await saveFieldPoint({
      fieldId: params.fieldId,
      pointType: params.pointType,
      name: params.name,
      latitude: lngLat[1],
      longitude: lngLat[0],
    });
    if (status === "saved" && id) {
      // 保存完了前にユーザーがローカルピンを削除していた場合はDBも取り消す
      if (!pinMarkersRef.current.has(newPoint.id)) {
        deleteFieldPoint(id).catch(() => {});
        return;
      }
      // Markerを作り直してDB IDのオブジェクトを参照させる
      // （クロージャが localId を保持したままになるため差し替えだけでは不十分）
      const dbPoint: FieldPoint = { ...newPoint, id };
      setSelectedPoint((prev) => (prev?.id === newPoint.id ? dbPoint : prev));
      setEditingPoint((prev) => (prev?.id === newPoint.id ? dbPoint : prev));
      import("maplibre-gl").then((maplibre) => {
        const map = mapRef.current;
        if (!map) return;
        const old = pinMarkersRef.current.get(newPoint.id);
        if (!old) return;
        old.remove();
        pinMarkersRef.current.delete(newPoint.id);
        const marker = createPinMarker(maplibre, map, dbPoint, () => {
          setSelectedPoint(dbPoint);
          setSelectedField(null);
        });
        pinMarkersRef.current.set(id, marker);
      });
      setToast("ピンを保存しました");
    } else if (status === "demo") {
      setToast("ローカルに追加しました（ログインすると共有されます）");
    } else {
      // 保存失敗時は楽観追加分をロールバック
      const old = pinMarkersRef.current.get(newPoint.id);
      if (old) old.remove();
      pinMarkersRef.current.delete(newPoint.id);
      setSelectedPoint((prev) => (prev?.id === newPoint.id ? null : prev));
      setToast("ピンの保存に失敗しました。通信環境を確認してください");
    }
  };

  /** PointEditDialogの「保存」確定 */
  const handleEditPinSave = async (
    point: FieldPoint,
    patch: { name: string; pointType: FieldPointType; status: FieldPoint["status"] }
  ) => {
    setEditingPoint(null);
    const updated: FieldPoint = { ...point, name: patch.name, type: patch.pointType, status: patch.status };

    const applyLocally = () => {
      setSelectedPoint((prev) => (prev?.id === point.id ? updated : prev));
      // Markerを作り直す（SVGアイコンと種別ラベルを更新するため）
      import("maplibre-gl").then((maplibre) => {
        const map = mapRef.current;
        if (!map) return;
        const old = pinMarkersRef.current.get(point.id);
        if (old) old.remove();
        const marker = createPinMarker(maplibre, map, updated, () => {
          setSelectedPoint(updated);
          setSelectedField(null);
        });
        pinMarkersRef.current.set(point.id, marker);
      });
    };

    // ローカルIDのピン（DB保存前）はDB操作をスキップしてローカルのみ更新
    if (point.id.startsWith("local-")) {
      applyLocally();
      setToast("ローカルで更新しました（ログインすると共有されます）");
      return;
    }

    // 未ログイン時は updateFieldPoint が "demo" を返す
    const result = await updateFieldPoint(point.id, {
      name: patch.name,
      pointType: patch.pointType,
      status: patch.status,
    });
    if (result === "saved") {
      applyLocally();
      setToast("ピンを更新しました");
    } else if (result === "demo") {
      applyLocally();
      setToast("ローカルで更新しました（ログインすると共有されます）");
    } else if (result === "denied") {
      setToast("更新できませんでした（編集権限がありません）");
    } else {
      setToast("更新の保存に失敗しました");
    }
  };

  /** PointEditDialogの「削除」確定 */
  const handleEditPinDelete = async (point: FieldPoint) => {
    setEditingPoint(null);

    const removeLocally = () => {
      setSelectedPoint((prev) => (prev?.id === point.id ? null : prev));
      const marker = pinMarkersRef.current.get(point.id);
      if (marker) {
        marker.remove();
        pinMarkersRef.current.delete(point.id);
      }
    };

    // ローカルIDのピン（DB保存前）はDB操作をスキップしてローカルのみ削除
    if (point.id.startsWith("local-")) {
      removeLocally();
      setToast("ピンを削除しました");
      return;
    }

    // 未ログイン時は deleteFieldPoint が "demo" を返す
    const result = await deleteFieldPoint(point.id);
    if (result === "deleted") {
      removeLocally();
      setToast("ピンを削除しました");
    } else if (result === "demo") {
      removeLocally();
      setToast("ローカルで削除しました（ログインすると共有されます）");
    } else if (result === "denied") {
      setToast("削除できませんでした（編集権限がありません）");
    } else {
      setToast("削除に失敗しました");
    }
  };

  // トーストの自動消去
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 描き直しの名前入力には現在の名前を初期表示する
  useEffect(() => {
    if (isNaming && redrawTarget) setPendingName(redrawTarget.name);
  }, [isNaming, redrawTarget, setPendingName]);

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

  /**
   * タップ座標に重なる田んぼを座標計算で探す（このセッションで描いたものを優先）。
   * 描画済みピクセルへの問い合わせ（queryRenderedFeatures）は低速端末で
   * 描画完了前のタップを取りこぼすため使わない。
   */
  const findFieldAt = (lngLat: [number, number]): SelectedField | null => {
    for (let i = savedFields.length - 1; i >= 0; i--) {
      const f = savedFields[i];
      if (pointInRing(lngLat, [...f.vertices, f.vertices[0]])) {
        return { id: f.id, name: f.name };
      }
    }
    for (const feat of serverFields?.features ?? []) {
      if (feat.geometry.type !== "Polygon") continue;
      if (pointInRing(lngLat, feat.geometry.coordinates[0])) {
        return {
          id: String(feat.id ?? feat.properties?.id ?? ""),
          name: String(feat.properties?.name ?? ""),
        };
      }
    }
    return null;
  };

  // クリックハンドラを付け替えずに済むよう、最新状態をrefで参照する
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const addVertexRef = useRef(addVertex);
  addVertexRef.current = addVertex;
  const flyToCurrentLocationRef = useRef(flyToCurrentLocation);
  flyToCurrentLocationRef.current = flyToCurrentLocation;
  const findFieldAtRef = useRef(findFieldAt);
  findFieldAtRef.current = findFieldAt;
  const addingPinRef = useRef(addingPin);
  addingPinRef.current = addingPin;

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: MLMap | undefined;
    let cancelled = false;

    // 地図ライブラリと田んぼデータ（Supabaseまたはサンプル）を並行読込
    Promise.all([import("maplibre-gl"), loadFarmData()]).then(([maplibre, farm]) => {
      if (cancelled || !mapContainerRef.current) return;

      // error はログイン済みの取得失敗（編集系の各関数がセッションを再検証するためliveと同等に扱う）
      farmLiveRef.current = farm.mode === "live" || farm.mode === "error";
      setAnonMode(farm.mode === "anon");
      if (farm.mode === "error") {
        setToast("データを読み込めませんでした。通信環境を確認して開き直してください");
      }

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

      // 通常モード: 田んぼタップで操作カード、それ以外は選択解除
      // ピン追加モード: タップ座標を pendingPinLngLat にセットして種別選択シートへ
      map.on("click", (e: MapMouseEvent) => {
        if (isDrawingRef.current) return;
        if (addingPinRef.current) {
          setPendingPinLngLat([e.lngLat.lng, e.lngLat.lat]);
          return;
        }
        const hit = findFieldAtRef.current([e.lngLat.lng, e.lngLat.lat]);
        setSelectedField(hit);
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
        if (farm.mode === "live" && coords.length > 0) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, maxZoom: 16.5, duration: 0 }
          );
        } else if (farm.mode === "live") {
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

        // ── 選択中の田んぼの強調表示 ──────────────────
        map.addLayer({
          id: "fields-selected",
          type: "line",
          source: "fields",
          paint: { "line-color": "#16A34A", "line-width": 4.5 },
          filter: ["==", ["get", "id"], "__none__"],
        });
        map.addLayer({
          id: "user-fields-selected",
          type: "line",
          source: "user-fields",
          paint: { "line-color": "#16A34A", "line-width": 4.5 },
          filter: ["==", ["get", "id"], "__none__"],
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
          const marker = createPinMarker(maplibre, map!, point, () => {
            setSelectedPoint(point);
            setSelectedField(null);
          });
          pinMarkersRef.current.set(point.id, marker);
        });

        // 名前ラベルの生成・編集・削除はラベル同期effectが担当する
        setServerFields(farm.fieldsGeoJSON);
        // fieldList は serverFields/savedFields の変化に追随する useEffect で管理する
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
  // （isStyleLoaded()はタイル読込失敗中にfalseを返し同期漏れするため、ソース存在のみ確認）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource<GeoJSONSource>("drawing");
    if (src) src.setData(drawingGeoJSON);
  }, [drawingGeoJSON]);

  // サーバー由来フィールド GeoJSON を更新（編集・削除の反映）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !serverFields) return;
    const src = map.getSource<GeoJSONSource>("fields");
    if (src) src.setData(serverFields);
  }, [serverFields]);

  // このセッションで描いたフィールド GeoJSON を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource<GeoJSONSource>("user-fields");
    if (src) src.setData(savedFieldsGeoJSON);
  }, [savedFieldsGeoJSON]);

  // 選択中の田んぼを強調表示
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const idValue = selectedField?.id ?? "__none__";
    for (const layer of ["fields-selected", "user-fields-selected"]) {
      if (map.getLayer(layer)) map.setFilter(layer, ["==", ["get", "id"], idValue]);
    }
  }, [selectedField]);

  // AddPinSheet の田んぼ候補を serverFields + savedFields から常に同期する
  useEffect(() => {
    const fromServer = (serverFields?.features ?? []).flatMap((f) => {
      const id = String(f.id ?? f.properties?.id ?? "");
      if (!id) return [];
      return [{ id, name: String(f.properties?.name ?? "") }];
    });
    // user-field-* はDB未保存のローカルID（FK不整合を防ぐため除外）
    const fromLocal = savedFields
      .filter((f) => !f.id.startsWith("user-field-"))
      .map((f) => ({ id: f.id, name: f.name }));
    const seen = new Set<string>();
    const merged = [...fromServer, ...fromLocal].filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    setFieldList(merged);
  }, [serverFields, savedFields]);

  // 名前ラベル（白チップ）を全フィールドと同期（追加・名前変更・移動・削除）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const features: GeoJSON.Feature[] = [
      ...(serverFields?.features ?? []),
      ...savedFields.map((f) => ({
        type: "Feature" as const,
        id: f.id,
        properties: { id: f.id, name: f.name },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...f.vertices, f.vertices[0]]],
        },
      })),
    ];

    import("maplibre-gl").then((maplibre) => {
      if (!mapRef.current) return;
      const seen = new Set<string>();
      features.forEach((feature) => {
        if (feature.geometry.type !== "Polygon") return;
        const id = String(feature.id ?? feature.properties?.id ?? "");
        if (!id) return;
        seen.add(id);
        const center = polygonCentroid(feature.geometry.coordinates[0]);
        const name = String(feature.properties?.name ?? "");
        const existing = fieldLabelsRef.current.get(id);
        if (existing) {
          existing.setLngLat(center);
          existing.getElement().textContent = name;
        } else {
          fieldLabelsRef.current.set(
            id,
            addFieldLabel(maplibre, mapRef.current!, name, center)
          );
        }
      });
      for (const [id, marker] of fieldLabelsRef.current) {
        if (!seen.has(id)) {
          marker.remove();
          fieldLabelsRef.current.delete(id);
        }
      }
    });
  }, [serverFields, savedFields]);

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
          {/* 未ログインの案内 */}
          {anonMode && (
            <Link
              href="/login?redirect=%2Fmap"
              className="absolute top-3 left-1/2 z-20 block w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-xl bg-white px-4 py-3 shadow-lg"
            >
              <p className="text-sm font-bold text-gray-900">ログインすると家族の田んぼが表示されます</p>
              <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
            </Link>
          )}

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

          {/* 田んぼ選択中は操作カード、それ以外は常設ボトムシート */}
          {selectedField ? (
            <div className="absolute inset-x-0 bottom-0 z-30">
              <div className="rounded-t-3xl bg-white px-4 pb-4 pt-2 shadow-[0_-6px_24px_rgba(0,0,0,0.18)]">
                <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-white bg-green-600 shadow" />
                  <h2 className="truncate text-base font-bold text-gray-900">
                    {selectedField.name || "名前のない田んぼ"}
                  </h2>
                  <button
                    onClick={() => setSelectedField(null)}
                    className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    閉じる
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setRenameTarget(selectedField);
                      setRenameValue(selectedField.name);
                    }}
                    className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    名前を変更
                  </button>
                  <button
                    onClick={startRedraw}
                    className="flex-1 rounded-xl border border-green-700 bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
                  >
                    描き直す
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="flex-1 rounded-xl border border-red-300 bg-white py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <MapBottomSheet
              point={selectedPoint}
              onAddPin={() => {
                setSelectedField(null);
                setSelectedPoint(null);
                setAddingPin(true);
                setToast("地図をタップしてピンの場所を選んでください");
              }}
              onEditPin={(p) => setEditingPoint(p)}
            />
          )}
        </>
      )}

      {/* ── 描画モード UI ─────────────────────────────── */}
      {isDrawing && (
        <FieldDrawOverlay
          vertexCount={vertexCount}
          onFinish={finishDraw}
          onCancel={() => {
            setRedrawTarget(null);
            cancelDraw();
          }}
          onUndo={undoVertex}
        />
      )}

      {/* ── 名前入力ダイアログ（新規・描き直し共用） ──────────── */}
      {isNaming && (
        <FieldNameDialog
          title={redrawTarget ? "描き直した田んぼの名前" : "田んぼの名前を入力"}
          value={pendingName}
          onChange={setPendingName}
          onSave={handleSaveField}
          onCancel={() => {
            setRedrawTarget(null);
            cancelDraw();
          }}
        />
      )}

      {/* ── 名前変更ダイアログ ──────────────────────────── */}
      {renameTarget && (
        <FieldNameDialog
          title="田んぼの名前を変更"
          value={renameValue}
          onChange={setRenameValue}
          onSave={commitRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      {/* ── 削除確認 ─────────────────────────────────── */}
      {confirmingDelete && selectedField && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 pb-24">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-base font-bold text-gray-900">
              「{selectedField.name || "名前のない田んぼ"}」を削除しますか？
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              この田んぼに紐づくピンや記録は消えませんが、田んぼとのつながりは外れます。
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ピン追加モード: 場所選択バナー ────────────────── */}
      {addingPin && !pendingPinLngLat && (
        <div className="absolute inset-x-0 bottom-0 z-40">
          <div className="rounded-t-3xl bg-gray-900 px-4 pb-8 pt-4 text-center text-white shadow-2xl">
            <p className="text-sm font-bold">地図をタップしてピンの場所を選んでください</p>
            <button
              onClick={() => { setAddingPin(false); setPendingPinLngLat(null); }}
              className="mt-3 rounded-xl border border-gray-600 px-6 py-2.5 text-sm font-semibold text-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ── ピン追加: 種別・名前選択シート ───────────────── */}
      {pendingPinLngLat && (
        <AddPinSheet
          fields={fieldList}
          onConfirm={handleAddPinConfirm}
          onCancel={() => { setPendingPinLngLat(null); setAddingPin(false); }}
        />
      )}

      {/* ── ピン編集ダイアログ ─────────────────────────── */}
      {editingPoint && (
        <PointEditDialog
          point={editingPoint}
          onSave={(patch) => handleEditPinSave(editingPoint, patch)}
          onDelete={() => handleEditPinDelete(editingPoint)}
          onCancel={() => setEditingPoint(null)}
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
