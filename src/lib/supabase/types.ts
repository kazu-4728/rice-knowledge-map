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
  photo_path: string | null;
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

/** 画面ヒーロー用カバー画像1件（差し替え可能スロット） */
export type ImageSlot = {
  image_path?: string;
  image_url?: string;
};

export type CalendarSeason = "spring" | "summer" | "autumn" | "winter";
export type RecordCategoryLabel = "水管理" | "作業" | "異常" | "音声";

export type ImageSlots = {
  home?: ImageSlot;
  talk?: ImageSlot;
  fieldDefault?: ImageSlot;
  calendar?: Partial<Record<CalendarSeason, ImageSlot>>;
  recordsCategory?: Partial<Record<RecordCategoryLabel, ImageSlot>>;
};

export type GroupSiteContentRow = {
  group_id: string;
  hero_slides: HeroSlide[];
  image_slots: ImageSlots;
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
