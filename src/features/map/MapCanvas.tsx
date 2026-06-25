"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import MapBottomSheet, { type FieldListItem } from "./MapBottomSheet";
import MapDetailPanel from "./MapDetailPanel";
import FieldSearchSheet from "./FieldSearchSheet";
import FieldPlaceOverlay from "./FieldPlaceOverlay";
import FieldDrawOverlay from "./FieldDrawOverlay";
import FieldNameDialog from "./FieldNameDialog";
import AddPinSheet from "./AddPinSheet";
import PointEditDialog from "./PointEditDialog";
import { useFieldDraw } from "./useFieldDraw";
import { pinSVG, TYPE_LABELS, PIN_COLORS, STATUS_LABELS } from "./mapPins";
import { useDrawer } from "../../components/layout/DrawerContext";
import LayoutDebugPanel, { useLayoutDebug } from "./LayoutDebugPanel";
import {
  IconCamera,
  IconLocate,
  IconMenu,
  IconMic,
  IconMinus,
  IconPinFill,
  IconPlus,
  IconListBullet,
  IconWarningFill,
} from "../../components/ui/icons";

const INITIAL_CENTER: [number, number] = [138.8305, 37.4252];
const INITIAL_ZOOM = 14.4;
/** なぞり描き中、この画面距離(px)以上動いたら頂点を追加する */
const TRACE_MIN_DISTANCE_PX = 12;

/** タップで選択された田んぼ */
type SelectedField = { id: string; name: string };

/**
 * 地図上の操作状態を、矛盾しない単一のモードとして管理する。
 * 輪郭描画(drawing)・名前入力(naming)は頂点データを持つ useFieldDraw が一次情報で、
 * その表示は mode より優先される（docs/MAP_STATE_MACHINE.md）。
 */
type Mode =
  | { kind: "browse" } //                       通常閲覧
  | { kind: "picker" } //                       登録田んぼ一覧
  | { kind: "placing" } //                      新規/描き直しの場所合わせ
  | { kind: "field"; field: SelectedField } //  田んぼ詳細
  | { kind: "point"; point: FieldPoint } //     ピン詳細
  | { kind: "addPin"; fieldId: string | null }; // ピン追加

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
  const { setDrawerOpen } = useDrawer();
  const rootRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  const { captureSequence } = useLayoutDebug(rootRef, mapContainerRef, mapRef);

  // 地図上の単一モード（矛盾しない明確な状態管理）
  const [mode, setMode] = useState<Mode>({ kind: "browse" });
  const selectedField = mode.kind === "field" ? mode.field : null;
  const selectedPoint = mode.kind === "point" ? mode.point : null;

  const [tileError, setTileError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liveEmpty, setLiveEmpty] = useState(false);
  const [anonMode, setAnonMode] = useState(false);
  const [serverFields, setServerFields] = useState<GeoJSON.FeatureCollection | null>(null);
  const [previewField, setPreviewField] = useState<SelectedField | null>(null);
  const [redrawTarget, setRedrawTarget] = useState<SelectedField | null>(null);
  const [renameTarget, setRenameTarget] = useState<SelectedField | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  /** ピン追加の仮座標（地図タップ済み） */
  const [pendingPinLngLat, setPendingPinLngLat] = useState<[number, number] | null>(null);
  /** 編集対象のピン */
  const [editingPoint, setEditingPoint] = useState<FieldPoint | null>(null);
  /** マップ上のピンMarker登録簿 id → Marker */
  const pinMarkersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  /** サーバーから読み込んだ field 一覧（ボトムシート・AddPinSheet 用） */
  const [fieldList, setFieldList] = useState<FieldListItem[]>([]);
  /** 田んぼごとの統計（ピンのステータスから集計） */
  const [fieldStats, setFieldStats] = useState<Map<string, { pendingCount: number; lastRecord: string }>>(new Map());
  /** 記録ボタンのポップオーバー */
  const [recordPopOpen, setRecordPopOpen] = useState(false);
  const locationMarkerRef = useRef<Marker | null>(null);
  const fieldLabelsRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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

  // モードを map click ハンドラ（一度だけ登録）から参照するためのref
  const modeRef = useRef(mode);
  modeRef.current = mode;

  /** DOM更新・シートアニメ完了後にMapLibreのサイズを再計算する（多重防御） */
  const resizeMapSoon = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mapRef.current?.resize();
        setTimeout(() => {
          mapRef.current?.resize();
          mapRef.current?.triggerRepaint();
        }, 250);
      });
    });
  }, []);

  /**
   * どのモードからでも通常閲覧へ確実に戻す単一の出口。
   * 中途半端な選択・プレビュー・ピン・記録ポップを残さず、地図サイズも再計算する。
   */
  const returnToBrowse = useCallback(() => {
    cancelDraw();
    setMode({ kind: "browse" });
    setPreviewField(null);
    setPendingPinLngLat(null);
    setRedrawTarget(null);
    setRecordPopOpen(false);
    clearTimeout(previewTimerRef.current);
    resizeMapSoon();
  }, [cancelDraw, resizeMapSoon]);

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
      if (vertices.length < 3) {
        returnToBrowse();
        return;
      }
      const selectAndFly = () => {
        setMode({ kind: "field", field: { id: target.id, name } });
        flyToVertices(vertices);
      };
      const applyLocally = () => {
        updateSavedField(target.id, name, vertices);
        applyServerFieldUpdate(target.id, name, vertices);
      };
      if (farmLiveRef.current) {
        updateField(target.id, name, vertices).then((result) => {
          if (result === "saved") {
            applyLocally();
            selectAndFly();
            setToast("田んぼを描き直しました");
          } else if (result === "demo") {
            applyLocally();
            selectAndFly();
            setToast("ローカルで更新しました（ログインすると共有されます）");
          } else if (result === "denied") {
            returnToBrowse();
            setToast("変更できませんでした（編集権限がありません）");
          } else {
            returnToBrowse();
            setToast("更新を保存できませんでした。通信環境を確認してください");
          }
        });
      } else {
        applyLocally();
        selectAndFly();
        setToast("田んぼを描き直しました");
      }
      return;
    }

    // 新規: ローカル表示に追加しつつSupabaseへ保存
    const localId = saveName(pendingName);
    if (vertices.length < 3) {
      returnToBrowse();
      return;
    }
    // 保存後は通常閲覧へ戻す。地図の中心・ズームは維持（ユーザーは既に場所を見ている）
    captureSequence("新規保存・前");
    cancelDraw();
    setMode({ kind: "browse" });
    setPreviewField(null);
    setRedrawTarget(null);
    setRecordPopOpen(false);
    clearTimeout(previewTimerRef.current);
    resizeMapSoon();
    captureSequence("新規保存・後");
    saveFieldPolygon(name, vertices).then(({ status, id }) => {
      if (status === "saved") {
        if (id) {
          replaceSavedFieldId(localId, id);
          setRedrawTarget((prev) => (prev && prev.id === localId ? { ...prev, id } : prev));
          setRenameTarget((prev) => (prev && prev.id === localId ? { ...prev, id } : prev));
        }
        setToast("田んぼを保存しました");
      } else if (status === "demo") {
        setToast("ローカルに追加しました（ログインすると共有保存されます）");
      } else {
        setToast("保存に失敗しました。通信環境を確認してください");
      }
    });
  };

  /** 場所合わせ（placing）を開始する。redraw を渡すと描き直し扱い */
  const startPlacing = (redraw: SelectedField | null) => {
    setRedrawTarget(redraw);
    setPreviewField(null);
    setRecordPopOpen(false);
    clearTimeout(previewTimerRef.current);
    setMode({ kind: "placing" });
  };

  /** placing →「この場所で輪郭を描く」: 初めて描画モードへ入る */
  const beginDrawing = () => {
    setLiveEmpty(false);
    startDraw();
    // drawState が drawing になり描画オーバーレイが優先表示される。modeは中立に戻す
    setMode({ kind: "browse" });
  };

  /** drawing →「場所を合わせ直す」: 輪郭を捨てて placing へ戻る（redrawTargetは保持） */
  const repositionDraw = () => {
    cancelDraw();
    setMode({ kind: "placing" });
  };

  /** 操作カードの「描き直す」: 場所合わせから始める */
  const startRedraw = () => {
    if (!selectedField) return;
    startPlacing(selectedField);
  };

  /** ピン追加（場所選択）を開始する */
  const startAddPin = (fieldId: string | null) => {
    setPendingPinLngLat(null);
    setMode({ kind: "addPin", fieldId });
    setToast("地図をタップしてピンの場所を選んでください");
  };

  /** 「田んぼを選ぶ」: 登録田んぼ一覧を開く */
  const openPicker = () => {
    setRecordPopOpen(false);
    setPreviewField(null);
    setMode({ kind: "picker" });
  };

  /** 名前変更ダイアログの確定（ローカル反映はDB更新の成功後） */
  const commitRename = () => {
    const target = renameTarget;
    if (!target) return;
    const name = renameValue.trim() || target.name;
    setRenameTarget(null);
    setMode({ kind: "browse" });
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
    setMode({ kind: "browse" });
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

    const newPoint: FieldPoint = {
      id: `local-${crypto.randomUUID()}`,
      fieldId: params.fieldId ?? "",
      name: params.name,
      type: params.pointType,
      status: "normal",
      lastRecord: "記録なし",
      lngLat,
    };

    // 楽観的に新規ピンを選択表示
    setMode({ kind: "point", point: newPoint });

    // Markerをマップへ追加してから DB保存へ進む（awaitで順序を保証し二重表示を防ぐ）
    {
      const maplibre = await import("maplibre-gl");
      const map = mapRef.current;
      if (map) {
        const marker = createPinMarker(maplibre, map, newPoint, () => {
          setMode({ kind: "point", point: newPoint });
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
        deleteFieldPoint(id).then((r) => {
          if (r !== "deleted") console.warn("[farm] cancel-delete failed", r, id);
        });
        return;
      }
      // Markerを作り直してDB IDのオブジェクトを参照させる
      // （クロージャが localId を保持したままになるため差し替えだけでは不十分）
      const dbPoint: FieldPoint = { ...newPoint, id };
      setMode((m) => (m.kind === "point" && m.point.id === newPoint.id ? { kind: "point", point: dbPoint } : m));
      setEditingPoint((prev) => (prev?.id === newPoint.id ? dbPoint : prev));
      import("maplibre-gl").then((maplibre) => {
        const map = mapRef.current;
        if (!map) return;
        const old = pinMarkersRef.current.get(newPoint.id);
        // import().then()の間にローカルピンが削除された場合もDBを取り消す
        if (!old) {
          deleteFieldPoint(id).then((r) => {
            if (r !== "deleted") console.warn("[farm] cancel-delete failed", r, id);
          });
          return;
        }
        old.remove();
        pinMarkersRef.current.delete(newPoint.id);
        const marker = createPinMarker(maplibre, map, dbPoint, () => {
          setMode({ kind: "point", point: dbPoint });
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
      setMode((m) => (m.kind === "point" && m.point.id === newPoint.id ? { kind: "browse" } : m));
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
      setMode((m) => (m.kind === "point" && m.point.id === point.id ? { kind: "point", point: updated } : m));
      // Markerを作り直す（SVGアイコンと種別ラベルを更新するため）
      import("maplibre-gl").then((maplibre) => {
        const map = mapRef.current;
        if (!map) return;
        const old = pinMarkersRef.current.get(point.id);
        if (old) old.remove();
        const marker = createPinMarker(maplibre, map, updated, () => {
          setMode({ kind: "point", point: updated });
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
      setMode((m) => (m.kind === "point" && m.point.id === point.id ? { kind: "browse" } : m));
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

  /** 指定 id の田んぼへフライ。serverFields / savedFields から重心を計算する */
  const flyToField = (id: string) => {
    const map = mapRef.current;
    if (!map) return;
    const serverFeat = serverFields?.features.find(
      (f) => String(f.id ?? f.properties?.id) === id
    );
    if (serverFeat?.geometry.type === "Polygon") {
      const center = polygonCentroid(serverFeat.geometry.coordinates[0]);
      map.flyTo({ center, zoom: Math.max(map.getZoom(), 15.5), duration: 700 });
      return;
    }
    const local = savedFields.find((f) => f.id === id);
    if (local && local.vertices.length >= 3) {
      const center = polygonCentroid([...local.vertices, local.vertices[0]]);
      map.flyTo({ center, zoom: Math.max(map.getZoom(), 15.5), duration: 700 });
    }
  };
  const flyToFieldRef = useRef(flyToField);
  flyToFieldRef.current = flyToField;

  /** 頂点配列の重心へフライ（保存直後でstateが未反映でも確実に寄せる用） */
  const flyToVertices = (vertices: [number, number][]) => {
    const map = mapRef.current;
    if (!map || vertices.length < 3) return;
    const center = polygonCentroid([...vertices, vertices[0]]);
    map.flyTo({ center, zoom: Math.max(map.getZoom(), 15.5), duration: 700 });
  };

  /**
   * プレビュー用: ズーム変更なしで田んぼの重心へ緩やかにパンする。
   * 下部シート（約48%）の裏に隠れないよう、画面の見える上側へオフセットして寄せる。
   */
  const panToField = (id: string) => {
    const map = mapRef.current;
    if (!map) return;
    // シート分だけ上方向へずらして、田んぼが見える領域の中央に来るようにする
    const offsetY = Math.round(map.getContainer().clientHeight * 0.22);
    const ease = (center: [number, number]) =>
      map.easeTo({ center, duration: 400, offset: [0, -offsetY] });
    const serverFeat = serverFields?.features.find(
      (f) => String(f.id ?? f.properties?.id) === id
    );
    if (serverFeat?.geometry.type === "Polygon") {
      ease(polygonCentroid(serverFeat.geometry.coordinates[0]));
      return;
    }
    const local = savedFields.find((f) => f.id === id);
    if (local && local.vertices.length >= 3) {
      ease(polygonCentroid([...local.vertices, local.vertices[0]]));
    }
  };
  const panToFieldRef = useRef(panToField);
  panToFieldRef.current = panToField;

  const handlePreview = useCallback((field: FieldListItem | null) => {
    setPreviewField(field ? { id: field.id, name: field.name } : null);
    clearTimeout(previewTimerRef.current);
    if (field) {
      // スクロール停止後に短いdebounceでパン（激しく飛び回らないように）
      previewTimerRef.current = setTimeout(() => {
        panToFieldRef.current(field.id);
      }, 300);
    }
  }, []);

  const handlePickerSelect = useCallback((f: FieldListItem) => {
    setPreviewField(null);
    clearTimeout(previewTimerRef.current);
    setMode({ kind: "field", field: { id: f.id, name: f.name } });
    flyToFieldRef.current(f.id);
    resizeMapSoon();
  }, [resizeMapSoon]);

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let map: MLMap | undefined;
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;

    // 地図ライブラリと田んぼデータ（Supabaseまたはサンプル）を並行読込
    Promise.all([import("maplibre-gl"), loadFarmData()]).then(([maplibre, farm]) => {
      if (cancelled || !mapContainerRef.current) return;

      // error はログイン済みの取得失敗（編集系の各関数がセッションを再検証するためliveと同等に扱う）
      farmLiveRef.current = farm.mode === "live" || farm.mode === "error";
      setAnonMode(farm.mode === "anon");
      if (farm.mode === "error") {
        setToast("データを読み込めませんでした。通信環境を確認して開き直してください");
      }

      // ピンのステータスから田んぼごとの統計を集計（追加API呼び出しなし）
      {
        const stats = new Map<string, { pendingCount: number; lastRecord: string }>();
        farm.points.forEach((p) => {
          if (!p.fieldId) return;
          const existing = stats.get(p.fieldId) ?? { pendingCount: 0, lastRecord: "" };
          if (p.status === "needs_check" || p.status === "issue") existing.pendingCount++;
          if (p.lastRecord && p.lastRecord !== "記録なし") existing.lastRecord = p.lastRecord;
          stats.set(p.fieldId, existing);
        });
        setFieldStats(stats);
      }

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

      // コンテナのサイズ変化（シート開閉・viewport変化）で常にresizeする多重防御
      resizeObserver = new ResizeObserver(() => mapRef.current?.resize());
      resizeObserver.observe(mapContainerRef.current);

      map.on("error", (e) => {
        console.error("[MapLibre error]", e);
        const msg = (e.error?.message ?? String(e.error ?? "")).toLowerCase();
        if (msg.includes("fetch") || msg.includes("tile") || msg.includes("network")) {
          setTileError(true);
        }
      });

      // モード別のタップ挙動:
      // - drawing: 描画effectが処理（ここでは無視）
      // - placing / picker: 地図の自由移動のみ（選択しない）
      // - addPin: タップ座標を pendingPinLngLat にセット
      // - browse / field / point: 田んぼタップで詳細、空きタップで通常閲覧へ
      map.on("click", (e: MapMouseEvent) => {
        if (isDrawingRef.current) return;
        const m = modeRef.current;
        if (m.kind === "placing" || m.kind === "picker") return;
        if (m.kind === "addPin") {
          setPendingPinLngLat([e.lngLat.lng, e.lngLat.lat]);
          setToast(null);
          return;
        }
        setRecordPopOpen(false);
        const hit = findFieldAtRef.current([e.lngLat.lng, e.lngLat.lat]);
        if (hit) {
          setMode({ kind: "field", field: hit });
          flyToFieldRef.current(hit.id);
        } else {
          setMode({ kind: "browse" });
        }
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

        // ── プレビュー中の田んぼの強調表示（アンバー） ──────
        map.addLayer({
          id: "fields-preview",
          type: "line",
          source: "fields",
          paint: { "line-color": "#F59E0B", "line-width": 4.5 },
          filter: ["==", ["get", "id"], "__none__"],
        });
        map.addLayer({
          id: "user-fields-preview",
          type: "line",
          source: "user-fields",
          paint: { "line-color": "#F59E0B", "line-width": 4.5 },
          filter: ["==", ["get", "id"], "__none__"],
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
            setMode({ kind: "point", point });
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
      resizeObserver?.disconnect();
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

  // プレビュー中の田んぼを強調表示（アンバー）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const idValue = previewField?.id ?? "__none__";
    for (const layer of ["fields-preview", "user-fields-preview"]) {
      if (map.getLayer(layer)) map.setFilter(layer, ["==", ["get", "id"], idValue]);
    }
  }, [previewField]);

  // viewport 変化時に MapLibre の resize を実行（iOS Safari アドレスバー等）
  useEffect(() => {
    const handleResize = () => mapRef.current?.resize();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // モードが変わるたび（シート開閉等のレイアウト変化）に地図サイズを再計算
  useEffect(() => {
    resizeMapSoon();
  }, [mode.kind, resizeMapSoon]);

  // プレビュータイマーのクリーンアップ
  useEffect(() => {
    return () => clearTimeout(previewTimerRef.current);
  }, []);

  // AddPinSheet の田んぼ候補を serverFields + savedFields から常に同期する
  useEffect(() => {
    const fromServer = (serverFields?.features ?? []).flatMap((f) => {
      const id = String(f.id ?? f.properties?.id ?? "");
      if (!id) return [];
      return [{ id, name: String(f.properties?.name ?? "") }];
    });
    // liveモード時のみ user-field-*（DB未保存）を除外してFK不整合を防ぐ
    // demo/anonモードでは saveFieldPoint もローカル保存なので除外不要
    const fromLocal = savedFields
      .filter((f) => !farmLiveRef.current || !f.id.startsWith("user-field-"))
      .map((f) => ({ id: f.id, name: f.name }));
    const seen = new Set<string>();
    const merged = [...fromServer, ...fromLocal]
      .filter(({ id }) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((f) => ({
        ...f,
        pendingCount: fieldStats.get(f.id)?.pendingCount,
        lastRecord: fieldStats.get(f.id)?.lastRecord,
      }));
    setFieldList(merged);
  }, [serverFields, savedFields, fieldStats]);

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

  const idle = !isDrawing && !isNaming;
  const showTopBar = idle && (mode.kind === "browse" || mode.kind === "field" || mode.kind === "point");
  const showControls = idle && mode.kind !== "picker";
  const showDetail = idle && (mode.kind === "field" || mode.kind === "point");

  return (
    <div ref={rootRef} className="absolute inset-0">
      {/* マップキャンバス（maplibreのCSSがpositionを上書きするためh-fullで明示サイズ指定） */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* タイル取得失敗バナー */}
      {tileError && (
        <div className="absolute top-3 inset-x-3 z-20 flex justify-center pointer-events-none">
          <div className="flex max-w-xs items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow pointer-events-auto">
            <IconWarningFill className="h-5 w-5 shrink-0 text-amber-500" />
            <span>航空写真を読み込めません。区画・ピンは表示しています。</span>
          </div>
        </div>
      )}

      {/* 上部ボタン: ≡ + 田んぼを選ぶ + 凡例（通常閲覧・田んぼ詳細・ピン詳細） */}
      {showTopBar && (
        <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* mobile ≡ button (hidden on lg+ where SideNav is visible) */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="メニューを開く"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white active:bg-gray-50 lg:hidden"
            >
              <IconMenu className="h-5.5 w-5.5" />
            </button>
            <button
              onClick={openPicker}
              className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white active:bg-gray-50"
            >
              <IconListBullet className="h-4.5 w-4.5 text-gray-500" />
              田んぼを選ぶ
            </button>
          </div>
          <div className="pointer-events-auto space-y-2 rounded-xl bg-white/90 px-2.5 py-2.5 shadow-md backdrop-blur-sm">
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
        </div>
      )}

      {/* 右側コントロール（現在地・ズーム）: picker以外で表示（placing/addPinでも地図操作可） */}
      {showControls && (
        <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-2">
          <button
            onClick={() => flyToCurrentLocation()}
            aria-label="現在地に戻る"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-50"
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
        </div>
      )}

      {/* 記録ボタン（下部中央） — 通常閲覧のみ */}
      {idle && mode.kind === "browse" && (
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center">
          <div className="relative">
            {recordPopOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRecordPopOpen(false)} />
                <div className="absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 flex-col gap-2">
                  <Link
                    href="/records/new"
                    onClick={() => setRecordPopOpen(false)}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-green-700 py-2.5 pl-3 pr-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-800"
                  >
                    <IconCamera className="h-5 w-5 shrink-0" />
                    写真で記録
                  </Link>
                  <Link
                    href="/records/new?type=audio"
                    onClick={() => setRecordPopOpen(false)}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-2.5 pl-3 pr-4 text-sm font-semibold text-gray-700 shadow-lg transition-colors hover:bg-gray-50"
                  >
                    <IconMic className="h-5 w-5 shrink-0 text-green-700" />
                    音声メモ
                  </Link>
                </div>
              </>
            )}
            <button
              onClick={() => setRecordPopOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white shadow-xl transition-colors hover:bg-green-800 active:bg-green-900"
            >
              <IconCamera className="h-5 w-5" />
              記録する
            </button>
          </div>
        </div>
      )}

      {/* 田んぼ選択シート（登録田んぼ一覧） */}
      {idle && mode.kind === "picker" && (
        <FieldSearchSheet
          fieldList={fieldList}
          anonMode={anonMode}
          liveEmpty={liveEmpty}
          loaded={serverFields !== null}
          onFieldSelect={handlePickerSelect}
          onPreview={handlePreview}
          onStartRegister={() => startPlacing(null)}
          onClose={returnToBrowse}
        />
      )}

      {/* 場所合わせ（新規/描き直し） */}
      {idle && mode.kind === "placing" && (
        <FieldPlaceOverlay
          redraw={!!redrawTarget}
          onStart={beginDrawing}
          onCancel={returnToBrowse}
        />
      )}

      {/* 田んぼ詳細 / ピン詳細 — モバイル: ボトムシート, PC: 右パネル */}
      {showDetail && (
        <>
          <div className="lg:hidden">
            <MapBottomSheet
              selectedPoint={selectedPoint}
              selectedField={selectedField}
              onFieldClose={returnToBrowse}
              onAddPin={(fieldId) => startAddPin(fieldId ?? null)}
              onEditPin={(p) => setEditingPoint(p)}
              onRenameField={() => {
                if (selectedField) {
                  setRenameTarget(selectedField);
                  setRenameValue(selectedField.name);
                }
              }}
              onRedrawField={startRedraw}
              onDeleteField={() => setConfirmingDelete(true)}
            />
          </div>
          <MapDetailPanel
            selectedPoint={selectedPoint}
            selectedField={selectedField}
            onFieldClose={returnToBrowse}
            onAddPin={(fieldId) => startAddPin(fieldId ?? null)}
            onEditPin={(p) => setEditingPoint(p)}
            onRenameField={() => {
              if (selectedField) {
                setRenameTarget(selectedField);
                setRenameValue(selectedField.name);
              }
            }}
            onRedrawField={startRedraw}
            onDeleteField={() => setConfirmingDelete(true)}
          />
        </>
      )}

      {/* ── 描画モード UI ─────────────────────────────── */}
      {isDrawing && (
        <FieldDrawOverlay
          vertexCount={vertexCount}
          onFinish={finishDraw}
          onReposition={repositionDraw}
          onCancel={returnToBrowse}
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
          onCancel={returnToBrowse}
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
      {idle && mode.kind === "addPin" && !pendingPinLngLat && (
        <div className="absolute inset-x-0 bottom-0 z-40">
          {/* PCではバナーを中央寄せキャップ */}
          <div className="mx-auto w-full max-w-md rounded-t-3xl bg-gray-900 px-4 pb-8 pt-4 text-center text-white shadow-2xl md:max-w-2xl">
            <p className="text-sm font-bold">地図をタップしてピンの場所を選んでください</p>
            <button
              onClick={returnToBrowse}
              className="mt-3 rounded-xl border border-gray-600 px-6 py-2.5 text-sm font-semibold text-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ── ピン追加: 種別・名前選択シート ───────────────── */}
      {pendingPinLngLat && mode.kind === "addPin" && (
        <AddPinSheet
          fields={fieldList}
          initialFieldId={mode.fieldId}
          onConfirm={handleAddPinConfirm}
          onCancel={returnToBrowse}
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
        <div className="absolute inset-x-3 top-3 z-50 flex justify-center pointer-events-none">
          <div className="rounded-xl bg-gray-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg pointer-events-auto">
            {toast}
          </div>
        </div>
      )}

      {/* レイアウト診断パネル (?layoutDebug=1) */}
      <LayoutDebugPanel rootRef={rootRef} mapContainerRef={mapContainerRef} mapRef={mapRef} />
    </div>
  );
}
