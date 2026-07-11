"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SectionEyebrow } from "../../components/patterns/SectionEyebrow";
import { RevealCard } from "../../components/patterns/RevealCard";
import { loadSiteContent, type HeroSlide } from "../../lib/data/siteContent";
import { SYSTEM_DEFAULT_IMAGES } from "../../lib/data/defaultImageCatalog";
import type { ImageSlots } from "../../lib/supabase/types";
import { shareContent } from "../../lib/utils/share";
import { useToast } from "../../components/ui/Toast";
import { HomeHero } from "./HomeHero";
import { FeatureBanner } from "./FeatureBanner";
import { HOME_BANNERS } from "./homeBanners";
import { IconChevronRight, IconSprout } from "../../components/ui/icons";

/** 実体のない導線・法的文書は仮文言・準備中表記にする（Issue #72確定事項10・11） */
function ComingSoonRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-1 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">準備中</span>
    </div>
  );
}

export default function HomeScreen() {
  const { showToast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});

  useEffect(() => {
    loadSiteContent().then((r) => {
      setSlides(r.slides);
      setImageSlots(r.imageSlots);
    });
  }, []);

  const bannerImage = (key: (typeof HOME_BANNERS)[number]["key"]) =>
    imageSlots.homeBanners?.[key]?.image_url ?? SYSTEM_DEFAULT_IMAGES.homeBanners[key];

  const handleShare = async () => {
    const result = await shareContent({
      title: "みらい稲作管理",
      text: "家族の田んぼの記録を、みんなで見てみませんか",
      url: typeof window !== "undefined" ? window.location.origin : "",
    });
    if (result === "copied") showToast("リンクをコピーしました。LINEなどに貼り付けて共有できます");
    else if (result === "failed") showToast("共有に失敗しました", "error");
  };

  return (
    <div className="min-h-full space-y-5 bg-flow-cream px-3 pb-8 pt-3">
      <HomeHero slides={slides} />

      {/* インフォバナー: ホームの使い方 */}
      <RevealCard className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
          <IconSprout className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-900">ホームの使い方</p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
            バナーをタップすると詳しい説明が開きます。右の丸いボタンでそのページへ進めます。
          </p>
        </div>
      </RevealCard>

      {/* 機能バナー5件 */}
      <div className="space-y-3">
        {HOME_BANNERS.map((def, i) => (
          <RevealCard key={def.key} delay={i * 0.05}>
            <FeatureBanner def={def} imageUrl={bannerImage(def.key)} onShare={handleShare} />
          </RevealCard>
        ))}
      </div>

      {/* 補助リンク（2x2） */}
      <RevealCard>
        <SectionEyebrow className="mb-2 px-1">Links</SectionEyebrow>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/guide"
            className="flex flex-col justify-between rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)] transition-colors active:bg-gray-50"
          >
            <span className="text-sm font-bold text-gray-900">使い方ガイド</span>
            <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-700">
              見る <IconChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          {["よくある質問", "お知らせ", "サポート・お問い合わせ"].map((label) => (
            <div
              key={label}
              className="flex flex-col justify-between rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]"
            >
              <span className="text-sm font-bold text-gray-400">{label}</span>
              <span className="mt-2 text-xs font-semibold text-gray-300">準備中</span>
            </div>
          ))}
        </div>
      </RevealCard>

      {/* フッター */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-white px-3 py-2 shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]"
      >
        <div className="divide-y divide-gray-100">
          <ComingSoonRow label="このサイトについて" />
          <ComingSoonRow label="サイト方針" />
          <Link href="/guide" className="flex items-center justify-between px-1 py-2.5 text-sm">
            <span className="text-gray-700">使い方</span>
            <IconChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
          <ComingSoonRow label="プライバシーポリシー" />
          <ComingSoonRow label="利用上の注意" />
          <ComingSoonRow label="お問い合わせ・運営者情報" />
        </div>
        <p className="px-1 py-3 text-center text-[11px] text-gray-400">
          © みらい稲作管理 — 未来へつなぐ、農の記録
        </p>
      </motion.footer>
    </div>
  );
}
