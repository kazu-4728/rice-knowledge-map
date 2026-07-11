"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "../auth/useAuth";
import { loadSiteContent, type HeroSlide } from "../../lib/data/siteContent";
import HeroBackdrop from "./HeroBackdrop";
import { MapMockup, TalkMockup, DashboardMockup, StoryMockup, PhoneFrame } from "./mockups";
import {
  IconCamera,
  IconChevronRight,
  IconChat,
  IconHome,
  IconMap,
  IconMic,
  LogoRice,
} from "../../components/ui/icons";

/**
 * ランディングページ（未ログインの入口）。
 * 実写スライド（/menu/site でユーザーが差し替え可能）が読み込めれば重ね、
 * 読み込めない環境でもシネマティックなダーク背景+実UIのスマホモックアップで
 * リッチに見せる（外部画像に依存しない）。
 */

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/** ヒーロー右のスマホモックアップ + 浮遊チップ */
function HeroPhone() {
  return (
    <div className="relative mx-auto w-52 sm:w-60 md:w-64">
      <PhoneFrame className="animate-float-y-slow">
        <MapMockup className="h-full w-full" />
      </PhoneFrame>
      {/* 浮遊する通知チップ */}
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
  const router = useRouter();
  const { loading, session } = useAuth();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/map");
    }
  }, [loading, session, router]);

  useEffect(() => {
    loadSiteContent().then((r) => {
      setSlides(r.slides);
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  const enter = () => router.push("/map");
  const hero = slides[0];

  return (
    <main className="min-h-dvh bg-[#050d09] text-white">
      {/* ===== ヘッダー（ヒーロー上のみ。明るいセクションでは非表示になるようabsolute） ===== */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow">
            <LogoRice className="h-5.5 w-5.5" />
          </span>
          <span className="text-sm font-bold tracking-wide text-white drop-shadow">みらい稲作管理</span>
          <Link
            href="/login"
            className="ml-auto rounded-full glass-dark px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ===== ヒーロー ===== */}
      <section className="relative overflow-hidden">
        <HeroBackdrop slides={slides} />

        <div
          className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-24 md:grid-cols-2 md:items-center md:gap-6 md:pb-24 md:pt-32"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div>
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

            <div className="mt-8 flex flex-col gap-3 sm:max-w-sm">
              <button
                onClick={enter}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 py-4 text-base font-bold text-white shadow-[0_10px_40px_-8px_rgba(16,185,129,0.8)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                無料ではじめる
                <IconChevronRight className="h-5 w-5" />
              </button>
              <Link
                href="/guide"
                className="flex w-full items-center justify-center gap-2 rounded-full glass-dark py-4 text-base font-bold text-white transition-colors hover:bg-white/15"
              >
                使い方を見る
              </Link>
            </div>

            {/* 信頼チップ */}
            <div className="mt-8 flex flex-wrap gap-2">
              {["国土地理院の空中写真", "家族と無料で共有", "アプリのように使えるPWA"].map((t) => (
                <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/75">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <HeroPhone />
        </div>
      </section>

      {/* ===== 課題提起 ===== */}
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

      {/* ===== 3つの空間（機能紹介・交互レイアウト） ===== */}
      <section className="bg-white py-16 text-gray-900 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <motion.div {...reveal}>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Features</span>
            </div>
            <h2 className="max-w-2xl text-2xl font-bold leading-snug tracking-tight md:text-3xl">
              開く・話す・見わたす。<br className="md:hidden" />
              3つの空間で田んぼを守る
            </h2>
          </motion.div>

          <div className="mt-12 space-y-16 md:space-y-24">
            {/* マップ */}
            <motion.div {...reveal} className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <IconMap className="h-4 w-4" /> 開く = マップ
                </span>
                <h3 className="mt-4 text-xl font-bold md:text-2xl">開けば地図。色で田んぼの状態がわかる</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
                  空中写真の上に、自分の田んぼが信号色で光ります。緑は順調、黄色は要確認、赤は異常。
                  「次にやること」も地図がそのまま教えてくれます。
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {["指でなぞるだけの田んぼ登録（面積を自動計算）", "入水口・異常箇所をピンで管理", "1日1回の「今日の田んぼ」ストーリー"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mx-auto flex w-full max-w-sm justify-center gap-4">
                <PhoneFrame className="w-48 sm:w-52">
                  <MapMockup className="h-full w-full" />
                </PhoneFrame>
                <PhoneFrame className="mt-12 hidden w-40 sm:block">
                  <StoryMockup className="h-full w-full" />
                </PhoneFrame>
              </div>
            </motion.div>

            {/* トーク */}
            <motion.div {...reveal} className="grid items-center gap-8 md:grid-cols-2">
              <div className="md:order-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                  <IconChat className="h-4 w-4" /> 話す = トーク
                </span>
                <h3 className="mt-4 text-xl font-bold md:text-2xl">記録がそのまま、家族のトークになる</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
                  写真も音声メモも、家族ひとつのトークルームに時系列で流れます。
                  メッセージには田んぼの名札付き。どこの話か迷いません。
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {["LINEのような吹き出しでやり取り", "田んぼの名札をタップして絞り込み", "音声メモは吹き出しの上でそのまま再生"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mx-auto w-full max-w-sm md:order-1">
                <PhoneFrame className="mx-auto w-52">
                  <TalkMockup className="h-full w-full" />
                </PhoneFrame>
              </div>
            </motion.div>

            {/* 管理 */}
            <motion.div {...reveal} className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  <IconHome className="h-4 w-4" /> 見わたす = 管理
                </span>
                <h3 className="mt-4 text-xl font-bold md:text-2xl">未対応も農事暦も、ひと目で見わたす</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
                  異常の件数、要確認の田んぼ、いまの農作業の時期。
                  大事な数字だけを大きく。迷わず次の行動に移れます。
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {["信号色の状態サマリー", "田起こしから収穫までの農事暦", "カレンダー共有・記録のPDFエクスポート"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mx-auto w-full max-w-sm">
                <PhoneFrame className="mx-auto w-52">
                  <DashboardMockup className="h-full w-full" />
                </PhoneFrame>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 使い方 3ステップ ===== */}
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

      {/* ===== 最終CTA ===== */}
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
            <button
              onClick={enter}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-9 py-4 text-base font-bold text-green-800 shadow-xl transition-transform active:scale-95"
            >
              無料ではじめる
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
        <p className="mt-10 text-center text-xs text-white/40">みらい稲作管理 — 未来へつなぐ、農の記録</p>
      </section>
    </main>
  );
}
