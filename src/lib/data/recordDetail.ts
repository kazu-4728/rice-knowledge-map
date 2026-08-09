import type {
  FieldPointType,
  RecordComment,
  RecordDetail,
  RecordPhoto,
  RecordStatusEvent,
} from "../../types";
import { getSupabase } from "../supabase/client";
import { sampleRecordDetail } from "../../data/dummy";
import { ISSUE_POINT_TYPES } from "./records";
import { TYPE_LABELS, isPointType } from "../../features/map/mapPins";

type MediaRow = {
  id: string;
  media_type: "image" | "audio";
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  latitude: string | number | null;
  longitude: string | number | null;
  captured_at: string | null;
};

type StatusEventRow = {
  id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
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
  record_status_events: StatusEventRow[];
  profiles: { display_name: string } | null;
};

export type RecordDetailData =
  | { mode: "live"; record: RecordDetail; mediaUrls: MediaUrls; canDelete: boolean; canChangeStatus: boolean }
  | { mode: "demo"; record: RecordDetail; mediaUrls: MediaUrls; canDelete: boolean; canChangeStatus: boolean }
  | { mode: "notfound" }
  | { mode: "error"; message: string }
  | { mode: "anon" };

export type MediaUrls = {
  /** 写真（created_at昇順。署名URLと撮影メタ情報） */
  photos: RecordPhoto[];
  /** 音声の署名URL（最初の1件）*/
  audio: string | null;
};

const DEMO_MEDIA: MediaUrls = { photos: [], audio: null };

/**
 * 画像の署名URLの有効期限（秒）。
 * 画面を開いたまま長時間放置しても画像が切れないよう24時間にしている
 * （署名URL自体を知っていれば認証なしでアクセスできるため、URLが漏れた場合の
 * 露出期間も24時間になる。URLを取得できるのはRLSを通ったグループメンバーだけで、
 * 外部への共有導線を作る場合はこの前提が崩れるため再検討する。tasks/TASKS.md PR1）。
 * 延長を承認したのは画像のみのため、音声は従来どおり1時間のままにする
 * （AUDIO_SIGNED_URL_TTL_SEC）。
 */
const SIGNED_URL_TTL_SEC = 24 * 60 * 60;
const AUDIO_SIGNED_URL_TTL_SEC = 60 * 60;

const STATUS_LABELS: Record<string, string> = {
  open: "未対応",
  needs_check: "要確認",
  resolved: "解決済み",
  monitoring: "経過観察",
};

/**
 * 状態の表示名。records.status の既定値は record_type を問わず 'open' のため、
 * 異常系でない記録の 'open' は「未対応」ではなく「通常」と表示する。
 * 逆に異常記録では「通常」と表示しない（ホーム・マップの未対応集計 isUnresolvedIssue() が
 * open/needs_check を未対応として数えるため、「通常」表示だと警告と食い違う。制約1）。
 */
export function statusLabelFor(status: string, isIssue: boolean): string {
  if (status === "open" && !isIssue) return "通常";
  return STATUS_LABELS[status] ?? status;
}

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
  // デモには権限モデルが無いため、従来どおり操作ボタンは常に表示する
  // （押すと changeRecordStatus() が「デモモードでは状態を変更できません」を返す）
  if (!sb) return { mode: "demo", record: sampleRecordDetail, mediaUrls: DEMO_MEDIA, canDelete: false, canChangeStatus: true };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { mode: "anon" };

  const userId = sessionData.session.user.id;

  const { data, error } = await sb
    .from("records")
    .select(
      `id, group_id, field_id, point_id, record_type, status, title, note, ai_summary, ai_category, next_action, recorded_by, recorded_at, latitude, longitude,
       profiles(display_name),
       farm_fields(name),
       record_media(id, media_type, storage_bucket, storage_path, created_at, latitude, longitude, captured_at),
       record_comments(id, user_id, comment, created_at, profiles(display_name)),
       record_status_events(id, from_status, to_status, changed_by, comment, created_at, profiles(display_name))`
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

  const imageMedia = sortedMedia.filter((m) => m.media_type === "image" && m.storage_bucket === "images");
  const audioMedia = sortedMedia.find((m) => m.media_type === "audio" && m.storage_bucket === "audio");

  const photos: RecordPhoto[] = [];
  if (imageMedia.length > 0) {
    const { data: signed, error: signError } = await sb.storage
      .from("images")
      .createSignedUrls(imageMedia.map((m) => m.storage_path), SIGNED_URL_TTL_SEC);
    if (signError) {
      console.warn("[recordDetail] image sign urls failed", signError);
    } else {
      // createSignedUrls は入力パスと同じ並びで返るため、添字でメディア行と対応付ける
      signed?.forEach((s, i) => {
        const media = imageMedia[i];
        if (!media || !s.signedUrl || s.error) return;
        photos.push({
          id: media.id,
          url: s.signedUrl,
          storagePath: media.storage_path,
          capturedAtLabel: media.captured_at ? formatDateTime(media.captured_at) : null,
          latitude: toNullableNumber(media.latitude),
          longitude: toNullableNumber(media.longitude),
        });
      });
    }
  }

  let audio: string | null = null;
  if (audioMedia) {
    const { data: signed, error: signError } = await sb.storage
      .from("audio")
      .createSignedUrl(audioMedia.storage_path, AUDIO_SIGNED_URL_TTL_SEC);
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

  const VALID_STATUSES: RecordDetail["status"][] = ["open", "needs_check", "resolved", "monitoring"];
  const VALID_RECORD_TYPES: RecordDetail["recordType"][] = ["photo", "voice", "water", "work", "issue", "check", "other"];
  const safeStatus = (VALID_STATUSES as string[]).includes(row.status)
    ? (row.status as RecordDetail["status"])
    : "open";
  const safeRecordType = (VALID_RECORD_TYPES as string[]).includes(row.record_type)
    ? (row.record_type as RecordDetail["recordType"])
    : "other";
  const safePointType: FieldPointType | null = isPointType(row.ai_category) ? row.ai_category : null;
  const pointTypeLabel = safePointType ? TYPE_LABELS[safePointType] : "";

  // records.status は record_type を問わず既定値 'open' のため、異常系（issue/旧データのpointType）
  // 以外の open は「未対応」ではなく「通常」として表示する
  const isIssueRecord = row.record_type === "issue" || (safePointType !== null && ISSUE_POINT_TYPES.includes(safePointType));
  const statusLabel = statusLabelFor(row.status, isIssueRecord);

  // 状態変更の履歴（新しい順）。表示名は同じ isIssue 基準で揃える
  const statusEvents: RecordStatusEvent[] = [...(row.record_status_events ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((e) => ({
      id: e.id,
      fromLabel: statusLabelFor(e.from_status, isIssueRecord),
      toLabel: statusLabelFor(e.to_status, isIssueRecord),
      by: e.changed_by === userId ? "あなた" : e.profiles?.display_name || "メンバー",
      at: formatCommentTime(e.created_at),
      comment: e.comment,
    }));

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
    statusEvents,
    isIssue: isIssueRecord,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
  };

  // 自分のグループ内ロールを取得する（削除・状態変更の両方の可否判定に使う）
  const { data: member } = await sb
    .from("farm_group_members")
    .select("role")
    .eq("group_id", row.group_id)
    .eq("user_id", userId)
    .maybeSingle();
  const myRole = member?.role as "owner" | "editor" | "viewer" | undefined;

  // 削除権限: 記録者本人 OR グループのowner（DB側のRLSは owner/editor 全員に許可しているが、
  // 家族間の誤削除を防ぐためUI上は本人 OR owner に限定する）
  const canDelete = isSelf || myRole === "owner";

  // 状態変更権限: set_record_status RPC が owner/editor のみ許可するため、
  // viewer には押しても必ず拒否される操作ボタンを見せない
  const canChangeStatus = myRole === "owner" || myRole === "editor";

  return { mode: "live", record, mediaUrls: { photos, audio }, canDelete, canChangeStatus };
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

export type RecordStatus = RecordDetail["status"];

/**
 * 記録の状態を任意の値へ変更する（履歴 record_status_events も同時に残す）。
 *
 * 状態更新と履歴追加は set_record_status RPC の中で1トランザクションにまとめている
 * （supabase/migrations/0009_set_record_status.sql）。以前のように2リクエストに分けると、
 * 履歴のINSERTだけ失敗したときに「状態は進んだのに履歴が無い」記録が生まれ、
 * 履歴表示にそのまま矛盾が現れるため（tasks/TASKS.md PR1 制約2）。
 */
export async function changeRecordStatus(
  recordId: string,
  toStatus: RecordStatus
): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "デモモードでは状態を変更できません" };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { error: "ログインが必要です" };

  const { error } = await sb.rpc("set_record_status", {
    p_record_id: recordId,
    p_to_status: toStatus,
  });

  if (error) {
    console.warn("[recordDetail] set_record_status failed", error);
    // RPC側が errcode を付けて raise しているため、メッセージ文言ではなく SQLSTATE で分岐する
    // （文言はPostgREST・Supabase側の変更やロケールで変わりうる）
    switch (error.code) {
      case "42501":
        return { error: "状態を変更できませんでした（権限がありません）" };
      case "P0002":
        return { error: "記録が見つかりませんでした" };
      case "28000":
        return { error: "ログインが必要です" };
      default:
        return { error: "状態を変更できませんでした。通信環境を確認してもう一度お試しください" };
    }
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
