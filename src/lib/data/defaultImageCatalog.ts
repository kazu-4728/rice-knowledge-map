import type { CalendarSeason, RecordCategoryLabel } from "../supabase/types";

/**
 * システム既定の実写カタログ。
 * 出典: オーナー提供のAI生成画像5枚（2026-07-06受領、public/img/defaults/ に
 * WebP圧縮して同梱。生成画像のため第三者ライセンスなし・商用利用の制約なし）。
 * オーナーが /menu/site で差し替えた画像（image_slots）が常に優先され、
 * ここの画像は「何も設定していなくても実写で見える」ための最終既定。
 */
const SUNRISE_PADDIES = "/img/defaults/sunrise-paddies.webp"; // 朝日と霧の田園全景
const FARMER_CHECK = "/img/defaults/farmer-check.webp"; // 田を見回る農家
const SEEDLING_WATER = "/img/defaults/seedling-water.webp"; // 水鏡と若苗の接写
const PLANTING_MACHINE = "/img/defaults/planting-machine.webp"; // 田植え機と植え付け直後の列
const HARVEST_GOLD = "/img/defaults/harvest-gold.webp"; // 黄金色の稲穂

export const SYSTEM_DEFAULT_IMAGES = {
  home: SUNRISE_PADDIES,
  talk: FARMER_CHECK,
  fieldDefault: SEEDLING_WATER,
  calendar: {
    spring: PLANTING_MACHINE,
    summer: SEEDLING_WATER,
    autumn: HARVEST_GOLD,
    winter: SUNRISE_PADDIES,
  } satisfies Record<CalendarSeason, string>,
  recordsCategory: {
    水管理: SEEDLING_WATER,
    作業: PLANTING_MACHINE,
    異常: FARMER_CHECK,
    音声: SUNRISE_PADDIES,
  } satisfies Record<RecordCategoryLabel, string>,
};

export function monthToSeason(month: number): CalendarSeason {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
