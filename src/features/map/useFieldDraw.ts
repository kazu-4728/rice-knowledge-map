"use client";

import { useState, useCallback } from "react";
import type { GeoJSON } from "geojson";

const FIELD_COLORS = [
  "#3B82F6", // 青
  "#EAB308", // 黄
  "#22C55E", // 緑
  "#A855F7", // 紫
  "#F97316", // オレンジ
  "#EC4899", // ピンク
];

type DrawState =
  | { mode: "idle" }
  | { mode: "drawing"; vertices: [number, number][] }
  | { mode: "naming"; vertices: [number, number][] };

export type SavedField = {
  id: string;
  name: string;
  color: string;
  vertices: [number, number][];
};

export function useFieldDraw() {
  const [drawState, setDrawState] = useState<DrawState>({ mode: "idle" });
  const [savedFields, setSavedFields] = useState<SavedField[]>([]);
  const [pendingName, setPendingName] = useState("");

  const startDraw = useCallback(() => {
    setDrawState({ mode: "drawing", vertices: [] });
  }, []);

  const addVertex = useCallback((lngLat: [number, number]) => {
    setDrawState((prev) => {
      if (prev.mode !== "drawing") return prev;
      return { mode: "drawing", vertices: [...prev.vertices, lngLat] };
    });
  }, []);

  const finishDraw = useCallback(() => {
    setDrawState((prev) => {
      if (prev.mode !== "drawing" || prev.vertices.length < 3) return prev;
      return { mode: "naming", vertices: prev.vertices };
    });
    setPendingName("");
  }, []);

  const cancelDraw = useCallback(() => {
    setDrawState({ mode: "idle" });
    setPendingName("");
  }, []);

  /** 描いた輪郭をローカル表示に追加して名前入力を終える。追加したローカルidを返す */
  const saveName = useCallback((name: string) => {
    const id = `user-field-${Date.now()}`;
    setDrawState((prev) => {
      if (prev.mode !== "naming") return prev;
      const color = FIELD_COLORS[savedFields.length % FIELD_COLORS.length];
      setSavedFields((fields) => [
        ...fields,
        { id, name: name.trim() || "新しい田んぼ", color, vertices: prev.vertices },
      ]);
      return { mode: "idle" };
    });
    setPendingName("");
    return id;
  }, [savedFields.length]);

  /** DB保存後に、ローカルidをDB上のidへ差し替える（保存直後の編集・削除のため） */
  const replaceSavedFieldId = useCallback((oldId: string, newId: string) => {
    setSavedFields((fields) => fields.map((f) => (f.id === oldId ? { ...f, id: newId } : f)));
  }, []);

  const undoVertex = useCallback(() => {
    setDrawState((prev) => {
      if (prev.mode !== "drawing") return prev;
      return { mode: "drawing", vertices: prev.vertices.slice(0, -1) };
    });
  }, []);

  /** ローカル保存せずに名前入力を閉じる（描き直し・サーバー保存フィールド用） */
  const closeNaming = useCallback(() => {
    setDrawState({ mode: "idle" });
    setPendingName("");
  }, []);

  /** ローカル表示中の田んぼを更新する。verticesを省略すると名前のみ変更 */
  const updateSavedField = useCallback(
    (id: string, name: string, vertices?: [number, number][]) => {
      setSavedFields((fields) =>
        fields.map((f) =>
          f.id === id
            ? { ...f, name: name.trim() || f.name, vertices: vertices ?? f.vertices }
            : f
        )
      );
    },
    []
  );

  /** ローカル表示中の田んぼを削除する */
  const deleteSavedField = useCallback((id: string) => {
    setSavedFields((fields) => fields.filter((f) => f.id !== id));
  }, []);

  // 描画中の仮ポリゴン（線と頂点）を GeoJSON で返す
  const drawingGeoJSON: GeoJSON.FeatureCollection = (() => {
    if (drawState.mode !== "drawing" || drawState.vertices.length === 0) {
      return { type: "FeatureCollection", features: [] };
    }
    const verts = drawState.vertices;
    const features: GeoJSON.Feature[] = [];

    // 線（頂点を結ぶ）
    if (verts.length >= 2) {
      const coords = [...verts];
      // 3点以上なら始点に戻して閉じた輪郭をプレビュー
      if (verts.length >= 3) coords.push(verts[0]);
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });
    }

    // 頂点（丸）
    verts.forEach((v, i) => {
      features.push({
        type: "Feature",
        properties: { index: i, isFirst: i === 0 },
        geometry: { type: "Point", coordinates: v },
      });
    });

    return { type: "FeatureCollection", features };
  })();

  // 保存済みフィールドの GeoJSON FeatureCollection
  const savedFieldsGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: savedFields.map((f) => ({
      type: "Feature",
      id: f.id,
      properties: { id: f.id, name: f.name, color: f.color },
      geometry: {
        type: "Polygon",
        coordinates: [[...f.vertices, f.vertices[0]]],
      },
    })),
  };

  return {
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
  };
}
