import type { FieldPointType, RecordItem } from "../../types";
import type { Numeric, RecordRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { recentRecords } from "../../data/dummy";

export type RecordsData = {
  /**
   * demo: Supabase未設定（サンプルデータを表示）
   * anon: 設定済みだが未ログイン（ログイン誘導を表示）
   * live: ログイン済みの実データ（0件もあり得る）
   * error: ログイン済みだが取得失敗
   */
  mode: "demo" | "anon" | "live" | "error";
  records: RecordItem[];
  /** 記録id → サムネイル画像の署名URL（写真がある記録のみ） */
  thumbUrls: Record<string, string>;
};

const DEMO: RecordsData = { mode: "demo", records: recentRecords, thumbUrls: {} };
const ANON: RecordsData = { mode: "anon", records: [], thumbUrls: {} };
const ERROR: RecordsData = { mode: "error", records: [], thumbUrls: {} };

const TYPE_TO_CATEGORY: Record<RecordRow["record_type"], RecordItem["category"]> = {
  water: "水管理",
  work: "作業",
  issue: "異常",
  voice: "音声",
  photo: "作業",
  check: "水管理",
  other: "作業",
};

type RecordListRow = RecordRow & {
  farm_fields: { name: string } | null;
  record_media: { media_type: "image" | "audio"; storage_bucket: string; storage_path: string }[];
  ai_category: string | null;
  latitude: Numeric | null;
  longitude: Numeric | null;
};

/** 保存時にai_categoryへ保持したポイント種別を読み戻す（不正値はrecord_typeから推定） */
const POINT_TYPES: readonly FieldPointType[] = [
  "inlet", "outlet", "canal", "caution", "weed", "levee_damage", "poor_drainage", "other",
];

function toPointType(r: RecordListRow): FieldPointType {
  if (r.ai_category && (POINT_TYPES as readonly string[]).includes(r.ai_category)) {
    return r.ai_category as FieldPointType;
  }
  return r.record_type === "issue" ? "caution" : "inlet";
}

/**
 * 「未対応」= 未解決の異常記録。records.status の既定値は 'open' のため、
 * 通常の写真/水管理/作業/音声記録も open になる。種別が異常（issue→category 異常）の
 * ものだけを対象にしないと、全記録が「未対応」と誤判定される。
 */
export function isUnresolvedIssue(r: RecordItem): boolean {
  return r.category === "異常" && (r.status === "open" || r.status === "needs_check");
}

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return {
    date: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${youbi}）`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

/**
 * 記録一覧を読み込む。サンプルを出すのはSupabase未設定のデモ環境のみ。
 * ログイン済みで0件のときは空の実データを返す（呼び出し側が空状態UIを出す）。
 */
const RECORD_SELECT =
  "id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, recorded_by, recorded_at, farm_fields(name), record_media(media_type, storage_bucket, storage_path)";

export async function loadRecords(opts?: { limit?: number; fieldId?: string; all?: boolean }): Promise<RecordsData> {
  // 一覧は最新100件で十分だが、エクスポート等は全件が必要なため上限を可変にする
  const limit = opts?.limit ?? 100;
  const sb = getSupabase();
  if (!sb) return DEMO;

  let authed = false;
  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return ANON;
    authed = true;

    // 特定の田んぼに絞る場合はサーバ側で絞り込む（100件上限で別田んぼに押し出されて
    // 集計が過少になるのを防ぐ）。fieldId は任意の追加フィルタとして適用する。
    let rows: RecordListRow[];
    if (opts?.all) {
      // エクスポート等の全件取得。PostgREST の最大行数（既定1000）を超えても取りこぼさないよう
      // range でページングして、満たないページが返るまで読み続ける
      const PAGE = 1000;
      rows = [];
      for (let from = 0; ; from += PAGE) {
        let q = sb.from("records").select(RECORD_SELECT).order("recorded_at", { ascending: false }).range(from, from + PAGE - 1);
        if (opts?.fieldId) q = q.eq("field_id", opts.fieldId);
        const { data, error } = await q;
        if (error) {
          console.warn("[records] fetch failed", error);
          return ERROR;
        }
        const page = (data ?? []) as unknown as RecordListRow[];
        rows.push(...page);
        if (page.length < PAGE) break;
      }
    } else {
      let q = sb.from("records").select(RECORD_SELECT).order("recorded_at", { ascending: false }).limit(limit);
      if (opts?.fieldId) q = q.eq("field_id", opts.fieldId);
      const { data, error } = await q;
      if (error) {
        console.warn("[records] fetch failed", error);
        return ERROR;
      }
      rows = (data ?? []) as unknown as RecordListRow[];
    }

    // 各記録の先頭の写真に署名URLを一括発行する
    const thumbPaths: { recordId: string; path: string }[] = [];
    for (const r of rows) {
      const image = r.record_media?.find((m) => m.media_type === "image" && m.storage_bucket === "images");
      if (image) thumbPaths.push({ recordId: r.id, path: image.storage_path });
    }
    const thumbUrls: Record<string, string> = {};
    if (thumbPaths.length > 0) {
      const { data: signed, error: signError } = await sb.storage
        .from("images")
        .createSignedUrls(thumbPaths.map((t) => t.path), 3600);
      if (signError) {
        console.warn("[records] sign urls failed", signError);
      } else {
        signed?.forEach((s, i) => {
          if (s.signedUrl && !s.error) thumbUrls[thumbPaths[i].recordId] = s.signedUrl;
        });
      }
    }

    return {
      mode: "live",
      thumbUrls,
      records: rows.map((r) => {
        const { date, time } = formatDate(r.recorded_at);
        const imageCount = r.record_media?.filter((m) => m.media_type === "image").length ?? 0;
        const isVoice = r.record_type === "voice";
        return {
          id: r.id,
          date,
          time,
          recordedAt: r.recorded_at,
          title: r.title || "（無題の記録）",
          fieldName: r.farm_fields?.name ?? "田んぼ未選択",
          fieldArea: "",
          category: TYPE_TO_CATEGORY[r.record_type] ?? "作業",
          status: r.status,
          pointType: toPointType(r),
          media: isVoice ? "audio" : "photo",
          photoCount: isVoice ? undefined : imageCount,
          // 長さはDBに保持していないため表示しない（ダミーの「--:--」を出さない）
          audioDuration: undefined,
          pointId: r.point_id ?? undefined,
          fieldId: r.field_id ?? undefined,
        } satisfies RecordItem;
      }),
    };
  } catch (err) {
    console.warn("[records] load error", err);
    return authed ? ERROR : ANON;
  }
}
