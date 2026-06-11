import type { RecordItem } from "../../types";
import type { RecordRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { recentRecords } from "../../data/dummy";

export type RecordsData = {
  /** Supabaseから取得した実データか（falseはデモ用サンプル） */
  live: boolean;
  records: RecordItem[];
};

const DEMO: RecordsData = { live: false, records: recentRecords };

const TYPE_TO_CATEGORY: Record<RecordRow["record_type"], RecordItem["category"]> = {
  water: "水管理",
  work: "作業",
  issue: "異常",
  voice: "音声",
  photo: "作業",
  check: "水管理",
  other: "作業",
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
 * 記録一覧を読み込む。未設定・未ログイン・取得失敗・0件時はサンプルにフォールバックする。
 * （0件フォールバックは記録保存(T-043/T-044)実装までの暫定。実装後は空状態UIに置き換える）
 */
export async function loadRecords(): Promise<RecordsData> {
  const sb = getSupabase();
  if (!sb) return DEMO;

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return DEMO;

    const { data, error } = await sb
      .from("records")
      .select("id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, recorded_by, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(100);
    if (error || !data || data.length === 0) return DEMO;

    const rows = data as RecordRow[];
    return {
      live: true,
      records: rows.map((r) => {
        const { date, time } = formatDate(r.recorded_at);
        return {
          id: r.id,
          date,
          time,
          title: r.title || "（無題の記録）",
          fieldName: "圃場",
          fieldArea: "",
          category: TYPE_TO_CATEGORY[r.record_type] ?? "作業",
          pointType: r.record_type === "issue" ? "caution" : "inlet",
          media: r.record_type === "voice" ? "audio" : "photo",
          photoCount: r.record_type === "voice" ? undefined : 0,
          audioDuration: r.record_type === "voice" ? "--:--" : undefined,
        } satisfies RecordItem;
      }),
    };
  } catch {
    return DEMO;
  }
}
