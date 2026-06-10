import type { FieldPointType } from "../../types";

/** supabase/migrations/0001_init.sql の行型（アプリで使う列のみ） */

export type FarmFieldRow = {
  id: string;
  group_id: string;
  name: string;
  memo: string | null;
  center_latitude: number | null;
  center_longitude: number | null;
  boundary_geojson: GeoJSON.Polygon | null;
  area_sqm: number | null;
  display_order: number;
};

export type FieldPointRow = {
  id: string;
  group_id: string;
  field_id: string | null;
  point_type: FieldPointType;
  name: string;
  latitude: number;
  longitude: number;
  status: "normal" | "needs_check" | "issue" | "resolved";
  memo: string | null;
  last_checked_at: string | null;
};

export type RecordRow = {
  id: string;
  group_id: string;
  field_id: string | null;
  point_id: string | null;
  record_type: "photo" | "voice" | "water" | "work" | "issue" | "check" | "other";
  status: "open" | "needs_check" | "resolved" | "monitoring";
  title: string;
  note: string | null;
  ai_summary: string | null;
  recorded_by: string;
  recorded_at: string;
};
