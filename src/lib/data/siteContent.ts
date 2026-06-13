import type { HeroSlide, GroupSiteContentRow } from "../supabase/types";
import { getSupabase } from "../supabase/client";
import { ensureGroupId } from "./farm";

export type { HeroSlide };

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image_url:
      "https://images.unsplash.com/photo-1536184071535-78906f7172c2?w=1200&q=70",
    title: "家族の田んぼを、みんなで守る",
    body: "水、土、稲の様子を写真と音声で記録。離れていても今日の田んぼが分かります。",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=70",
    title: "記録が、次の一手になる",
    body: "入水口・異常箇所をピンで管理。家族でコメントを付けて対応を共有できます。",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1602513288943-d70ee5d29186?w=1200&q=70",
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
  const slides =
    row && Array.isArray(row.hero_slides) && row.hero_slides.length > 0
      ? (row.hero_slides as HeroSlide[])
      : DEFAULT_SLIDES;

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
