import type { FieldPointType, RecordDetail, RecordComment } from "../../types";
import { getSupabase } from "../supabase/client";
import { sampleRecordDetail } from "../../data/dummy";
import { ISSUE_POINT_TYPES } from "./records";

type MediaRow = {
  id: string;
  media_type: "image" | "audio";
  storage_bucket: string;
  storage_path: string;
  created_at: string;
};

type CommentRow = {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

type DetailRow = {
  id: string;
  group_id: string;
  field_id: string | null;
  point_id: string | null;
  record_type: string;
  status: string;
  title: string;
  note: string | null;
  ai_summary: string | null;
  ai_category: string | null;
  next_action: string | null;
  recorded_by: string;
  recorded_at: string;
  latitude: string | number | null;
  longitude: string | number | null;
  farm_fields: { name: string } | null;
  record_media: MediaRow[];
  record_comments: CommentRow[];
  profiles: { display_name: string } | null;
};

export type RecordDetailData =
  | { mode: "live"; record: RecordDetail; mediaUrls: MediaUrls; canDelete: boolean }
  | { mode: "demo"; record: RecordDetail; mediaUrls: MediaUrls; canDelete: boolean }
  | { mode: "notfound" }
  | { mode: "error"; message: string }
  | { mode: "anon" };

export type MediaUrls = {
  /** 写真の署名URL一覧（created_at昇順） */
  photos: string[];
  /** 音声の署名URL（最初の1件）*/
  audio: string | null;
};

const DEMO_MEDIA: MediaUrls = { photos: [], audio: null };

const POINT_TYPE_LABELS: Record<string, string> = {
  inlet: "入水口",
  outlet: "出水口",
  canal: "水路",
  weed: "雑草",
  caution: "異常",
  levee_damage: "畦崩れ",
  poor_drainage: "水抜け不良",
  other: "その他",
};

const VALID_POINT_TYPES: ReadonlySet<string> = new Set<FieldPointType>([
  "inlet", "outlet", "canal", "caution", "weed", "levee_damage", "poor_drainage", "other",
]);

const STATUS_LABELS: Record<string, string> = {
  open: "未対応",
  needs_check: "要確認",
  resolved: "解決済み",
  monitoring: "経過観察",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${youbi}）${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// row.latitude/longitude が null のとき Number(null) は 0 になり Number.isFinite(0) も true になるため、
// null チェックを Number() 変換より先に行う（0が緯度経度として誤って表示されるのを防ぐ）
function toNullableNumber(v: string | number | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function loadRecordDetail(id: string): Promise<RecordDetailData> {
  const sb = getSupabase();
  if (!sb) return { mode: "demo", record: sampleRecordDetail, mediaUrls: DEMO_MEDIA, canDelete: false };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { mode: "anon" };

  const userId = sessionData.session.user.id;

  const { data, error } = await sb
    .from("records")
    .select(
      `id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, next_action, recorded_by, recorded_at, latitude, longitude,
       profiles(display_name),
       farm_fields(name),
       record_media(id, media_type, storage_bucket, storage_path, created_at),
       record_comments(id, user_id, comment, created_at, profiles(display_name))`
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { mode: "notfound" };
    console.warn("[recordDetail] fetch failed", error);
    return { mode: "error", message: error.message };
  }

  const row = data as unknown as DetailRow;

  // created_at昇順にソートして順序を確定する（record_mediaがnullの場合は空配列にフォールバック）
  const sortedMedia = [...(row.record_media ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const imagePaths = sortedMedia
    .filter((m) => m.media_type === "image" && m.storage_bucket === "images")
    .map((m) => m.storage_path);
  const audioMedia = sortedMedia.find((m) => m.media_type === "audio" && m.storage_bucket === "audio");

  const photos: string[] = [];
  if (imagePaths.length > 0) {
    const { data: signed, error: signError } = await sb.storage.from("images").createSignedUrls(imagePaths, 3600);
    if (signError) {
      console.warn("[recordDetail] image sign urls failed", signError);
    } else {
      signed?.forEach((s) => {
        if (s.signedUrl && !s.error) photos.push(s.signedUrl);
      });
    }
  }

  let audio: string | null = null;
  if (audioMedia) {
    const { data: signed, error: signError } = await sb.storage.from("audio").createSignedUrl(audioMedia.storage_path, 3600);
    if (signError) {
      console.warn("[recordDetail] audio sign url failed", signError);
    } else if (signed?.signedUrl) {
      audio = signed.signedUrl;
    }
  }

  const comments: RecordComment[] = [...(row.record_comments ?? [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((c) => ({
      id: c.id,
      author: c.profiles?.display_name || "メンバー",
      // コメント投稿者が記録者本人かどうか（ログインユーザー本人かどうかではない）
      isRecorder: c.user_id === row.recorded_by,
      isMine: c.user_id === userId,
      text: c.comment,
      timestamp: formatCommentTime(c.created_at),
    }));

  const displayName = row.profiles?.display_name || null;
  const isSelf = row.recorded_by === userId;
  const recorderName = displayName
    ? isSelf ? `${displayName}（あなた）` : displayName
    : isSelf ? "あなた" : "メンバー";

  const pointTypeLabel = row.ai_category ? (POINT_TYPE_LABELS[row.ai_category] ?? "") : "";

  const VALID_STATUSES: RecordDetail["status"][] = ["open", "needs_check", "resolved", "monitoring"];
  const VALID_RECORD_TYPES: RecordDetail["recordType"][] = ["photo", "voice", "water", "work", "issue", "check", "other"];
  const safeStatus = (VALID_STATUSES as string[]).includes(row.status)
    ? (row.status as RecordDetail["status"])
    : "open";
  const safeRecordType = (VALID_RECORD_TYPES as string[]).includes(row.record_type)
    ? (row.record_type as RecordDetail["recordType"])
    : "other";
  const safePointType: FieldPointType | null =
    row.ai_category && VALID_POINT_TYPES.has(row.ai_category)
      ? (row.ai_category as FieldPointType)
      : null;

  // records.status は record_type を問わず既定値 'open' のため、異常系（issue/旧データのpointType）
  // 以外の open は「未対応」ではなく「通常」として表示する
  const isIssueRecord = row.record_type === "issue" || (safePointType !== null && ISSUE_POINT_TYPES.includes(safePointType));
  const statusLabel = row.status === "open" && !isIssueRecord ? "通常" : (STATUS_LABELS[row.status] ?? row.status);

  const record: RecordDetail = {
    id: row.id,
    fieldId: row.field_id,
    fieldName: row.farm_fields?.name ?? "田んぼ未選択",
    pointId: row.point_id,
    pointType: safePointType,
    pointTypeLabel,
    statusLabel,
    status: safeStatus,
    title: row.title || "（無題の記録）",
    address: "",
    recorder: recorderName,
    recordedAt: formatDateTime(row.recorded_at),
    summary: row.ai_summary || row.note || "",
    note: row.note || "",
    nextAction: row.next_action || "",
    recordType: safeRecordType,
    comments,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
  };

  // 削除権限: 記録者本人 OR グループのowner（DB側のRLSは owner/editor 全員に許可しているが、
  // 家族間の誤削除を防ぐためUI上は本人 OR owner に限定する）
  let canDelete = isSelf;
  if (!canDelete) {
    const { data: member } = await sb
      .from("farm_group_members")
      .select("role")
      .eq("group_id", row.group_id)
      .eq("user_id", userId)
      .maybeSingle();
    canDelete = member?.role === "owner";
  }

  return { mode: "live", record, mediaUrls: { photos, audio }, canDelete };
}

export async function addComment(recordId: string, text: string): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase未設定" };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { error: "ログインが必要です" };

  const { error } = await sb.from("record_comments").insert({
    record_id: recordId,
    user_id: sessionData.session.user.id,
    comment: text,
  });

  return { error: error?.message ?? null };
}

export async function resolveRecord(recordId: string): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase未設定" };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { error: "ログインが必要です" };

  const userId = sessionData.session.user.id;

  // 現在のステータスを確認
  const { data: current, error: fetchError } = await sb
    .from("records")
    .select("status")
    .eq("id", recordId)
    .single();
  if (fetchError || !current) return { error: fetchError?.message ?? "記録が見つかりません" };

  // すでにresolvedなら二重更新・二重イベントを防ぐ
  if (current.status === "resolved") return { error: null };

  // select()で返り値の配列件数を見てRLS拒否（0件更新）を検知する
  const { data: updated, error: updateError } = await sb
    .from("records")
    .update({ status: "resolved" })
    .eq("id", recordId)
    .select("id");

  if (updateError) return { error: updateError.message };
  if (!updated || updated.length === 0) return { error: "更新できませんでした。権限を確認してください" };

  // ステータス変更イベントを記録
  const { error: eventError } = await sb.from("record_status_events").insert({
    record_id: recordId,
    from_status: current.status,
    to_status: "resolved",
    changed_by: userId,
  });

  if (eventError) {
    console.warn("[resolveRecord] event insert failed", eventError);
    return { error: `ステータスは更新しましたが、変更ログの記録に失敗しました: ${eventError.message}` };
  }

  return { error: null };
}

export type DeleteRecordResult =
  | { status: "deleted" }
  | { status: "denied" }
  | { status: "demo" }
  | { status: "anon" }
  | { status: "error"; message: string };

/**
 * 記録を削除する。
 * 順序: ①record_mediaのstorage pathを取得 → ②records行をdelete（comments/media/status_eventsはcascadeで連動削除）
 *      → ③StorageからファイルをremoveしてゴミファイルをCleanup。
 * ②が失敗したら何も消さない。③が失敗してもDB側はもう消えているので孤児ファイルが残るだけで実害は軽い（warnのみ）。
 * RLS拒否は updateと同様に `.select('id')` で0件成功を検知する。
 */
export async function deleteRecord(recordId: string): Promise<DeleteRecordResult> {
  const sb = getSupabase();
  if (!sb) return { status: "demo" };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { status: "anon" };

  // 削除前にメディアのstorage pathを取得（cascadeで record_media 行は消えるが、Storage実体は残るため）
  const { data: mediaRows } = await sb
    .from("record_media")
    .select("storage_bucket, storage_path")
    .eq("record_id", recordId);

  const { data: deleted, error: deleteError } = await sb
    .from("records")
    .delete()
    .eq("id", recordId)
    .select("id");

  if (deleteError) return { status: "error", message: deleteError.message };
  if (!deleted || deleted.length === 0) return { status: "denied" };

  // バケットごとにまとめてremove（失敗してもDBはすでに削除済みのためwarnのみ）
  const byBucket = new Map<string, string[]>();
  for (const m of mediaRows ?? []) {
    if (!m.storage_bucket || !m.storage_path) continue;
    const list = byBucket.get(m.storage_bucket) ?? [];
    list.push(m.storage_path);
    byBucket.set(m.storage_bucket, list);
  }
  for (const [bucket, paths] of byBucket) {
    if (paths.length === 0) continue;
    const { error: removeError } = await sb.storage.from(bucket).remove(paths);
    if (removeError) console.warn("[deleteRecord] storage remove failed", bucket, removeError);
  }

  return { status: "deleted" };
}
