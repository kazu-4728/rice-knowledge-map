import type { CalendarSeason, RecordCategoryLabel } from "../supabase/types";

/**
 * システム既定の実写カタログ。
 * 出典: Unsplash（https://unsplash.com/license）。商用利用可・改変可・帰属表示不要。
 * URL自体は src/lib/data/siteContent.ts の DEFAULT_SLIDES と同一のもの（本リポジトリで
 * ランディングの既定ヒーロー画像として稼働実績がある3枚）を用途別に再利用している。
 * 確認日: 2026-07-06（このカタログを追加した時点でリポジトリに既存のURLをそのまま流用）。
 */
const PADDY_GREEN =
  "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=1200&q=70";
const PADDY_MIRROR =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=70";
const PADDY_GOLD =
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=70";

export const SYSTEM_DEFAULT_IMAGES = {
  home: PADDY_GREEN,
  talk: PADDY_MIRROR,
  fieldDefault: PADDY_GREEN,
  calendar: {
    spring: PADDY_GREEN,
    summer: PADDY_GREEN,
    autumn: PADDY_GOLD,
    winter: PADDY_MIRROR,
  } satisfies Record<CalendarSeason, string>,
  recordsCategory: {
    水管理: PADDY_MIRROR,
    作業: PADDY_GREEN,
    異常: PADDY_GOLD,
    音声: PADDY_MIRROR,
  } satisfies Record<RecordCategoryLabel, string>,
};

export function monthToSeason(month: number): CalendarSeason {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
