import type { RecordItem } from "../../types";
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
  latitude: Numeric | null;
  longitude: Numeric | null;
};

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
export async function loadRecords(): Promise<RecordsData> {
  const sb = getSupabase();
  if (!sb) return DEMO;

  let authed = false;
  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return ANON;
    authed = true;

    const { data, error } = await sb
      .from("records")
      .select(
        "id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, recorded_by, recorded_at, farm_fields(name), record_media(media_type, storage_bucket, storage_path)"
      )
      .order("recorded_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("[records] fetch failed", error);
      return ERROR;
    }

    const rows = (data ?? []) as unknown as RecordListRow[];

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
          title: r.title || "（無題の記録）",
          fieldName: r.farm_fields?.name ?? "田んぼ未選択",
          fieldArea: "",
          category: TYPE_TO_CATEGORY[r.record_type] ?? "作業",
          pointType: r.record_type === "issue" ? "caution" : "inlet",
          media: isVoice ? "audio" : "photo",
          photoCount: isVoice ? undefined : imageCount,
          audioDuration: isVoice ? "--:--" : undefined,
        } satisfies RecordItem;
      }),
    };
  } catch (err) {
    console.warn("[records] load error", err);
    return authed ? ERROR : ANON;
  }
}
