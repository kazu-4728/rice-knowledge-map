"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { useDrawer } from "../../components/layout/DrawerContext";
import { loadSiteContent, DEFAULT_SLIDES, type HeroSlide } from "../../lib/data/siteContent";
import { SYSTEM_DEFAULT_IMAGES } from "../../lib/data/defaultImageCatalog";
import type { ImageSlots } from "../../lib/supabase/types";
import { HomeHero } from "./HomeHero";
import { FeatureBanner } from "./FeatureBanner";
import { HomeShareSheet } from "./HomeShareSheet";
import { HOME_BANNERS, type HomeBannerDef } from "./homeBanners";
import {
  IconBell,
  IconBookOpen,
  IconChevronRight,
  IconHeadphones,
  IconHelpCircle,
  IconInfo,
  IconMenu,
  IconUserFill,
  LogoRice,
} from "../../components/ui/icons";

/** 補助リンク（2×2）。実体があるのは使い方ガイドのみ、他は準備中（Issue #72確定事項11） */
const SUPPORT_LINKS: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  sub: string;
  href?: string;
}[] = [
  { Icon: IconBookOpen, title: "はじめての方へ", sub: "使い方ガイド", href: "/guide" },
  { Icon: IconHelpCircle, title: "よくある質問", sub: "準備中" },
  { Icon: IconBell, title: "お知らせ", sub: "準備中" },
  { Icon: IconHeadphones, title: "サポート・お問い合わせ", sub: "準備中" },
];

/** フッターの法的文書リンク。専用ページ未整備のため準備中表記（確定事項10・11） */
const FOOTER_PENDING = ["サイト方針", "利用規約", "プライバシーポリシー", "特定商取引法", "運営会社", "お問い合わせ"];

export default function HomeScreen() {
  const { setDrawerOpen } = useDrawer();
  // 取得完了までの空白/レイアウトジャンプを避けるため既定スライドで初期化する
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});
  // LINE共有は田んぼ選択シート経由でPR #71の共有導線（shareFieldStory）へつなぐ
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    loadSiteContent(true).then((r) => {
      setSlides(r.slides);
      setImageSlots(r.imageSlots);
    });
  }, []);

  const bannerImage = (key: HomeBannerDef["key"]) =>
    imageSlots.homeBanners?.[key]?.image_url ?? SYSTEM_DEFAULT_IMAGES.homeBanners[key];

  const handleShare = () => setShareOpen(true);

  /** ヒーロー内の機能クイックアクセス帯（横スクロール・モックのショートカット列） */
  const quickAccess = (
    <div className="scrollbar-none -mx-1 flex snap-x items-stretch gap-1 overflow-x-auto px-1 pb-1 lg:justify-center">
      {HOME_BANNERS.map((def, i) => {
        const inner = (
          <>
            <def.Icon className="h-6 w-6 text-green-700" />
            <span className="text-[11px] font-bold leading-tight text-green-900">{def.shortTitle}</span>
            <span className="text-[9px] leading-tight text-gray-500">{def.shortSub}</span>
          </>
        );
        const cardClass =
          "flex w-[6.9rem] shrink-0 snap-start flex-col items-center justify-start gap-1 rounded-2xl bg-white/95 px-1.5 py-2.5 text-center shadow-md backdrop-blur-sm transition-transform active:scale-95";
        return (
          <div key={def.key} className="flex shrink-0 items-center gap-1">
            {i > 0 && <IconChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-white/70" />}
            {def.action.type === "link" ? (
              <Link href={def.action.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={handleShare} className={cardClass}>
                {inner}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-full bg-flow-cream pb-8">
      {/* ヘッダー: ロゴ+アプリ名+タグライン、右にメニュー・アカウント */}
      <header className="flex items-center gap-3 px-4 pb-3 pt-4">
        <LogoRice className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-[1.45rem] font-bold leading-tight tracking-tight text-green-900 sm:text-2xl">
            みらい稲作管理
          </h1>
          <p className="mt-0.5 truncate text-[11px] font-medium tracking-wide text-gray-500">
            記録・共有・振り返りを、家族でひとつに。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="メニューを開く"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors active:bg-gray-100 lg:hidden"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <Link
          href="/menu"
          aria-label="アカウント・設定"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.6)]"
        >
          <IconUserFill className="h-5 w-5" />
        </Link>
      </header>

      <div className="space-y-4 px-3">
        {/* ヒーロー（コピー+実写スライド+クイックアクセス帯） */}
        <HomeHero slides={slides} quickAccess={quickAccess} />

        {/* インフォバナー: ホームの使い方 */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
            <IconInfo className="h-4.5 w-4.5" />
          </span>
          <p className="shrink-0 text-sm font-bold leading-tight text-gray-900">
            ホームの
            <br className="sm:hidden" />
            使い方
          </p>
          <span aria-hidden className="h-9 w-px shrink-0 bg-gray-200" />
          <p className="min-w-0 text-xs leading-relaxed text-gray-600">
            バナーをタップすると詳しい説明がひらきます。右の緑のボタンで各ページへ進めます。
          </p>
        </div>

        {/* 機能バナー5件 */}
        <div className="space-y-3">
          {HOME_BANNERS.map((def) => (
            <FeatureBanner key={def.key} def={def} imageUrl={bannerImage(def.key)} onShare={handleShare} />
          ))}
        </div>

        {/* 補助リンク（2×2） */}
        <div className="grid grid-cols-2 gap-2.5">
          {SUPPORT_LINKS.map(({ Icon, title, sub, href }) => {
            const inner = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold leading-snug text-gray-900">{title}</span>
                  <span className={`block text-[10px] ${href ? "text-gray-500" : "text-gray-400"}`}>{sub}</span>
                </span>
                {href && <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
              </>
            );
            const tileClass =
              "flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]";
            return href ? (
              <Link key={title} href={href} className={`${tileClass} transition-colors active:bg-gray-50`}>
                {inner}
              </Link>
            ) : (
              <div key={title} className={`${tileClass} opacity-70`}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <footer className="border-t border-gray-200 pt-4">
          <nav
            aria-label="サイト情報"
            className="flex flex-wrap items-center justify-center gap-y-1.5 text-[11px]"
          >
            <Link href="/guide" className="px-2.5 font-medium text-gray-600 underline-offset-2 hover:underline">
              使い方ガイド
            </Link>
            {FOOTER_PENDING.map((label) => (
              <span key={label} className="border-l border-gray-200 px-2.5 text-gray-400">
                {label}
              </span>
            ))}
          </nav>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            ※ グレーの項目は準備中です。順次公開します。
          </p>
          <p className="mt-3 text-center text-[10px] text-gray-400">© みらい稲作管理 — 未来へつなぐ、農の記録</p>
        </footer>
      </div>

      <HomeShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
