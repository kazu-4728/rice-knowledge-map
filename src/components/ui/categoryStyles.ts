import type { RecordItem } from "@/types";

/**
 * 記録カテゴリの配色を一元管理する（田んぼOS共通）。
 * ブランド緑を軸に、色相をずらしたテーマカラーで統一する。
 * StatusBadge（対応状況: 正常/要確認/異常/解決済み）とは別軸の分類なので、
 * 「異常」カテゴリの色もStatusBadgeの赤とは衝突しないamber系にしている。
 */
export const CATEGORY_THEME: Record<
  RecordItem["category"],
  { solid: string; chip: string; text: string; dot: string }
> = {
  作業: {
    solid: "border-transparent bg-emerald-700 text-white",
    chip: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
    dot: "bg-emerald-600",
  },
  水管理: {
    solid: "border-transparent bg-sky-600 text-white",
    chip: "bg-sky-50 text-sky-700",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  異常: {
    solid: "border-transparent bg-amber-600 text-white",
    chip: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  音声: {
    solid: "border-transparent bg-violet-600 text-white",
    chip: "bg-violet-50 text-violet-700",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
};

/** 写真上に重ねる濃色バッジ（白文字前提） */
export const CATEGORY_BADGE: Record<RecordItem["category"], string> = Object.fromEntries(
  Object.entries(CATEGORY_THEME).map(([k, v]) => [k, v.solid])
) as Record<RecordItem["category"], string>;

/** インライン表示用の淡色チップ */
export const CATEGORY_CHIP: Record<RecordItem["category"], string> = Object.fromEntries(
  Object.entries(CATEGORY_THEME).map(([k, v]) => [k, v.chip])
) as Record<RecordItem["category"], string>;
