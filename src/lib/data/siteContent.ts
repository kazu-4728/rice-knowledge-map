import type { HeroSlide, GroupSiteContentRow, ImageSlot, ImageSlots } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { ensureGroupId } from "./farm";
import { SYSTEM_DEFAULT_IMAGES } from "./defaultImageCatalog";

export type { HeroSlide, ImageSlot, ImageSlots };

// 既定画像はオーナー提供の実写（Supabase Storageのapp-defaultsバケット、
// defaultImageCatalog.ts参照。Supabase未設定環境ではimage_urlがundefinedになり
// RemotePhoto/HeroBackdropのフォールバック表示に委ねる）。
// ランディング（/）とホーム（/home）で同じスライド列を共有し（Issue #72確定事項8）、
// 内容はランディングの説明文（課題提起・3つの空間・3ステップ）の要約で構成する
export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    // 家族が畦道でスマホを見る、ワイド構図（\nはホームヒーローでの改行位置。ランディングでは空白になる）
    image_url: SYSTEM_DEFAULT_IMAGES.heroFamily,
    title: "家族で育てる、\nわが家の田んぼ。",
    body: "記録して、共有して、振り返る。毎日の積み重ねが、お米の未来をつくります。",
  },
  {
    // 朝日と霧の田園全景
    image_url: SYSTEM_DEFAULT_IMAGES.home,
    title: "「言った言わない」を、なくす。",
    body: "口頭の伝達は忘れる。場所は伝わらない。去年の作業は思い出せない。家族の稲作の困りごとを、記録がまるごと引き受けます。",
  },
  {
    // 田を見回る農家
    image_url: SYSTEM_DEFAULT_IMAGES.talk,
    title: "開く・話す・見わたす。",
    body: "開けば地図で田んぼの状態がひと目でわかる。写真や音声の記録は、そのまま家族のトークに流れます。",
  },
  {
    // 黄金色の稲穂・収穫前
    image_url: SYSTEM_DEFAULT_IMAGES.calendar.autumn,
    title: "はじめるのは、3ステップ。",
    body: "田んぼをなぞって登録、ボタンひとつで記録、家族に自動で届く。まずは一枚の写真から。",
  },
];

export type SiteContentResult =
  | { mode: "live" | "demo"; groupId: string; slides: HeroSlide[]; imageSlots: ImageSlots }
  | { mode: "anon"; groupId: null; slides: HeroSlide[]; imageSlots: ImageSlots };

/** slot群に含まれる image_path を署名URLへ変換し、同じ形の image_url 入りオブジェクトを返す */
async function resolveImagePaths<T extends Record<string, ImageSlot | undefined>>(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  slotsByKey: T
): Promise<T> {
  const paths = Object.values(slotsByKey).flatMap((s) => (s?.image_path ? [s.image_path] : []));
  if (paths.length === 0) return slotsByKey;

  const { data: signed } = await sb.storage.from("images").createSignedUrls(paths, 3600);
  const signedMap = new Map<string, string>();
  signed?.forEach((s, i) => {
    if (s.signedUrl && !s.error) signedMap.set(paths[i], s.signedUrl);
  });

  const resolved = { ...slotsByKey };
  for (const key of Object.keys(resolved) as (keyof T)[]) {
    const slot = resolved[key];
    if (slot?.image_path && signedMap.has(slot.image_path)) {
      resolved[key] = { ...slot, image_url: signedMap.get(slot.image_path) } as T[keyof T];
    }
  }
  return resolved;
}

async function resolveImageSlots(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  raw: ImageSlots,
  // ホームバナー5件の署名URL解決は/homeと編集画面（ImageSlotsEditor）だけで必要。
  // calendar/records/fields等の軽量呼び出し（loadImageSlots既定）では不要な
  // createSignedUrlsを避けるため既定はfalseにする
  includeHomeBanners = false
): Promise<ImageSlots> {
  const top = await resolveImagePaths(sb, {
    home: raw.home,
    talk: raw.talk,
    fieldDefault: raw.fieldDefault,
    authedHero: raw.authedHero,
  });
  const calendar = raw.calendar ? await resolveImagePaths(sb, raw.calendar) : undefined;
  const recordsCategory = raw.recordsCategory
    ? await resolveImagePaths(sb, raw.recordsCategory)
    : undefined;
  const homeBanners =
    includeHomeBanners && raw.homeBanners ? await resolveImagePaths(sb, raw.homeBanners) : undefined;
  return { ...top, calendar, recordsCategory, homeBanners };
}

export async function loadSiteContent(includeHomeBanners = false): Promise<SiteContentResult> {
  const sb = getSupabase();
  if (!sb) return { mode: "demo", groupId: "demo", slides: DEFAULT_SLIDES, imageSlots: {} };

  const { data: session } = await sb.auth.getSession();
  if (!session.session) return { mode: "anon", groupId: null, slides: DEFAULT_SLIDES, imageSlots: {} };

  const groupId = await ensureGroupId();
  if (!groupId) return { mode: "anon", groupId: null, slides: DEFAULT_SLIDES, imageSlots: {} };

  const { data } = await sb
    .from("group_site_content")
    .select("hero_slides, image_slots")
    .eq("group_id", groupId)
    .maybeSingle();

  const row = data as Pick<GroupSiteContentRow, "hero_slides" | "image_slots"> | null;
  const rawSlides =
    row && Array.isArray(row.hero_slides) && row.hero_slides.length > 0
      ? (row.hero_slides as HeroSlide[])
      : DEFAULT_SLIDES;

  // image_path（Storageパス）を持つスライドは署名URLに変換して表示できるようにする
  const paths = rawSlides.flatMap((s) => (s.image_path ? [s.image_path] : []));
  const signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await sb.storage.from("images").createSignedUrls(paths, 3600);
    signed?.forEach((s, i) => {
      if (s.signedUrl && !s.error) signedMap.set(paths[i], s.signedUrl);
    });
  }
  const slides = rawSlides.map((s) =>
    s.image_path && signedMap.has(s.image_path)
      ? { ...s, image_url: signedMap.get(s.image_path) }
      : s
  );

  const imageSlots = await resolveImageSlots(sb, row?.image_slots ?? {}, includeHomeBanners);

  return { mode: "live", groupId, slides, imageSlots };
}

/**
 * 各画面ヒーロー用にimage_slotsだけを取得する軽量版。hero_slidesは取得せず、image_pathは署名URLへ変換する。
 * ホームバナー（homeBanners）は既定で解決しない。ImageSlotsEditor（オーナー編集画面）が
 * 全スロットを表示・編集する場合のみ includeHomeBanners=true を渡す
 */
export async function loadImageSlots(includeHomeBanners = false): Promise<ImageSlots> {
  const sb = getSupabase();
  if (!sb) return {};

  const { data: session } = await sb.auth.getSession();
  if (!session.session) return {};

  const groupId = await ensureGroupId();
  if (!groupId) return {};

  const { data } = await sb
    .from("group_site_content")
    .select("image_slots")
    .eq("group_id", groupId)
    .maybeSingle();

  const row = data as Pick<GroupSiteContentRow, "image_slots"> | null;
  return resolveImageSlots(sb, row?.image_slots ?? {}, includeHomeBanners);
}

export async function saveSiteContent(
  groupId: string,
  slides: HeroSlide[]
): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase未設定" };

  const { data: session } = await sb.auth.getSession();
  if (!session.session) return { error: "ログインが必要です" };

  const { error } = await sb.from("group_site_content").upsert(
    {
      group_id: groupId,
      hero_slides: slides,
      updated_by: session.session.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );

  return { error: error?.message ?? null };
}

export async function saveImageSlots(
  groupId: string,
  imageSlots: ImageSlots
): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase未設定" };

  const { data: session } = await sb.auth.getSession();
  if (!session.session) return { error: "ログインが必要です" };

  const { error } = await sb.from("group_site_content").upsert(
    {
      group_id: groupId,
      image_slots: imageSlots,
      updated_by: session.session.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );

  return { error: error?.message ?? null };
}
