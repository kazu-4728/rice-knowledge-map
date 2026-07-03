import { getSupabase } from "../supabase/client";
import { resolveGroupIdForField } from "./farm";

/**
 * 統合トークルーム（/talk）のデータ層。
 * 全田んぼの「記録」と「コメント」を1本の時系列タイムラインに統合する。
 * DBスキーマ変更なし: records / record_comments / record_media の既存テーブルのみを使う。
 */

export type TalkMessage = {
  /** kind+idの一意キー */
  key: string;
  kind: "record" | "comment";
  recordId: string;
  author: string;
  isMine: boolean;
  /** 並び替え・ページング用のISO日時 */
  atISO: string;
  /** "6:12" */
  timeLabel: string;
  /** 日付セパレータ用 "7月2日(木)" */
  dateLabel: string;
  fieldId: string | null;
  fieldName: string | null;
  // kind === "record"
  title?: string;
  note?: string | null;
  photoUrl?: string;
  photoCount?: number;
  audioUrl?: string;
  status?: "open" | "needs_check" | "resolved" | "monitoring";
  isIssue?: boolean;
  /** records.record_type（削除可否の判定に使用。"other"=ひとこと） */
  recordType?: string;
  /** メディア行が存在するか（署名URLの成否に依存しない削除ガード用） */
  hasMedia?: boolean;
  /** この記録に付いたコメント数（スレッドの存在を示す） */
  commentCount?: number;
  // kind === "comment"
  text?: string;
  /** 返信先の記録タイトル（引用表示用） */
  recordTitle?: string;
};

export type TalkData =
  | { mode: "live" | "demo"; messages: TalkMessage[]; hasMore: boolean }
  | { mode: "anon" }
  | { mode: "error" };

const PAGE_SIZE = 30;

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日(${youbi})`;
}

/** デモ環境（Supabase未設定）用のサンプルトーク */
function demoMessages(): TalkMessage[] {
  const now = Date.now();
  const at = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
  const mk = (m: Omit<TalkMessage, "timeLabel" | "dateLabel">): TalkMessage => ({
    ...m,
    timeLabel: timeLabel(m.atISO),
    dateLabel: dateLabel(m.atISO),
  });
  return [
    mk({ key: "r-demo1", kind: "record", recordId: "record-a1", author: "父", isMine: false, atISO: at(60 * 26), fieldId: "field-a", fieldName: "A田", title: "取水口の確認", note: "水量は問題なし", photoCount: 1, status: "resolved", commentCount: 1, recordType: "water", hasMedia: true }),
    mk({ key: "c-demo1", kind: "comment", recordId: "record-a1", author: "あなた", isMine: true, atISO: at(60 * 25), fieldId: "field-a", fieldName: "A田", text: "確認ありがとう👍", recordTitle: "取水口の確認" }),
    mk({ key: "r-demo2", kind: "record", recordId: "record-b1", author: "母", isMine: false, atISO: at(60 * 5), fieldId: "field-b", fieldName: "B田", title: "畦に崩れあり", note: "南側の畦。早めに見てほしい", photoCount: 2, status: "open", isIssue: true, commentCount: 1, recordType: "issue", hasMedia: true }),
    mk({ key: "c-demo2", kind: "comment", recordId: "record-b1", author: "あなた", isMine: true, atISO: at(60 * 4), fieldId: "field-b", fieldName: "B田", text: "了解。夕方見てくる", recordTitle: "畦に崩れあり" }),
    mk({ key: "r-demo3", kind: "record", recordId: "record-c1", author: "あなた", isMine: true, atISO: at(30), fieldId: "field-c", fieldName: "C田", title: "ひとことメモ", status: "monitoring", recordType: "other", hasMedia: false }),
  ];
}

type RecordRow = {
  id: string;
  field_id: string | null;
  record_type: string;
  status: string;
  title: string | null;
  note: string | null;
  recorded_by: string;
  recorded_at: string;
  profiles: { display_name: string | null } | null;
  farm_fields: { name: string | null } | null;
  record_media: { media_type: string; storage_bucket: string; storage_path: string }[] | null;
  record_comments: { count: number }[] | null;
};

type CommentRow = {
  id: string;
  record_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
  records: { field_id: string | null; title: string | null; farm_fields: { name: string | null } | null } | null;
};

const VALID_STATUSES = new Set(["open", "needs_check", "resolved", "monitoring"]);

/**
 * トークタイムラインを新しい順に1ページ取得して昇順で返す。
 * before を渡すとそれより古いメッセージを遡る（「以前のやり取り」ボタン用）。
 */
export async function loadTalkTimeline(opts?: {
  fieldId?: string;
  before?: string;
}): Promise<TalkData> {
  const sb = getSupabase();
  if (!sb) {
    const all = demoMessages();
    return {
      mode: "demo",
      messages: opts?.fieldId ? all.filter((m) => m.fieldId === opts.fieldId) : all,
      hasMore: false,
    };
  }

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { mode: "anon" };
    const userId = sessionData.session.user.id;

    // 記録（メッセージ本体）
    let recQ = sb
      .from("records")
      .select(
        "id, field_id, record_type, status, title, note, recorded_by, recorded_at, profiles(display_name), farm_fields(name), record_media(media_type, storage_bucket, storage_path), record_comments(count)"
      )
      .order("recorded_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (opts?.fieldId) recQ = recQ.eq("field_id", opts.fieldId);
    if (opts?.before) recQ = recQ.lt("recorded_at", opts.before);
    const { data: recData, error: recError } = await recQ;
    if (recError) {
      console.warn("[talk] records fetch failed", recError);
      return { mode: "error" };
    }
    const records = (recData ?? []) as unknown as RecordRow[];

    // コメント（返信バブル）。取得に失敗しても記録だけで表示は継続する
    let comments: CommentRow[] = [];
    {
      let comQ = sb
        .from("record_comments")
        .select(
          "id, record_id, user_id, comment, created_at, profiles(display_name), records!inner(field_id, title, farm_fields(name))"
        )
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (opts?.fieldId) comQ = comQ.eq("records.field_id", opts.fieldId);
      if (opts?.before) comQ = comQ.lt("created_at", opts.before);
      const { data: comData, error: comError } = await comQ;
      if (comError) {
        console.warn("[talk] comments fetch failed", comError);
      } else {
        comments = (comData ?? []) as unknown as CommentRow[];
      }
    }

    // 署名URL: 各記録の先頭写真と音声を一括発行
    const imagePaths: { recordId: string; path: string }[] = [];
    const audioPaths: { recordId: string; path: string }[] = [];
    for (const r of records) {
      const image = r.record_media?.find((m) => m.media_type === "image" && m.storage_bucket === "images");
      if (image) imagePaths.push({ recordId: r.id, path: image.storage_path });
      const audio = r.record_media?.find((m) => m.media_type === "audio" && m.storage_bucket === "audio");
      if (audio) audioPaths.push({ recordId: r.id, path: audio.storage_path });
    }
    const photoUrls = new Map<string, string>();
    if (imagePaths.length > 0) {
      const { data: signed, error: signError } = await sb.storage
        .from("images")
        .createSignedUrls(imagePaths.map((t) => t.path), 3600);
      if (signError) console.warn("[talk] image sign urls failed", signError);
      signed?.forEach((s, i) => {
        if (s.signedUrl && !s.error) photoUrls.set(imagePaths[i].recordId, s.signedUrl);
      });
    }
    const audioUrls = new Map<string, string>();
    if (audioPaths.length > 0) {
      const { data: signed, error: signError } = await sb.storage
        .from("audio")
        .createSignedUrls(audioPaths.map((t) => t.path), 3600);
      if (signError) console.warn("[talk] audio sign urls failed", signError);
      signed?.forEach((s, i) => {
        if (s.signedUrl && !s.error) audioUrls.set(audioPaths[i].recordId, s.signedUrl);
      });
    }

    const merged: TalkMessage[] = [
      ...records.map((r): TalkMessage => {
        const photoCount = r.record_media?.filter((m) => m.media_type === "image").length ?? 0;
        return {
          key: `r-${r.id}`,
          kind: "record",
          recordId: r.id,
          author: r.profiles?.display_name || "メンバー",
          isMine: r.recorded_by === userId,
          atISO: r.recorded_at,
          timeLabel: timeLabel(r.recorded_at),
          dateLabel: dateLabel(r.recorded_at),
          fieldId: r.field_id,
          fieldName: r.farm_fields?.name ?? null,
          title: r.title || "（無題の記録）",
          note: r.note,
          photoUrl: photoUrls.get(r.id),
          photoCount: photoCount || undefined,
          audioUrl: audioUrls.get(r.id),
          status: VALID_STATUSES.has(r.status) ? (r.status as TalkMessage["status"]) : undefined,
          isIssue: r.record_type === "issue",
          recordType: r.record_type,
          hasMedia: (r.record_media?.length ?? 0) > 0,
          commentCount: r.record_comments?.[0]?.count || undefined,
        };
      }),
      ...comments.map((c): TalkMessage => ({
        key: `c-${c.id}`,
        kind: "comment",
        recordId: c.record_id,
        author: c.profiles?.display_name || "メンバー",
        isMine: c.user_id === userId,
        atISO: c.created_at,
        timeLabel: timeLabel(c.created_at),
        dateLabel: dateLabel(c.created_at),
        fieldId: c.records?.field_id ?? null,
        fieldName: c.records?.farm_fields?.name ?? null,
        text: c.comment,
        recordTitle: c.records?.title || undefined,
      })),
    ].sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());

    // records/comments はそれぞれ独立に PAGE_SIZE 件で打ち切っているため、単純に
    // マージ後の上位 PAGE_SIZE 件を切り詰めるだけでは「密な方のソースの陰に隠れて、
    // 疎な方のソースの古いアイテムが安全に補完されない」ケースが起きる
    // （例: コメントが密に30件取れると、records側は全件取得済みでも一部が
    // 表示から漏れ、次ページの取得漏れにつながりうる）。
    // 各ソースの「打ち切り境界（そのソースがPAGE_SIZEに達し、まだ続きがある場合の
    // 最古取得日時）」のうち、より新しい方（＝取得が浅い方）を安全境界とし、
    // 安全境界より新しいアイテムだけを「両ソースとも漏れなく取得済み」として扱う
    const recordsBoundary = records.length === PAGE_SIZE ? records[records.length - 1].recorded_at : null;
    const commentsBoundary = comments.length === PAGE_SIZE ? comments[comments.length - 1].created_at : null;
    const boundaries = [recordsBoundary, commentsBoundary].filter((b): b is string => b !== null);
    const safeBoundaryTime =
      boundaries.length > 0 ? Math.max(...boundaries.map((b) => new Date(b).getTime())) : null;
    const safeMerged =
      safeBoundaryTime !== null
        ? merged.filter((m) => new Date(m.atISO).getTime() > safeBoundaryTime)
        : merged;

    const page = safeMerged.slice(0, PAGE_SIZE);
    const trimmedForDisplay = safeMerged.length > page.length;

    return {
      mode: "live",
      messages: page.reverse(),
      hasMore: trimmedForDisplay || recordsBoundary !== null || commentsBoundary !== null,
    };
  } catch (err) {
    console.warn("[talk] load error", err);
    return { mode: "error" };
  }
}

/**
 * 自分のコメントを削除する。RLSにより本人のコメントのみ削除できる
 * （record_comments_delete = user_id = auth.uid()）。
 */
export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "デモ環境では削除できません" };

  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return { error: "ログインが必要です" };

  const { data, error } = await sb
    .from("record_comments")
    .delete()
    .eq("id", commentId)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "削除できませんでした（本人のコメントのみ削除できます）" };
  return { error: null };
}

/**
 * テキストの「ひとこと記録」を送信する。
 * スキーマ変更なしで records に record_type='other' として保存する
 * （タイムライン上ではテキストメッセージとして表示される）。
 */
export async function sendTalkText(
  text: string,
  fieldId: string | null
): Promise<{ error: string | null }> {
  // データ層としても空メッセージを防御的に弾く（空のtitle/noteのrecordsを作らない）
  const trimmed = text.trim();
  if (!trimmed) return { error: "メッセージを入力してください" };

  const sb = getSupabase();
  if (!sb) return { error: "デモ環境では送信できません" };

  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { error: "ログインが必要です" };

  const groupId = await resolveGroupIdForField(fieldId);
  if (!groupId) return { error: "グループが見つかりません" };

  const firstLine = trimmed.split("\n")[0];
  const title = firstLine.length > 30 ? `${firstLine.slice(0, 30)}…` : firstLine;

  const { error } = await sb.from("records").insert({
    group_id: groupId,
    field_id: fieldId,
    record_type: "other",
    // 既定値'open'のままだと記録詳細で「未対応」表示になり、雑談メッセージが
    // 異常記録のように見えてしまう（デモデータのひとことメモも同じ扱い）
    status: "monitoring",
    title,
    note: trimmed,
    recorded_by: user.id,
    recorded_at: new Date().toISOString(),
    location_source: "unknown",
  });

  return { error: error?.message ?? null };
}
