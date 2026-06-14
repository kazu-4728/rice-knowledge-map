"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { PaddyPhoto } from "../components/ui/PaddyPhoto";
import {
  IconCamera,
  IconChevronRight,
  IconCommentFill,
  IconMap,
  IconMic,
  IconPinFill,
  LogoRice,
} from "../components/ui/icons";

const KB_CLASSES = ["animate-splash-kb-a", "animate-splash-kb-b", "animate-splash-kb-c"] as const;

const FEATURES = [
  {
    icon: <IconCamera className="h-5 w-5 text-green-700" />,
    title: "写真・音声でその場で記録",
    desc: "田んぼの様子をカメラと声でかんたんに記録。両手がふさがっていても残せます。",
  },
  {
    icon: <IconMap className="h-5 w-5 text-green-700" />,
    title: "国土地理院の空中写真マップ",
    desc: "実際の空中写真の上に自分の田んぼをなぞって登録。入水口や異常箇所をピンで管理。",
  },
  {
    icon: <IconCommentFill className="h-5 w-5 text-green-700" />,
    title: "家族みんなで共有・継承",
    desc: "記録にコメントを付けて対応を共有。今年の記録が来年の判断を助け、知恵を次世代へ。",
  },
];

/** ヒーロー背景: 実写真を大きくズーム＋パンし、スクロールで奥へ流れるパララックス */
function HeroBackdrop({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearTimeout(t);
  }, [current, total]);

  // スクロール連動パララックス（背景は遅れて動き、奥行きが出る）
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        transform: `translateY(${scrollY * 0.4}px) scale(1.05)`,
        opacity: Math.max(0, 1 - scrollY / 700),
        willChange: "transform",
      }}
    >
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <div className={`absolute inset-0 ${i === current ? KB_CLASSES[i % 3] : ""}`}>
            <PaddyPhoto variant="field" className="absolute inset-0 h-full w-full object-cover" />
            {s.image_url && (
              // eslint-disable-next-line @next/next/no-img-element -- ヒーロー画像（外部/署名URL）はnext/imageを使わない
              <img
                src={s.image_url}
                alt=""
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      ))}
      {/* スクリム */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSiteContent().then((r) => {
      setSlides(r.slides);
      r.slides.forEach((s) => {
        if (s.image_url) {
          const img = new Image();
          img.src = s.image_url;
        }
      });
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  const enter = () => {
    sessionStorage.setItem("app_entered", "1");
    router.push("/home");
  };

  const hero = slides[0];

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-white">
      {/* ===== ヒーローセクション ===== */}
      <section className="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden">
        <HeroBackdrop slides={slides} />

        {/* 上部: ロゴ */}
        <header className="relative z-10 flex items-center gap-2 px-6 pt-6">
          <LogoRice className="h-7 w-7 text-white drop-shadow" />
          <span className="text-sm font-bold tracking-wide text-white drop-shadow">みらい稲作管理</span>
        </header>

        {/* 中央〜下: 見出し・CTA */}
        <div
          className="relative z-10 mt-auto px-6 pb-14"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-green-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-300">
              農業 × テクノロジー
            </span>
          </div>
          <h1 className="text-[2.2rem] font-bold leading-[1.18] tracking-tight text-white drop-shadow-xl">
            {hero?.title ?? "家族の田んぼを、みんなで守る"}
          </h1>
          <p className="mt-4 max-w-[21rem] text-[15px] leading-relaxed text-white/85 drop-shadow">
            {hero?.body ?? "水・土・稲の様子を写真と音声で記録。離れていても今日の田んぼが分かります。"}
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <button
              onClick={enter}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-green-500 py-4 text-base font-bold text-white shadow-[0_10px_40px_-8px_rgba(34,197,94,0.7)] transition-all hover:bg-green-400 active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              アプリをはじめる
              <IconChevronRight className="h-5 w-5" />
            </button>
            <Link
              href="/guide"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 py-4 text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              使い方を見る
            </Link>
          </div>

          {/* スクロール誘導 */}
          <div className="mt-8 flex flex-col items-center gap-1 text-white/55">
            <span className="text-[11px] tracking-wide">できることを見る</span>
            <IconChevronRight className="h-4 w-4 rotate-90 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== 機能セクション ===== */}
      <section className="px-6 py-14">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-green-600" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-700">Features</span>
        </div>
        <h2 className="text-2xl font-bold leading-snug tracking-tight text-gray-900">
          稲作の知恵を、デジタルで次の世代へ
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          家族みんなで田んぼの記録を共有し、毎日の判断と世代を超えた継承を支えるアプリです。
        </p>

        <div className="mt-8 space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">{f.icon}</span>
              <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== フッターCTA ===== */}
      <section className="px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-green-700 px-6 py-10 text-center">
          <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/30 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex justify-center gap-2 text-white/90">
              <IconCamera className="h-5 w-5" />
              <IconMic className="h-5 w-5" />
              <IconPinFill className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">今日の田んぼを、記録してみませんか</h2>
            <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-green-100">
              はじめるのはかんたん。まずは一枚の写真から。
            </p>
            <button
              onClick={enter}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-green-800 shadow-lg transition-transform active:scale-95"
            >
              アプリをはじめる
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">みらい稲作管理 — 未来へつなぐ、農の記録</p>
      </section>
    </main>
  );
}
