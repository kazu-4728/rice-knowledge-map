"use client";

import { useEffect, useMemo, useState } from "react";
import type { GeoJSON } from "geojson";
import { loadFarmData, updateFieldPhoto, uploadFieldPhoto, getSignedPhotoUrls } from "../../../lib/data/farm";
import { loadRecords, isUnresolvedIssue } from "../../../lib/data/records";
import { loadImageSlots } from "../../../lib/data/siteContent";
import { resolveFieldCoverUrl } from "../../../lib/data/media";
import type { FieldPoint, RecordItem } from "../../../types";

/** ピンの状態の要対応順（issue > needs_check > normal > resolved） */
const POINT_STATUS_ORDER: Record<FieldPoint["status"], number> = {
  issue: 0,
  needs_check: 1,
  normal: 2,
  resolved: 3,
};

export type ObservationPhoto = { id: string; date: string; shortDate: string; url?: string };

/** 定点観測グルーピングの生データ（label/iconはJSXを要するためコンポーネント側で解決する） */
export type ObservationGroupRaw = {
  key: string;
  pointId: string | null;
  isFieldWide: boolean;
  photos: ObservationPhoto[];
};

export type FieldDetailField = {
  name: string;
  color: string;
  groupId: string;
  areaSqm: number | null;
  photoUrl: string | null;
  /** 小さな地図（場所確認用）の表示に使う輪郭。未登録/取得前はnull */
  boundary: GeoJSON.Polygon | null;
};

export type FieldDetail = {
  loading: boolean;
  notFound: boolean;
  field: FieldDetailField;
  /** グループの全田んぼ（田んぼ切替チップ用。display_order順） */
  allFields: { id: string; name: string }[];
  points: FieldPoint[];
  sortedPoints: FieldPoint[];
  records: RecordItem[];
  thumbUrls: Record<string, string>;
  attention: FieldPoint[];
  openRecords: RecordItem[];
  observationGroups: ObservationGroupRaw[];
  categoryCounts: { cat: RecordItem["category"]; count: number }[];
  lastRecord: RecordItem | undefined;
  handlePhotoSelect: (file: File) => Promise<void>;
  /** カバー実写の解決済みURL（field.photoUrl > オーナー差し替え > システム既定） */
  coverImageUrl: string | undefined;
};

/**
 * /fields/[id] のデータ取得を1本化するフック。
 * sortedPoints/observationGroups/categoryCounts は以前レンダー毎に再計算していたが useMemo 化する。
 */
export function useFieldDetail(fieldId: string): FieldDetail {
  const [field, setField] = useState<FieldDetailField>({ name: "", color: "#22C55E", groupId: "", areaSqm: null, photoUrl: null, boundary: null });
  const [allFields, setAllFields] = useState<{ id: string; name: string }[]>([]);
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [defaultCoverUrl, setDefaultCoverUrl] = useState(() => resolveFieldCoverUrl(undefined, {}));

  useEffect(() => {
    loadImageSlots().then((slots) => setDefaultCoverUrl(resolveFieldCoverUrl(undefined, slots)));
  }, []);

  useEffect(() => {
    // この田んぼの記録を全件取得する（状態サマリーの未対応集計が最新100件外の古い異常を
    // 取りこぼして「異常なし」と誤表示しないよう all:true。デモ時は全件返るため下でクライアント絞り込み）
    Promise.all([loadFarmData(), loadRecords({ fieldId, all: true })]).then(async ([farm, rec]) => {
      setAllFields(
        farm.fieldsGeoJSON.features.map((f) => ({
          id: String(f.id ?? f.properties?.id ?? ""),
          name: String(f.properties?.name ?? ""),
        }))
      );
      const feature = farm.fieldsGeoJSON.features.find(
        (f) => String(f.id ?? f.properties?.id ?? "") === fieldId
      );
      if (!feature) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const groupId = feature.properties?.group_id ?? farm.groupId ?? "";
      const areaSqm = typeof feature.properties?.area_sqm === "number" ? feature.properties.area_sqm : null;
      const pPath: string | null = feature.properties?.photo_path ?? null;

      let photoUrl: string | null = null;
      if (pPath) {
        const signed = await getSignedPhotoUrls([pPath]);
        if (signed[pPath]) photoUrl = signed[pPath];
      }

      setField({
        name: String(feature.properties?.name ?? ""),
        color: String(feature.properties?.color ?? "#22C55E"),
        groupId,
        areaSqm,
        photoUrl,
        boundary: feature.geometry?.type === "Polygon" ? (feature.geometry as GeoJSON.Polygon) : null,
      });

      setPoints(farm.points.filter((p) => p.fieldId === fieldId));
      setRecords(rec.records.filter((r) => r.fieldId === fieldId));
      setThumbUrls(rec.thumbUrls);
      setLoading(false);
    });
  }, [fieldId]);

  const handlePhotoSelect = async (file: File) => {
    if (!field.groupId) return;
    const path = await uploadFieldPhoto(field.groupId, fieldId, file);
    if (!path) return;
    const saved = await updateFieldPhoto(fieldId, path);
    if (!saved) return;
    if (field.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(field.photoUrl);
    setField((prev) => ({ ...prev, photoUrl: URL.createObjectURL(file) }));
  };

  const attention = useMemo(
    () => points.filter((p) => p.status === "issue" || p.status === "needs_check"),
    [points]
  );
  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => POINT_STATUS_ORDER[a.status] - POINT_STATUS_ORDER[b.status]),
    [points]
  );
  const openRecords = useMemo(() => records.filter(isUnresolvedIssue), [records]);
  const photoRecords = useMemo(() => records.filter((r) => r.media === "photo"), [records]);

  const observationGroups = useMemo(() => {
    const groupMap = new Map<string, RecordItem[]>();
    photoRecords
      .filter((r) => (r.photoCount ?? 0) > 0)
      .forEach((r) => {
        const key = r.pointId ?? "__field__";
        const list = groupMap.get(key) ?? [];
        list.push(r);
        groupMap.set(key, list);
      });
    return [...groupMap.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort(
          (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        return {
          key,
          pointId: key === "__field__" ? null : key,
          isFieldWide: key === "__field__",
          photos: sorted.map((r) => ({
            id: r.id,
            date: r.date,
            shortDate: `${new Date(r.recordedAt).getMonth() + 1}/${new Date(r.recordedAt).getDate()}`,
            url: thumbUrls[r.id],
          })),
        } satisfies ObservationGroupRaw;
      })
      .sort((a, b) => (a.isFieldWide === b.isFieldWide ? 0 : a.isFieldWide ? 1 : -1));
  }, [photoRecords, thumbUrls]);

  const categoryCounts = useMemo(() => {
    const order: RecordItem["category"][] = ["水管理", "作業", "異常", "音声"];
    return order
      .map((cat) => ({ cat, count: records.filter((r) => r.category === cat).length }))
      .filter((c) => c.count > 0);
  }, [records]);

  const lastRecord = records[0]; // loadRecords は新しい順に返す
  const coverImageUrl = field.photoUrl ?? defaultCoverUrl;

  return {
    loading,
    notFound,
    field,
    allFields,
    points,
    sortedPoints,
    records,
    thumbUrls,
    attention,
    openRecords,
    observationGroups,
    categoryCounts,
    lastRecord,
    handlePhotoSelect,
    coverImageUrl,
  };
}
