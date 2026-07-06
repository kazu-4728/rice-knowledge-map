import type { ImageSlots, RecordCategoryLabel } from "../supabase/types";
import { SYSTEM_DEFAULT_IMAGES, monthToSeason } from "./defaultImageCatalog";

/**
 * 各画面ヒーローの表示URLを優先順位で解決する。
 * ①実データ画像（呼び出し側が渡す photoUrl 等） → ②オーナー設定の差し替え画像
 * （imageSlots） → ③システム既定の実写（defaultImageCatalog）。
 * ここで解決できない場合（全滅）は undefined を返し、呼び出し側の
 * RemotePhoto コンポーネントがさらに PaddyPhoto（最終フォールバック）へ委ねる。
 */

export function resolveHomeHeroUrl(imageSlots: ImageSlots): string | undefined {
  return imageSlots.home?.image_url ?? SYSTEM_DEFAULT_IMAGES.home;
}

export function resolveTalkCoverUrl(imageSlots: ImageSlots): string | undefined {
  return imageSlots.talk?.image_url ?? SYSTEM_DEFAULT_IMAGES.talk;
}

export function resolveFieldCoverUrl(
  fieldPhotoUrl: string | null | undefined,
  imageSlots: ImageSlots
): string | undefined {
  return fieldPhotoUrl ?? imageSlots.fieldDefault?.image_url ?? SYSTEM_DEFAULT_IMAGES.fieldDefault;
}

export function resolveCalendarCoverUrl(month: number, imageSlots: ImageSlots): string | undefined {
  const season = monthToSeason(month);
  return imageSlots.calendar?.[season]?.image_url ?? SYSTEM_DEFAULT_IMAGES.calendar[season];
}

export function resolveRecordCoverUrl(
  thumbUrl: string | undefined,
  category: RecordCategoryLabel,
  imageSlots: ImageSlots
): string | undefined {
  return (
    thumbUrl ??
    imageSlots.recordsCategory?.[category]?.image_url ??
    SYSTEM_DEFAULT_IMAGES.recordsCategory[category]
  );
}
