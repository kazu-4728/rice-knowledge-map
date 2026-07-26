import { getSupabase } from "../supabase/client";
import { TYPE_TO_CATEGORY, ISSUE_POINT_TYPES } from "./records";
import { statusLabelFor } from "./recordDetail";
import { isPointType, TYPE_LABELS } from "../../features/map/mapPins";
import type { FieldPointType } from "../../types";
import type { RecordRow, RecordCategoryLabel } from "../supabase/types";

export type ExportPhoto = {
  id: string;
  /** 署名URL（1時間有効。エクスポート操作の間だけ使う短命データのため画像と同じ期限で十分） */
  url: string;
  /** 記録操作時の時刻・位置（record_media.captured_at/latitude/longitude） */
  recordedAt: string | null;
  recordedLatitude: number | null;
  recordedLongitude: number | null;
  /** 写真ファイル自体のEXIF（抽出できた場合のみ。無ければnull） */
  exifCapturedAt: string | null;
  exifLatitude: number | null;
  exifLongitude: number | null;
};

export type ExportRecord = {
  id: string;
  title: string;
  fieldName: string;
  pointTypeLabel: string;
  category: RecordCategoryLabel;
  statusLabel: string;
  recordedAtISO: string;
  note: string;
  summary: string;
  nextAction: string;
  latitude: number | null;
  longitude: number | null;
  photos: ExportPhoto[];
  hasAudio: boolean;
};

export type ExportRecordsData = {
  /**
   * demo: Supabase未設定
   * anon: 未ログイン
   * live: ログイン済み
   * error: 取得失敗
   */
  mode: "demo" | "anon" | "live" | "error";
  records: ExportRecord[];
};

type ExportMediaRow = {
  id: string;
  media_type: "image" | "audio";
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  captured_at: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  exif_captured_at: string | null;
  exif_latitude: string | number | null;
  exif_longitude: string | number | null;
};

type ExportRow = RecordRow & {
  farm_fields: { name: string } | null;
  latitude: string | number | null;
  longitude: string | number | null;
  next_action: string | null;
  ai_category: string | null;
  record_media: ExportMediaRow[];
};

const EXPORT_SELECT =
  "id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, next_action, recorded_by, recorded_at, latitude, longitude, " +
  "farm_fields(name), " +
  "record_media(id, media_type, storage_bucket, storage_path, created_at, captured_at, latitude, longitude, exif_captured_at, exif_latitude, exif_longitude)";

function toNullableNumber(v: string | number | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 指定した年・田んぼ（任意）の記録を、CSV/ZIPエクスポート用のリッチな形で取得する。
 * `/export` のプレビュー表示は既存の `loadRecords()`（軽量・サムネのみ）を使い続け、
 * CSV/ZIPボタンを押したときだけ本関数で必要な全フィールド・全写真・EXIFを取得する。
 */
export async function loadExportRecords(opts: { year: number; fieldId?: string }): Promise<ExportRecordsData> {
  const sb = getSupabase();
  if (!sb) return { mode: "demo", records: [] };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { mode: "anon", records: [] };

    // ローカル年境界のISO文字列（年をまたぐタイムゾーンのズレは既存/exportの年別フィルタと同じ許容範囲）
    const from = new Date(opts.year, 0, 1).toISOString();
    const to = new Date(opts.year + 1, 0, 1).toISOString();

    const PAGE = 1000;
    const rows: ExportRow[] = [];
    for (let offset = 0; ; offset += PAGE) {
      let q = sb
        .from("records")
        .select(EXPORT_SELECT)
        .gte("recorded_at", from)
        .lt("recorded_at", to)
        .order("recorded_at", { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (opts.fieldId) q = q.eq("field_id", opts.fieldId);
      const { data, error } = await q;
      if (error) {
        console.warn("[exportData] fetch failed", error);
        return { mode: "error", records: [] };
      }
      const page = (data ?? []) as unknown as ExportRow[];
      rows.push(...page);
      if (page.length < PAGE) break;
    }

    // 記録に含まれる写真の署名URLを一括発行する
    const imagePaths: { mediaId: string; path: string }[] = [];
    for (const r of rows) {
      for (const m of r.record_media ?? []) {
        if (m.media_type === "image" && m.storage_bucket === "images") {
          imagePaths.push({ mediaId: m.id, path: m.storage_path });
        }
      }
    }
    const urlByMediaId: Record<string, string> = {};
    if (imagePaths.length > 0) {
      const { data: signed, error: signError } = await sb.storage
        .from("images")
        .createSignedUrls(imagePaths.map((p) => p.path), 3600);
      if (signError) {
        console.warn("[exportData] sign urls failed", signError);
      } else {
        signed?.forEach((s, i) => {
          if (s.signedUrl && !s.error) urlByMediaId[imagePaths[i].mediaId] = s.signedUrl;
        });
      }
    }

    const records: ExportRecord[] = rows.map((r) => {
      const safePointType: FieldPointType | null = isPointType(r.ai_category) ? r.ai_category : null;
      const isIssueRecord = r.record_type === "issue" || (safePointType !== null && ISSUE_POINT_TYPES.includes(safePointType));
      const sortedMedia = [...(r.record_media ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const photos: ExportPhoto[] = sortedMedia
        .filter((m) => m.media_type === "image" && urlByMediaId[m.id])
        .map((m) => ({
          id: m.id,
          url: urlByMediaId[m.id],
          recordedAt: m.captured_at,
          recordedLatitude: toNullableNumber(m.latitude),
          recordedLongitude: toNullableNumber(m.longitude),
          exifCapturedAt: m.exif_captured_at,
          exifLatitude: toNullableNumber(m.exif_latitude),
          exifLongitude: toNullableNumber(m.exif_longitude),
        }));

      return {
        id: r.id,
        title: r.title || "（無題の記録）",
        fieldName: r.farm_fields?.name ?? "田んぼ未選択",
        pointTypeLabel: safePointType ? TYPE_LABELS[safePointType] : "",
        category: TYPE_TO_CATEGORY[r.record_type] ?? "作業",
        statusLabel: statusLabelFor(r.status, isIssueRecord),
        recordedAtISO: r.recorded_at,
        note: r.note || "",
        summary: r.ai_summary || "",
        nextAction: r.next_action || "",
        latitude: toNullableNumber(r.latitude),
        longitude: toNullableNumber(r.longitude),
        photos,
        hasAudio: (r.record_media ?? []).some((m) => m.media_type === "audio"),
      };
    });

    return { mode: "live", records };
  } catch (err) {
    console.warn("[exportData] load error", err);
    return { mode: "error", records: [] };
  }
}
