import { getSupabase } from "../supabase/client";
import { ensureGroupId } from "./farm";
import type { RecordDraft } from "../../features/records/recordDraft";

export type SaveRecordResult =
  | { status: "saved"; id: string }
  | { status: "demo" }
  | { status: "error"; step: "group" | "insert" | "upload" | "media" };

/** 撮影画面で選んだポイント種別から記録の分類を決める */
const POINT_TYPE_TO_RECORD_TYPE: Record<string, "water" | "work" | "issue"> = {
  inlet: "water",
  outlet: "water",
  weed: "work",
  caution: "issue",
};

function buildTitle(draft: RecordDraft): string {
  const memo = draft.memo.trim();
  if (memo) {
    const firstLine = memo.split("\n")[0];
    return firstLine.length > 30 ? `${firstLine.slice(0, 30)}…` : firstLine;
  }
  if (draft.fieldName) return `${draft.fieldName}の記録`;
  return draft.kind === "audio" ? "音声メモ" : "写真の記録";
}

/**
 * 記録の下書きを保存する: records insert → Storageアップロード → record_media insert。
 * 途中で失敗した場合は作成済みの行/ファイルを取り消す（ロールバック失敗はwarnのみ）。
 * Storageパスは RLS の規約 groups/{group_id}/... に従う。
 */
export async function saveRecord(draft: RecordDraft): Promise<SaveRecordResult> {
  const sb = getSupabase();
  if (!sb) return { status: "demo" };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { status: "demo" };

    const groupId = await ensureGroupId();
    if (!groupId) return { status: "error", step: "group" };

    const recordType =
      draft.kind === "audio"
        ? "voice"
        : (draft.pointType && POINT_TYPE_TO_RECORD_TYPE[draft.pointType]) || "photo";

    const { data: rec, error: insertError } = await sb
      .from("records")
      .insert({
        group_id: groupId,
        field_id: draft.fieldId,
        record_type: recordType,
        title: buildTitle(draft),
        note: draft.memo.trim() || null,
        // 選んだポイント種別そのもの（inlet/outlet/weed/caution）。record_typeは分類が粗く
        // 出水口と入水口を区別できないため、専用列ができるまでai_categoryに保持する
        ai_category: draft.pointType ?? null,
        latitude: draft.location?.lat ?? null,
        longitude: draft.location?.lng ?? null,
        location_source: draft.location ? "gps" : "unknown",
        recorded_by: user.id,
        recorded_at: draft.recordedAt,
      })
      .select("id")
      .single();
    if (insertError || !rec) {
      console.warn("[record] insert failed", insertError);
      return { status: "error", step: "insert" };
    }
    const recordId = rec.id as string;

    if (draft.file) {
      const bucket = draft.kind === "audio" ? "audio" : "images";
      // 音声はMediaRecorderの実際の形式に合わせる（Chrome=webm/opus、iOS Safari=mp4/AAC）
      const mime = draft.file.type || (draft.kind === "audio" ? "audio/webm" : "image/jpeg");
      const ext =
        draft.kind === "audio" ? (mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm") : "jpg";
      const path = `groups/${groupId}/records/${recordId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await sb.storage.from(bucket).upload(path, draft.file, {
        contentType: mime,
      });
      if (uploadError) {
        console.warn("[record] upload failed", uploadError);
        const { error } = await sb.from("records").delete().eq("id", recordId);
        if (error) console.warn("[record] rollback (records) failed", error);
        return { status: "error", step: "upload" };
      }

      const { error: mediaError } = await sb.from("record_media").insert({
        record_id: recordId,
        media_type: draft.kind === "audio" ? "audio" : "image",
        storage_bucket: bucket,
        storage_path: path,
        latitude: draft.location?.lat ?? null,
        longitude: draft.location?.lng ?? null,
        captured_at: draft.recordedAt,
      });
      if (mediaError) {
        console.warn("[record] media insert failed", mediaError);
        const { error: removeError } = await sb.storage.from(bucket).remove([path]);
        if (removeError) console.warn("[record] rollback (storage) failed", removeError);
        const { error: deleteError } = await sb.from("records").delete().eq("id", recordId);
        if (deleteError) console.warn("[record] rollback (records) failed", deleteError);
        return { status: "error", step: "media" };
      }
    }

    return { status: "saved", id: recordId };
  } catch (err) {
    console.warn("[record] save error", err);
    return { status: "error", step: "insert" };
  }
}
