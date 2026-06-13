import type { GeoJSON } from "geojson";
import type { FieldPoint } from "../../types";
import type { FarmFieldRow, FieldPointRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";

const FIELD_COLORS = ["#3B82F6", "#EAB308", "#22C55E", "#A855F7", "#F97316", "#EC4899"];

export type FarmData = {
  /**
   * demo: Supabase未設定（サンプルデータを表示）
   * anon: Supabase設定済みだが未ログイン（実マップのみ。サンプルは出さない）
   * live: ログイン済み（自分のグループのデータ）
   * error: ログイン済みだが取得失敗（未ログイン扱いにしない。編集系は各関数が再検証する）
   */
  mode: "demo" | "anon" | "live" | "error";
  fieldsGeoJSON: GeoJSON.FeatureCollection;
  points: FieldPoint[];
};

const DEMO_DATA: FarmData = {
  mode: "demo",
  fieldsGeoJSON: fieldGeoJSON,
  points: fieldPoints,
};

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const ANON_DATA: FarmData = {
  mode: "anon",
  fieldsGeoJSON: EMPTY_GEOJSON,
  points: [],
};

const ERROR_DATA: FarmData = {
  mode: "error",
  fieldsGeoJSON: EMPTY_GEOJSON,
  points: [],
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "記録なし";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * 田んぼ区画と固定ポイントを読み込む。
 * サンプルデータを出すのはSupabase未設定のデモ環境のみ。
 * 設定済み環境では未ログイン・取得失敗時も空マップにする（偽の区画を見せない）。
 */
export async function loadFarmData(): Promise<FarmData> {
  const sb = getSupabase();
  if (!sb) return DEMO_DATA;

  // ログイン確認後の失敗は「未ログイン」と区別する（ログイン済みユーザーを
  // 誤ってログイン誘導しないため）
  let authed = false;
  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return ANON_DATA;
    authed = true;

    const [fieldsRes, pointsRes] = await Promise.all([
      sb
        .from("farm_fields")
        .select("id, group_id, name, memo, center_latitude, center_longitude, boundary_geojson, area_sqm, display_order")
        .order("display_order"),
      sb
        .from("field_points")
        .select("id, group_id, field_id, point_type, name, latitude, longitude, status, memo, last_checked_at"),
    ]);
    if (fieldsRes.error || pointsRes.error) {
      console.warn("[farm] fetch failed", fieldsRes.error ?? pointsRes.error);
      return ERROR_DATA;
    }

    const fields = (fieldsRes.data ?? []) as FarmFieldRow[];
    const points = (pointsRes.data ?? []) as FieldPointRow[];

    const fieldsGeoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: fields
        .filter((f) => f.boundary_geojson?.type === "Polygon")
        .map((f, i) => ({
          type: "Feature" as const,
          id: f.id,
          properties: { id: f.id, name: f.name, color: FIELD_COLORS[i % FIELD_COLORS.length], area_sqm: f.area_sqm ?? null },
          geometry: f.boundary_geojson as GeoJSON.Polygon,
        })),
    };

    return {
      mode: "live",
      fieldsGeoJSON,
      // numeric列はstringで返る場合があるためNumber変換し、不正座標は除外する
      points: points.flatMap((p) => {
        const lng = Number(p.longitude);
        const lat = Number(p.latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          console.warn("[farm] invalid point coordinates", p.id);
          return [];
        }
        return [
          {
            id: p.id,
            fieldId: p.field_id ?? "",
            name: p.name,
            type: p.point_type,
            status: p.status,
            lastRecord: formatTimestamp(p.last_checked_at),
            lngLat: [lng, lat] as [number, number],
          },
        ];
      }),
    };
  } catch (err) {
    // 設定済み環境では一時的なエラーでも偽のサンプル区画を見せない
    console.warn("[farm] load error", err);
    return authed ? ERROR_DATA : ANON_DATA;
  }
}

/** 指定グループにおけるログインユーザーのロールを返す。未ログイン/未所属はnull */
export async function getMyRole(groupId: string): Promise<"owner" | "editor" | "viewer" | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: session } = await sb.auth.getSession();
  if (!session.session) return null;
  const { data } = await sb
    .from("farm_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", session.session.user.id)
    .maybeSingle();
  return (data?.role as "owner" | "editor" | "viewer") ?? null;
}

/** 所属グループIDを返す。未所属なら新規グループを作成する（create_farm_group RPC） */
export async function ensureGroupId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: members } = await sb.from("farm_group_members").select("group_id").limit(1);
  if (members && members.length > 0) return members[0].group_id as string;

  const { data, error } = await sb.rpc("create_farm_group", { p_name: "わが家の田んぼ" });
  if (error) {
    console.warn("[farm] create group failed", error);
    return null;
  }
  return data as string;
}

export type SaveFieldResult = "saved" | "demo" | "error";

/**
 * なぞって描いた田んぼポリゴンを保存する。
 * 未設定・未ログイン時は "demo"（ローカル表示のみ）を返す。
 * 保存成功時はDB上のidを返す（保存直後の編集・削除に使う）。
 */
export async function saveFieldPolygon(
  name: string,
  vertices: [number, number][]
): Promise<{ status: SaveFieldResult; id: string | null }> {
  // ポリゴンとして成立しない頂点数はNaN/不正データの保存につながるため弾く
  if (vertices.length < 3) return { status: "error", id: null };

  const sb = getSupabase();
  if (!sb) return { status: "demo", id: null };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { status: "demo", id: null };

    const groupId = await ensureGroupId();
    if (!groupId) return { status: "error", id: null };

    const ring = [...vertices, vertices[0]];
    const centerLng = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
    const centerLat = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;

    const { data, error } = await sb
      .from("farm_fields")
      .insert({
        group_id: groupId,
        name,
        boundary_geojson: { type: "Polygon", coordinates: [ring] },
        center_latitude: centerLat,
        center_longitude: centerLng,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("[farm] save field failed", error);
      return { status: "error", id: null };
    }
    return { status: "saved", id: (data?.id as string) ?? null };
  } catch (err) {
    console.warn("[farm] save error", err);
    return { status: "error", id: null };
  }
}

export type UpdateFieldResult = "saved" | "demo" | "denied" | "error";

/**
 * 田んぼの名前・輪郭を更新する。verticesを省略すると名前のみ変更。
 * 未設定・未ログイン時は "demo"（ローカル表示のみ）を返す。
 */
export async function updateField(
  id: string,
  name: string,
  vertices?: [number, number][]
): Promise<UpdateFieldResult> {
  if (vertices && vertices.length < 3) return "error";

  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return "demo";

    const patch: Record<string, unknown> = { name };
    if (vertices) {
      const ring = [...vertices, vertices[0]];
      patch.boundary_geojson = { type: "Polygon", coordinates: [ring] };
      patch.center_longitude = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
      patch.center_latitude = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;
    }

    // RLSで弾かれた更新はエラーにならず0件成功になるため、結果行で判定する
    const { data, error } = await sb.from("farm_fields").update(patch).eq("id", id).select("id");
    if (error) {
      console.warn("[farm] update field failed", error);
      return "error";
    }
    if (!data || data.length === 0) return "denied";
    return "saved";
  } catch (err) {
    console.warn("[farm] update error", err);
    return "error";
  }
}

export type SaveFieldPointResult = "saved" | "demo" | "error";
export type UpdateFieldPointResult = "saved" | "demo" | "denied" | "error";
export type DeleteFieldPointResult = "deleted" | "demo" | "denied" | "error";

/**
 * 新しいピンを保存する。
 * 未設定・未ログイン時は "demo" を返す。
 * 保存成功時はDB上のidを返す。
 */
export async function saveFieldPoint(params: {
  fieldId: string | null;
  pointType: FieldPointRow["point_type"];
  name: string;
  latitude: number;
  longitude: number;
  status?: FieldPointRow["status"];
  memo?: string;
}): Promise<{ status: SaveFieldPointResult; id: string | null }> {
  // 不正座標は保存せず即エラー（保存成功→次回読み込みで除外される矛盾を防ぐ）
  if (
    !Number.isFinite(params.latitude) || !Number.isFinite(params.longitude) ||
    params.latitude < -90 || params.latitude > 90 ||
    params.longitude < -180 || params.longitude > 180
  ) {
    return { status: "error", id: null };
  }

  const sb = getSupabase();
  if (!sb) return { status: "demo", id: null };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { status: "demo", id: null };

    const groupId = await ensureGroupId();
    if (!groupId) return { status: "error", id: null };

    const { data, error } = await sb
      .from("field_points")
      .insert({
        group_id: groupId,
        field_id: params.fieldId,
        point_type: params.pointType,
        name: params.name,
        latitude: params.latitude,
        longitude: params.longitude,
        status: params.status ?? "normal",
        memo: params.memo ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("[farm] save point failed", error);
      return { status: "error", id: null };
    }
    return { status: "saved", id: (data?.id as string) ?? null };
  } catch (err) {
    console.warn("[farm] save point error", err);
    return { status: "error", id: null };
  }
}

/**
 * ピンの名前・種別・状態を更新する。
 * RLSで弾かれた場合は "denied" を返す。
 */
export async function updateFieldPoint(
  id: string,
  patch: Partial<{
    name: string;
    pointType: FieldPointRow["point_type"];
    status: FieldPointRow["status"];
    memo: string | null;
  }>
): Promise<UpdateFieldPointResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return "demo";

    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.pointType !== undefined) row.point_type = patch.pointType;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.memo !== undefined) row.memo = patch.memo;
    if (Object.keys(row).length === 0) return "saved";

    const { data, error } = await sb.from("field_points").update(row).eq("id", id).select("id");
    if (error) {
      console.warn("[farm] update point failed", error);
      return "error";
    }
    if (!data || data.length === 0) return "denied";
    return "saved";
  } catch (err) {
    console.warn("[farm] update point error", err);
    return "error";
  }
}

/**
 * ピンを削除する。
 * RLSで弾かれた場合は "denied" を返す。
 */
export async function deleteFieldPoint(id: string): Promise<DeleteFieldPointResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return "demo";

    const { data, error } = await sb.from("field_points").delete().eq("id", id).select("id");
    if (error) {
      console.warn("[farm] delete point failed", error);
      return "error";
    }
    if (!data || data.length === 0) return "denied";
    return "deleted";
  } catch (err) {
    console.warn("[farm] delete point error", err);
    return "error";
  }
}

export type DeleteFieldResult = "deleted" | "demo" | "denied" | "error";

/**
 * 田んぼを削除する（RLS上、削除は管理者=ownerのみ）。
 * 紐づくピン・記録は削除されず、田んぼとのリンクだけ外れる（FKはset null）。
 */
export async function deleteField(id: string): Promise<DeleteFieldResult> {
  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return "demo";

    // RLSで弾かれた削除はエラーにならず0件成功になるため、結果行で判定する
    const { data, error } = await sb.from("farm_fields").delete().eq("id", id).select("id");
    if (error) {
      console.warn("[farm] delete field failed", error);
      return "error";
    }
    if (!data || data.length === 0) return "denied";
    return "deleted";
  } catch (err) {
    console.warn("[farm] delete error", err);
    return "error";
  }
}
