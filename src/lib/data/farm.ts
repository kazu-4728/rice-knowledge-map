import type { GeoJSON } from "geojson";
import type { FieldPoint } from "../../types";
import type { FarmFieldRow, FieldPointRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { fieldGeoJSON, fieldPoints } from "../../data/dummy";

const FIELD_COLORS = ["#3B82F6", "#EAB308", "#22C55E", "#A855F7", "#F97316", "#EC4899"];

export type FarmData = {
  /** ログイン済みでSupabaseから取得したデータか（falseはデモ用サンプル） */
  live: boolean;
  fieldsGeoJSON: GeoJSON.FeatureCollection;
  points: FieldPoint[];
};

const DEMO_DATA: FarmData = {
  live: false,
  fieldsGeoJSON: fieldGeoJSON,
  points: fieldPoints,
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "記録なし";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * 田んぼ区画と固定ポイントを読み込む。
 * 未設定・未ログイン・取得失敗時はデモ用サンプルにフォールバックする。
 */
export async function loadFarmData(): Promise<FarmData> {
  const sb = getSupabase();
  if (!sb) return DEMO_DATA;

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return DEMO_DATA;

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
      return DEMO_DATA;
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
          properties: { id: f.id, name: f.name, color: FIELD_COLORS[i % FIELD_COLORS.length] },
          geometry: f.boundary_geojson as GeoJSON.Polygon,
        })),
    };

    return {
      live: true,
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
    console.warn("[farm] load error", err);
    return DEMO_DATA;
  }
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
 */
export async function saveFieldPolygon(
  name: string,
  vertices: [number, number][]
): Promise<SaveFieldResult> {
  // ポリゴンとして成立しない頂点数はNaN/不正データの保存につながるため弾く
  if (vertices.length < 3) return "error";

  const sb = getSupabase();
  if (!sb) return "demo";

  try {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return "demo";

    const groupId = await ensureGroupId();
    if (!groupId) return "error";

    const ring = [...vertices, vertices[0]];
    const centerLng = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
    const centerLat = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;

    const { error } = await sb.from("farm_fields").insert({
      group_id: groupId,
      name,
      boundary_geojson: { type: "Polygon", coordinates: [ring] },
      center_latitude: centerLat,
      center_longitude: centerLng,
      created_by: user.id,
    });
    if (error) {
      console.warn("[farm] save field failed", error);
      return "error";
    }
    return "saved";
  } catch (err) {
    console.warn("[farm] save error", err);
    return "error";
  }
}
