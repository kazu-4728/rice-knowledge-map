import type { RecordDetail, RecordComment } from "../../types";
import { getSupabase } from "../supabase/client";
import { sampleRecordDetail } from "../../data/dummy";

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
  field_id: string | null;
  point_id: string | null;
  record_type: string;
  status: string;
  title: string;
  note: string | null;
  ai_summary: string | null;
  ai_category: string | null;
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
  | { mode: "live"; record: RecordDetail; mediaUrls: MediaUrls }
  | { mode: "demo"; record: RecordDetail; mediaUrls: MediaUrls }
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
  weed: "雑草",
  caution: "異常",
};

const STATUS_LABELS: Record<string, string> = {
  open: "未対応",
  needs_check: "要確認",
  resolved: "対応済み",
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

export async function loadRecordDetail(id: string): Promise<RecordDetailData> {
  const sb = getSupabase();
  if (!sb) return { mode: "demo", record: sampleRecordDetail, mediaUrls: DEMO_MEDIA };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { mode: "anon" };

  const userId = sessionData.session.user.id;

  const { data, error } = await sb
    .from("records")
    .select(
      `id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, recorded_by, recorded_at, latitude, longitude,
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
      text: c.comment,
      timestamp: formatCommentTime(c.created_at),
    }));

  const displayName = row.profiles?.display_name || null;
  const isSelf = row.recorded_by === userId;
  const recorderName = displayName
    ? isSelf ? `${displayName}（あなた）` : displayName
    : isSelf ? "あなた" : "メンバー";

  const pointTypeLabel = row.ai_category ? (POINT_TYPE_LABELS[row.ai_category] ?? "") : "";
  const statusLabel = STATUS_LABELS[row.status] ?? row.status;

  const VALID_STATUSES: RecordDetail["status"][] = ["open", "needs_check", "resolved", "monitoring"];
  const VALID_RECORD_TYPES: RecordDetail["recordType"][] = ["photo", "voice", "water", "work", "issue", "check", "other"];
  const safeStatus = (VALID_STATUSES as string[]).includes(row.status)
    ? (row.status as RecordDetail["status"])
    : "open";
  const safeRecordType = (VALID_RECORD_TYPES as string[]).includes(row.record_type)
    ? (row.record_type as RecordDetail["recordType"])
    : "other";

  const record: RecordDetail = {
    id: row.id,
    fieldName: row.farm_fields?.name ?? "田んぼ未選択",
    pointTypeLabel,
    statusLabel,
    status: safeStatus,
    title: row.title || "（無題の記録）",
    address: "",
    recorder: recorderName,
    recordedAt: formatDateTime(row.recorded_at),
    summary: row.ai_summary || row.note || "",
    note: row.note || "",
    recordType: safeRecordType,
    comments,
    latitude: (() => { const v = Number(row.latitude); return Number.isFinite(v) ? v : null; })(),
    longitude: (() => { const v = Number(row.longitude); return Number.isFinite(v) ? v : null; })(),
  };

  return { mode: "live", record, mediaUrls: { photos, audio } };
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
