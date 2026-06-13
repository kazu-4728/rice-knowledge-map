import type { HeroSlide, GroupSiteContentRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { ensureGroupId } from "./farm";

export type { HeroSlide };

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    // 青々とした水田・稲穂
    image_url:
      "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=1200&q=70",
    title: "家族の田んぼを、みんなで守る",
    body: "水、土、稲の様子を写真と音声で記録。離れていても今日の田んぼが分かります。",
  },
  {
    // 水鏡の田んぼ・稲作風景
    image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=70",
    title: "記録が、次の一手になる",
    body: "入水口・異常箇所をピンで管理。家族でコメントを付けて対応を共有できます。",
  },
  {
    // 黄金色の稲穂・収穫前
    image_url:
      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=70",
    title: "稲を育てるストーリーを残す",
    body: "今年の記録が、来年の判断を助けます。農家の知恵をデジタルで引き継ぐ。",
  },
];

export type SiteContentResult =
  | { mode: "live" | "demo"; groupId: string; slides: HeroSlide[] }
  | { mode: "anon"; groupId: null; slides: HeroSlide[] };

export async function loadSiteContent(): Promise<SiteContentResult> {
  const sb = getSupabase();
  if (!sb) return { mode: "demo", groupId: "demo", slides: DEFAULT_SLIDES };

  const { data: session } = await sb.auth.getSession();
  if (!session.session) return { mode: "anon", groupId: null, slides: DEFAULT_SLIDES };

  const groupId = await ensureGroupId();
  if (!groupId) return { mode: "anon", groupId: null, slides: DEFAULT_SLIDES };

  const { data } = await sb
    .from("group_site_content")
    .select("hero_slides")
    .eq("group_id", groupId)
    .maybeSingle();

  const row = data as Pick<GroupSiteContentRow, "hero_slides"> | null;
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

  return { mode: "live", groupId, slides };
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
