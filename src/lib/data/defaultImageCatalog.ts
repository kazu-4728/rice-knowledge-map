import type { CalendarSeason, RecordCategoryLabel } from "../supabase/types";

/**
 * システム既定の実写カタログ。
 * 実体はオーナー提供のAI生成画像5枚（2026-07-06受領、生成画像のため
 * 第三者ライセンスなし）。Supabase Storageの公開バケット app-defaults で管理し、
 * リポジトリには画像バイナリを置かない。
 * オーナーが /menu/site で差し替えた画像（image_slots）が常に優先され、
 * ここの画像は「何も設定していなくても実写で見える」ための最終既定。
 * Supabase未設定環境（純デモ）ではundefinedとなり、RemotePhotoの
 * PaddyPhoto SVGフォールバックに委ねる。
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function defaultImage(name: string): string | undefined {
  return SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/app-defaults/${name}`
    : undefined;
}

const SUNRISE_PADDIES = defaultImage("sunrise-paddies.webp"); // 朝日と霧の田園全景
const FARMER_CHECK = defaultImage("farmer-check.webp"); // 田を見回る農家
const SEEDLING_WATER = defaultImage("seedling-water.webp"); // 水鏡と若苗の接写
const PLANTING_MACHINE = defaultImage("planting-machine.webp"); // 田植え機と植え付け直後の列
const HARVEST_GOLD = defaultImage("harvest-gold.webp"); // 黄金色の稲穂

export const SYSTEM_DEFAULT_IMAGES = {
  home: SUNRISE_PADDIES,
  talk: FARMER_CHECK,
  fieldDefault: SEEDLING_WATER,
  calendar: {
    spring: PLANTING_MACHINE,
    summer: SEEDLING_WATER,
    autumn: HARVEST_GOLD,
    winter: SUNRISE_PADDIES,
  } satisfies Record<CalendarSeason, string | undefined>,
  recordsCategory: {
    水管理: SEEDLING_WATER,
    作業: PLANTING_MACHINE,
    異常: FARMER_CHECK,
    音声: SUNRISE_PADDIES,
  } satisfies Record<RecordCategoryLabel, string | undefined>,
};

export function monthToSeason(month: number): CalendarSeason {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
