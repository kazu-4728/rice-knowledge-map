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
  field_points: { name: string; point_type: string } | null;
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
  if (r.field_points?.point_type && (POINT_TYPES as readonly string[]).includes(r.field_points.point_type)) {
    return r.field_points.point_type as FieldPointType;
  }
  if (r.ai_category && (POINT_TYPES as readonly string[]).includes(r.ai_category)) {
    return r.ai_category as FieldPointType;
  }
  return r.record_type === "issue" ? "caution" : "inlet";
}

/** 異常系のポイント種別。record_type だけだと旧データ（拡張前は levee_damage/poor_drainage が
 * record_type='photo' で保存され category='作業' になる）を取りこぼすため、種別で判定する */
export const ISSUE_POINT_TYPES: readonly FieldPointType[] = ["caution", "levee_damage", "poor_drainage"];

/**
 * 「未対応」= 未解決の異常記録。records.status の既定値は 'open' のため、
 * 通常の写真/水管理/作業/音声記録も open になる。異常系のポイント種別のものだけを
 * 対象にしないと、全記録が「未対応」と誤判定される。pointType は ai_category 由来で
 * 旧データの異常記録（record_type='photo'）も正しく拾える。
 */
export function isUnresolvedIssue(r: RecordItem): boolean {
  return ISSUE_POINT_TYPES.includes(r.pointType) && (r.status === "open" || r.status === "needs_check");
}

export type OpenIssueRecord = {
  fieldId: string | null;
  pointId: string | null;
  isIssue: boolean;
};

export type OpenIssueRecords = {
  /** 田んぼ/ピン単位の内訳集計用（PostgRESTの行数上限がかかる場合がある） */
  records: OpenIssueRecord[];
  /** バナー等の件数表示用の正確な総数（COUNTベースのため上限の影響を受けない） */
  count: number;
};

/**
 * 未対応（open/needs_check）の異常系レコードを取得する。
 * ピンのステータス変更を伴わない「記録のみ」の異常も拾うための共通クエリ
 * （MapSummarySheet と TodayStory の集計で使用）。未ログイン・未設定時は空配列。
 * count は同じクエリに { count: "exact" } を付けて取得するため、
 * records（行データ）がPostgRESTの上限で欠けても件数表示は正確なまま。
 */
export async function loadOpenIssueRecords(): Promise<OpenIssueRecords> {
  const sb = getSupabase();
  if (!sb) return { records: [], count: 0 };
  const { data: members } = await sb.from("farm_group_members").select("group_id").limit(1);
  if (!members || members.length === 0) return { records: [], count: 0 };
  const { data, count } = await sb
    .from("records")
    .select("field_id, point_id, record_type", { count: "exact" })
    .in("status", ["open", "needs_check"])
    .or("record_type.eq.issue,ai_category.in.(caution,levee_damage,poor_drainage)");
  const records = (data ?? []).map((r) => ({
    fieldId: (r.field_id as string | null) ?? null,
    pointId: (r.point_id as string | null) ?? null,
    isIssue: r.record_type === "issue",
  }));
  return { records, count: count ?? records.length };
}

/**
 * ピン状態（issue/needs_check）で既に把握できている異常記録を除き、
 * 「記録のみ」の異常を返す。ピンと記録の両方を合算する集計で、
 * ピンに紐付いた異常記録を二重に数えないための共通ヘルパー。
 */
export function excludePointBackedIssues<T extends { pointId: string | null }>(
  issueRecords: T[],
  points: { id: string; status: string }[]
): T[] {
  const flagged = new Set(
    points.filter((p) => p.status === "issue" || p.status === "needs_check").map((p) => p.id)
  );
  return issueRecords.filter((r) => !r.pointId || !flagged.has(r.pointId));
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
  "id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, recorded_by, recorded_at, farm_fields(name), field_points(name, point_type), record_media(media_type, storage_bucket, storage_path)";

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
          pointName: r.field_points?.name ?? undefined,
          fieldId: r.field_id ?? undefined,
        } satisfies RecordItem;
      }),
    };
  } catch (err) {
    console.warn("[records] load error", err);
    return authed ? ERROR : ANON;
  }
}
