"use client";

import { useEffect, useState } from "react";
import {
  loadFarmData,
  updateFieldPhoto,
  uploadFieldPhoto,
  getSignedPhotoUrls,
  loadFieldLastRecordDates,
} from "../../../lib/data/farm";
import { excludePointBackedIssues, loadOpenIssueRecords } from "../../../lib/data/records";

export type FieldItem = {
  id: string;
  groupId: string;
  name: string;
  color: string;
  areaSqm: number | null;
  photoPath: string | null;
};

export type FieldStatus = {
  issueCount: number;
  needsCheckCount: number;
  lastRecordDate: string | null;
};

export type FieldsList = {
  mode: "loading" | "live" | "demo" | "anon" | "error";
  fields: FieldItem[];
  fieldStatuses: Record<string, FieldStatus>;
  photoUrls: Record<string, string>;
  handlePhotoSelect: (field: FieldItem, file: File) => Promise<void>;
};

/** /fields一覧のデータ取得を1本化するフック（Supabase直呼びはlib/data/farm.ts経由に統一済み） */
export function useFieldsList(): FieldsList {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldStatus>>({});
  const [mode, setMode] = useState<FieldsList["mode"]>("loading");

  useEffect(() => {
    loadFieldLastRecordDates().then((lastMap) => {
      setFieldStatuses((prev) => {
        const next = { ...prev };
        for (const [fid, date] of Object.entries(lastMap)) {
          next[fid] = {
            ...next[fid],
            issueCount: next[fid]?.issueCount ?? 0,
            needsCheckCount: next[fid]?.needsCheckCount ?? 0,
            lastRecordDate: date,
          };
        }
        return next;
      });
    });

    Promise.all([loadFarmData(), loadOpenIssueRecords()]).then(async ([data, { records: issueRecords }]) => {
      setMode(data.mode);
      const items: FieldItem[] = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        groupId: f.properties?.group_id ?? data.groupId ?? "",
        name: String(f.properties?.name ?? ""),
        color: String(f.properties?.color ?? "#22C55E"),
        areaSqm: typeof f.properties?.area_sqm === "number" ? f.properties.area_sqm : null,
        photoPath: f.properties?.photo_path ?? null,
      }));
      setFields(items);

      const statusMap: Record<string, FieldStatus> = {};
      for (const p of data.points) {
        if (!p.fieldId) continue;
        if (!statusMap[p.fieldId]) statusMap[p.fieldId] = { issueCount: 0, needsCheckCount: 0, lastRecordDate: null };
        if (p.status === "issue") statusMap[p.fieldId].issueCount++;
        else if (p.status === "needs_check") statusMap[p.fieldId].needsCheckCount++;
      }
      // ピン変更を伴わない「記録のみ」の異常も反映する（記録だけ残して放置した
      // 田んぼに「順調」バッジを出さない。ピン紐付き分は除外して二重集計を防ぐ）
      for (const r of excludePointBackedIssues(issueRecords, data.points)) {
        if (!r.fieldId) continue;
        if (!statusMap[r.fieldId]) statusMap[r.fieldId] = { issueCount: 0, needsCheckCount: 0, lastRecordDate: null };
        if (r.isIssue) statusMap[r.fieldId].issueCount++;
        else statusMap[r.fieldId].needsCheckCount++;
      }
      setFieldStatuses((prev) => {
        const next = { ...prev };
        for (const [fid, s] of Object.entries(statusMap)) {
          next[fid] = { ...next[fid], lastRecordDate: next[fid]?.lastRecordDate ?? null, issueCount: s.issueCount, needsCheckCount: s.needsCheckCount };
        }
        return next;
      });

      // batch signed URLs for fields with photos
      const paths = items.flatMap((f) => (f.photoPath ? [f.photoPath] : []));
      if (paths.length > 0) {
        const map = await getSignedPhotoUrls(paths);
        const urlMap: Record<string, string> = {};
        items.forEach((f) => { if (f.photoPath && map[f.photoPath]) urlMap[f.id] = map[f.photoPath]; });
        setPhotoUrls(urlMap);
      }
    });
  }, []);

  const handlePhotoSelect = async (field: FieldItem, file: File) => {
    if (!field.groupId) return;
    const path = await uploadFieldPhoto(field.groupId, field.id, file);
    if (!path) return;
    const saved = await updateFieldPhoto(field.id, path);
    if (!saved) return;
    // revoke previous blob URL to avoid memory growth
    const prevUrl = photoUrls[field.id];
    if (prevUrl?.startsWith("blob:")) URL.revokeObjectURL(prevUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrls((prev) => ({ ...prev, [field.id]: url }));
    setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, photoPath: path } : f)));
  };

  return { mode, fields, fieldStatuses, photoUrls, handlePhotoSelect };
}
