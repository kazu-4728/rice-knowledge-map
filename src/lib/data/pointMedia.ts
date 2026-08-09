import { getSupabase } from "../supabase/client";
import { compressImage } from "../utils/imageCompress";
import { getSignedPhotoUrls } from "./farm";

/**
 * ピン（設備ポイント）の台帳写真（field_point_media）。
 * 入水口・機械の出入口などの「変わらない情報」をピン自体に持たせるための系統で、
 * 記録（records/record_media）のタイムラインには流れない。
 */
export type PointMediaItem = {
  id: string;
  pointId: string;
  storagePath: string;
  caption: string | null;
};

/** ピンの台帳写真を一括取得し、署名URL（storagePath→URL）も解決する */
export async function loadPointMedia(pointIds: string[]): Promise<{
  byPoint: Record<string, PointMediaItem[]>;
  urls: Record<string, string>;
}> {
  const empty = { byPoint: {}, urls: {} };
  if (pointIds.length === 0) return empty;
  const sb = getSupabase();
  if (!sb) return empty;

  try {
    const { data: sess } = await sb.auth.getSession();
    if (!sess.session) return empty;

    const { data, error } = await sb
      .from("field_point_media")
      .select("id, point_id, storage_path, caption")
      .in("point_id", pointIds)
      .order("display_order")
      .order("created_at");
    if (error || !data) {
      if (error) console.warn("[pointMedia] load failed", error);
      return empty;
    }

    const byPoint: Record<string, PointMediaItem[]> = {};
    const paths: string[] = [];
    for (const row of data as { id: string; point_id: string; storage_path: string; caption: string | null }[]) {
      (byPoint[row.point_id] ??= []).push({
        id: row.id,
        pointId: row.point_id,
        storagePath: row.storage_path,
        caption: row.caption,
      });
      paths.push(row.storage_path);
    }
    const urls = await getSignedPhotoUrls(paths);
    return { byPoint, urls };
  } catch (err) {
    console.warn("[pointMedia] load error", err);
    return empty;
  }
}

export type AddPointPhotoResult = "saved" | "demo" | "denied" | "error";

/** ピンに台帳写真を追加する（Storageアップロード+行追加） */
export async function addPointPhoto(pointId: string, file: File): Promise<AddPointPhotoResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sess } = await sb.auth.getSession();
    const user = sess.session?.user;
    if (!user) return "demo";

    // アップロード先パスの group_id はピン本体から解決する
    // （複数グループ所属時に ensureGroupId の「最初のグループ」とずれないため）
    const { data: point } = await sb.from("field_points").select("group_id").eq("id", pointId).maybeSingle();
    const groupId = point?.group_id as string | undefined;
    if (!groupId) return "error";

    const blob = await compressImage(file);
    const path = `groups/${groupId}/points/${pointId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await sb.storage
      .from("images")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (uploadError) {
      console.warn("[pointMedia] upload failed", uploadError);
      return "error";
    }

    const { error } = await sb.from("field_point_media").insert({
      point_id: pointId,
      media_type: "image",
      storage_bucket: "images",
      storage_path: path,
      created_by: user.id,
    });
    if (error) {
      console.warn("[pointMedia] insert failed", error);
      // 行が作れなかった孤児ファイルはベストエフォートで掃除する
      sb.storage.from("images").remove([path]).then(({ error: rmError }) => {
        if (rmError) console.warn("[pointMedia] orphan cleanup failed", rmError);
      });
      return error.code === "42501" ? "denied" : "error";
    }
    return "saved";
  } catch (err) {
    console.warn("[pointMedia] add error", err);
    return "error";
  }
}

/**
 * 記録の写真をピンの台帳に登録する（Storage上でコピーしてから field_point_media へ追加）。
 * record_media と同じパスを共有すると、記録側の削除（deleteRecord）で
 * Storage実体ごと消え台帳の写真も壊れるため、必ず新しいパスへコピーする。
 */
export async function registerRecordPhotoToPoint(
  sourcePath: string,
  pointId: string
): Promise<AddPointPhotoResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sess } = await sb.auth.getSession();
    const user = sess.session?.user;
    if (!user) return "demo";

    const { data: point } = await sb.from("field_points").select("group_id").eq("id", pointId).maybeSingle();
    const groupId = point?.group_id as string | undefined;
    if (!groupId) return "error";

    const newPath = `groups/${groupId}/points/${pointId}/${crypto.randomUUID()}.jpg`;
    const { error: copyError } = await sb.storage.from("images").copy(sourcePath, newPath);
    if (copyError) {
      console.warn("[pointMedia] copy failed", copyError);
      return "error";
    }

    const { error } = await sb.from("field_point_media").insert({
      point_id: pointId,
      media_type: "image",
      storage_bucket: "images",
      storage_path: newPath,
      created_by: user.id,
    });
    if (error) {
      console.warn("[pointMedia] insert failed (register)", error);
      // 行が作れなかった孤児コピーはベストエフォートで掃除する
      sb.storage.from("images").remove([newPath]).then(({ error: rmError }) => {
        if (rmError) console.warn("[pointMedia] orphan cleanup failed (register)", rmError);
      });
      return error.code === "42501" ? "denied" : "error";
    }
    return "saved";
  } catch (err) {
    console.warn("[pointMedia] register error", err);
    return "error";
  }
}

export type DeletePointPhotoResult = "deleted" | "demo" | "denied" | "error";

/** 台帳写真を削除する（RLSで弾かれた場合は "denied"） */
export async function deletePointPhoto(item: PointMediaItem): Promise<DeletePointPhotoResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sess } = await sb.auth.getSession();
    if (!sess.session) return "demo";

    const { data, error } = await sb.from("field_point_media").delete().eq("id", item.id).select("id");
    if (error) {
      console.warn("[pointMedia] delete failed", error);
      return "error";
    }
    if (!data || data.length === 0) return "denied";

    // Storage側はベストエフォート（失敗しても台帳からは消えている）
    sb.storage.from("images").remove([item.storagePath]).then(({ error: rmError }) => {
      if (rmError) console.warn("[pointMedia] storage cleanup failed", rmError);
    });
    return "deleted";
  } catch (err) {
    console.warn("[pointMedia] delete error", err);
    return "error";
  }
}
