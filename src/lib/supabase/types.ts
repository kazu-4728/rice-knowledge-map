import type { FieldPointType } from "../../types";

/** supabase/migrations/0001_init.sql の行型（アプリで使う列のみ） */

/** Postgresのnumeric/decimalはPostgRESTからstringで返る場合がある */
export type Numeric = string | number;

export type FarmFieldRow = {
  id: string;
  group_id: string;
  name: string;
  memo: string | null;
  center_latitude: Numeric | null;
  center_longitude: Numeric | null;
  boundary_geojson: GeoJSON.Polygon | null;
  area_sqm: Numeric | null;
  display_order: number;
};

export type FieldPointRow = {
  id: string;
  group_id: string;
  field_id: string | null;
  point_type: FieldPointType;
  name: string;
  latitude: Numeric;
  longitude: Numeric;
  status: "normal" | "needs_check" | "issue" | "resolved";
  memo: string | null;
  last_checked_at: string | null;
};

export type HeroSlide = {
  image_path?: string;
  image_url?: string;
  title: string;
  body: string;
};

export type GroupSiteContentRow = {
  group_id: string;
  hero_slides: HeroSlide[];
  updated_by: string | null;
  updated_at: string;
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
