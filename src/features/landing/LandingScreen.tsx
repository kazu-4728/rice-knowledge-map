"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "../auth/useAuth";
import { loadFieldAttention, type FieldAttentionSummary } from "../../lib/data/fieldAttention";
import { loadRecords } from "../../lib/data/records";
import { loadSiteContent, DEFAULT_SLIDES, type HeroSlide } from "../../lib/data/siteContent";
import type { ImageSlots } from "../../lib/supabase/types";
import { SYSTEM_DEFAULT_IMAGES } from "../../lib/data/defaultImageCatalog";
import HeroBackdrop from "./HeroBackdrop";
import { MapMockup, PhoneFrame } from "./mockups";
import { FeatureBanner } from "../home/FeatureBanner";
import { HomeShareSheet } from "../home/HomeShareSheet";
import { HOME_BANNERS, type HomeBannerDef } from "../home/homeBanners";
import { BANNER_SCREENS } from "../home/bannerScreens";
import { StartChecklist } from "../home/StartChecklist";
import StatusBadge from "../../components/ui/StatusBadge";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconMap,
  IconMic,
  IconShare,
  IconUserFill,
  LogoRice,
} from "../../components/ui/icons";

/**
 * ランディング兼常設ホーム（Issue #72、オーナー方針: 2026-07-16再考）。
 * 未ログイン/ログインを問わず「/」がアプリの唯一の顔であり、起動のたびに経由する。
 * ログイン状態で内容だけを出し分け、ページとしては分けない（旧/homeは/へ統合・redirect化）。
 * マップは「アプリ最大の機能」であって入口ではないため、常設の既定着地・start_url・
 * ロゴタップ先はすべて「/」に統一している。
 */

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/** ヒーロー右のスマホモックアップ + 浮遊チップ（装飾。実写ではなくUIの雰囲気を伝える添え物のため据え置き） */
function HeroPhone() {
  return (
    <div className="relative mx-auto w-52 sm:w-60 md:w-64">
      <PhoneFrame className="animate-float-y-slow">
        <MapMockup className="h-full w-full" />
      </PhoneFrame>
      <div className="absolute -left-20 top-14 hidden animate-float-y rounded-2xl glass-dark px-3 py-2 shadow-xl sm:block">
        <p className="text-[11px] font-bold text-white">⚠️ 東の田・畦崩れ</p>
        <p className="text-[9px] text-white/60">3日経過 — 未対応</p>
      </div>
      <div className="absolute -right-16 bottom-24 hidden animate-float-y rounded-2xl glass-dark px-3 py-2 shadow-xl sm:block" style={{ animationDelay: "1.2s" }}>
        <p className="text-[11px] font-bold text-white">☀️ 中干しの時期</p>
        <p className="text-[9px] text-white/60">水位の記録を残しましょう</p>
      </div>
    </div>
  );
}

const PAINS = [
  { emoji: "🗣️", title: "口頭の伝達は、忘れる", desc: "「東の田、水見といて」— 言った言わないになりがち。大事な異常ほど埋もれます。" },
  { emoji: "❓", title: "どこの田んぼの話か分からない", desc: "電話やメモでは場所が伝わらない。現地に行ってから探すことになります。" },
  { emoji: "📅", title: "去年、いつ何をしたか思い出せない", desc: "田植えも中干しも毎年の勘頼み。記録がなければ知恵は引き継がれません。" },
];

const STEPS = [
  { n: "1", title: "田んぼをなぞって登録", desc: "空中写真の上に指でなぞるだけ。面積も自動で計算されます。" },
  { n: "2", title: "ボタンひとつで記録", desc: "写真・音声・異常報告。畑の真ん中でも数秒で残せます。" },
  { n: "3", title: "家族に自動で届く", desc: "記録はそのまま家族のトークに。離れていても今日の田んぼが分かります。" },
];

export default function LandingScreen() {
  const { loading, session } = useAuth();
  const authed = !loading && !!session;
  // ログイン時のサイト設定取得（グループ確認+署名URL）は数秒かかることがある。
  // 完了を待って画面全体を隠すと起動のたびに空画面になるため、既定スライドで
  // 即時描画し、カスタム画像は取得でき次第差し替える
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});
  const [shareOpen, setShareOpen] = useState(false);
  // 最終CTAの行き先分岐用（田んぼ0枚なら記録より先にマップでの登録に送る）
  const [hasField, setHasField] = useState<boolean | null>(null);
  // 今日のダッシュボード（ログイン時専用）: 田んぼ状態チップ + 最近の記録
  const [attention, setAttention] = useState<FieldAttentionSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [recentThumbs, setRecentThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    // authedが未確定（loading中）の間は呼ばない。ログイン済みの場合だけ
    // includeHomeBanners=trueで呼び、機能バナーの差し替え画像（署名URL）も取得する
    if (loading) return;
    loadSiteContent(authed).then((r) => {
      setSlides(r.slides);
      setImageSlots(r.imageSlots);
    });
  }, [loading, authed]);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    loadFieldAttention().then((summary) => {
      if (cancelled || summary.mode === "anon" || summary.mode === "error") return;
      setHasField(summary.fields.length > 0);
      setAttention(summary);
    });
    loadRecords({ limit: 5 }).then((data) => {
      if (cancelled || data.mode === "anon" || data.mode === "error") return;
      setRecentRecords(data.records);
      setRecentThumbs(data.thumbUrls);
    });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // ログイン後は未ログインのマーケティングコピーと差別化した専用ヒーロー
  // （画像は/menu/siteの「ホームのヒーロー（ログイン後）」で差し替え可能）
  const authedHeroSlide: HeroSlide = {
    image_url: imageSlots.authedHero?.image_url ?? SYSTEM_DEFAULT_IMAGES.authedHero,
    title: "おかえりなさい。",
    body: "今日も田んぼを見に行きましょう。記録も共有もここから始められます。",
  };
  const heroSlides = authed ? [authedHeroSlide] : slides;
  const hero = heroSlides[0];

  const bannerImage = (key: HomeBannerDef["key"]) =>
    imageSlots.homeBanners?.[key]?.image_url ?? SYSTEM_DEFAULT_IMAGES.homeBanners[key];

  // useCallback化: StartChecklistのuseEffect依存に渡すため、毎レンダーで参照が
  // 変わると不要な再フェッチ（loadFieldAttention/loadHasAnyRecord）が走ってしまう
  const handleShare = useCallback(() => setShareOpen(true), []);

  /** 田んぼ状態チップ（issue > needs_check > normal の優先順で信号色を出す） */
  const fieldChips =
    attention?.fields.map((f) => {
      const a = attention.attentionFields.find((af) => af.id === f.id);
      const status: "issue" | "needs_check" | "normal" = a?.issueCount
        ? "issue"
        : a?.needsCheckCount
          ? "needs_check"
          : "normal";
      return { id: f.id, name: f.name, status };
    }) ?? [];

  /**
   * ログイン後専用の「今日のダッシュボード」（設計原則: モード分離）。
   * 田んぼ状態チップ・記録ボタン・最近の記録のみで構成し、課題提起・機能紹介などの
   * LP要素は含めない（未ログイン時のみ下のセクションで表示する）。
   */
  const todayDashboard = (
    <div className="mt-8 space-y-4">
      {fieldChips.length > 0 ? (
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {fieldChips.map((f) => (
            <Link
              key={f.id}
              href={`/fields/${encodeURIComponent(f.id)}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full glass-dark px-3.5 py-2 text-xs font-bold text-white transition-transform active:scale-95"
            >
              <StatusBadge status={f.status} dark className="border-0 bg-transparent px-0 py-0" />
              {f.name || "名前のない田んぼ"}
            </Link>
          ))}
        </div>
      ) : (
        hasField === false && (
          <Link
            href="/map?register=1"
            className="flex items-center justify-between gap-2 rounded-2xl glass-dark px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            まずは田んぼを登録しましょう
            <IconChevronRight className="h-4 w-4" />
          </Link>
        )
      )}

      <div className="flex gap-2">
        <Link
          href="/records/new?returnTo=%2Frecords"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] transition-colors hover:bg-emerald-400 active:scale-[0.98]"
        >
          <IconCamera className="h-4.5 w-4.5" />
          今日の記録を残す
        </Link>
        {hasField === true && (
          <button
            type="button"
            onClick={handleShare}
            aria-label="共有する"
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-full glass-dark px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            <IconShare className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {recentRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-0.5 pb-1.5">
            <p className="text-xs font-bold text-white/70">最近の記録</p>
            <Link href="/records" className="text-xs font-semibold text-emerald-300">
              すべて見る
            </Link>
          </div>
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {recentRecords.map((r) => (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="w-32 shrink-0 overflow-hidden rounded-2xl glass-dark transition-transform active:scale-95"
              >
                <div className="h-20 w-full">
                  <RecordThumb media={r.media} thumbUrl={recentThumbs[r.id]} className="h-full w-full" />
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-[11px] font-bold text-white">{r.title}</p>
                  <p className="truncate text-[10px] text-white/50">{r.fieldName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 説明（バナー1〜5）と同じ順で「次にやること」へ誘導する、唯一の案内レイヤー */}
      <StartChecklist onShareClick={hasField ? handleShare : undefined} />
    </div>
  );

  return (
    <main className="min-h-dvh bg-[#050d09] text-white">
      {/* ===== ヘッダー（ログイン状態で右側だけ出し分け） ===== */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow">
            <LogoRice className="h-5.5 w-5.5" />
          </span>
          <span className="text-sm font-bold tracking-wide text-white drop-shadow">みらい稲作管理</span>
          {authed ? (
            <Link
              href="/menu"
              aria-label="アカウント・設定"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full glass-dark text-white transition-colors hover:bg-white/15"
            >
              <IconUserFill className="h-4.5 w-4.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-auto rounded-full glass-dark px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
            >
              ログイン
            </Link>
          )}
        </div>
      </header>

      {/* ===== ヒーロー ===== */}
      <section className="relative overflow-hidden">
        <HeroBackdrop slides={heroSlides} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-24 md:grid-cols-2 md:items-center md:gap-6 md:pb-24 md:pt-32">
          {/* min-w-0: 中のクイックアクセス帯（横スクロール）がグリッド列の最小幅を
              押し広げてページ全体が横にはみ出すのを防ぐ（実機で右側が切れる不具合の原因） */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                家族ではじめる、田んぼのOS
              </span>
            </div>
            <h1 className="text-[2.3rem] font-bold leading-[1.16] tracking-tight drop-shadow-xl md:text-5xl">
              {hero?.title ?? (
                <>
                  田んぼの&ldquo;今&rdquo;が、
                  <br />
                  家族みんなに届く。
                </>
              )}
            </h1>
            <p className="mt-5 max-w-[24rem] text-[15px] leading-relaxed text-white/80">
              {hero?.body ??
                "空中写真の地図に自分の田んぼを登録して、写真と声で記録。異常も水位も農事暦も、開いた瞬間にわかります。"}
            </p>

            {authed ? (
              todayDashboard
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:max-w-sm">
                <Link
                  href="/login"
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 py-4 text-base font-bold text-white shadow-[0_10px_40px_-8px_rgba(16,185,129,0.8)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  無料ではじめる
                  <IconChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/guide"
                  className="flex w-full items-center justify-center gap-2 rounded-full glass-dark py-4 text-base font-bold text-white transition-colors hover:bg-white/15"
                >
                  使い方を見る
                </Link>
              </div>
            )}

            {/* 信頼チップ（未ログイン時のみのLP要素） */}
            {!authed && (
            <div className="mt-8 flex flex-wrap gap-2">
              {["国土地理院の空中写真", "家族と無料で共有", "アプリのように使えるPWA"].map((t) => (
                <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/75">
                  {t}
                </span>
              ))}
            </div>
            )}
          </div>

          <HeroPhone />
        </div>
      </section>

      {/* ===== 課題提起（未ログイン時のみのLP要素） ===== */}
      {!authed && (
      <section className="relative bg-[#f6f8f4] py-16 text-gray-900 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div {...reveal}>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Problem</span>
            </div>
            <h2 className="max-w-2xl text-2xl font-bold leading-snug tracking-tight md:text-3xl">
              家族の稲作、こんな困りごとはありませんか
            </h2>
          </motion.div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PAINS.map((p, i) => (
              <motion.div
                key={p.title}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]"
              >
                <span className="text-3xl">{p.emoji}</span>
                <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ===== 機能5件（実写+アコーディオン。利用の流れの順に並べる。未ログイン時のみのLP要素） ===== */}
      {!authed && (
      <section className="bg-white py-16 text-gray-900 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div {...reveal}>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Features</span>
            </div>
            <h2 className="max-w-2xl text-2xl font-bold leading-snug tracking-tight md:text-3xl">
              見る・記録する・伝える・振り返る。<br className="md:hidden" />
              アプリでできること
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              タップすると詳しい説明がひらきます。番号は実際に使う流れの順番です。
            </p>
          </motion.div>

          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {HOME_BANNERS.map((def, i) => (
              <motion.div key={def.key} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
                <FeatureBanner
                  def={def}
                  imageUrl={bannerImage(def.key)}
                  onShare={handleShare}
                  step={i + 1}
                  screens={BANNER_SCREENS[def.key]}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ===== 使い方 3ステップ（初めての方向け。ログイン済みでは表示しない） ===== */}
      {!authed && (
        <section className="bg-[#0b1811] py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <motion.div {...reveal}>
              <div className="mb-2 flex items-center gap-3">
                <span className="h-px w-8 bg-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">How it works</span>
              </div>
              <h2 className="text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
                はじめるのは、3ステップ
              </h2>
            </motion.div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: i * 0.08 }}
                  className="rounded-3xl glass-dark p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 最終CTA（未ログイン時のみのLP要素） ===== */}
      {!authed && (
        <section className="bg-[#050d09] px-6 py-16 md:py-24">
          <motion.div
            {...reveal}
            className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-green-800 px-6 py-12 text-center md:px-12 md:py-16"
          >
            <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-400/30 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-lime-300/20 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex justify-center gap-3 text-white/90">
                <IconCamera className="h-6 w-6" />
                <IconMic className="h-6 w-6" />
                <IconMap className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">今日の田んぼを、記録してみませんか</h2>
              <p className="mx-auto mt-3 max-w-[20rem] text-sm leading-relaxed text-emerald-100">
                はじめるのはかんたん。まずは一枚の写真から。
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-9 py-4 text-base font-bold text-green-800 shadow-xl transition-transform active:scale-95"
              >
                無料ではじめる
                <IconChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
          <p className="mt-10 text-center text-xs text-white/40">みらい稲作管理 — 未来へつなぐ、農の記録</p>
        </section>
      )}

      {/* ログイン時は空の帯を作らず、軽いフッターのみ */}
      {authed && (
        <p className="bg-[#050d09] py-6 text-center text-xs text-white/40">
          みらい稲作管理 — 未来へつなぐ、農の記録
        </p>
      )}

      <HomeShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </main>
  );
}
