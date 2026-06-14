"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { PaddyPhoto } from "../components/ui/PaddyPhoto";
import { IconChevronRight, LogoRice } from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;

/** シネマティックなKen Burns — 毎スライドで方向と緩急を変える */
const KB_CLASSES = [
  "animate-splash-kb-a",
  "animate-splash-kb-b",
  "animate-splash-kb-c",
] as const;

/** フィルムグレイン（質感）— 低周波ノイズをオーバーレイ */
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function SplashHero({
  slides,
  ready,
  onEnter,
}: {
  slides: HeroSlide[];
  ready: boolean;
  onEnter: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const total = slides.length;

  // 自動送り
  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [current, total]);

  // プログレスバー
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min((Date.now() - start) / SLIDE_INTERVAL_MS, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current]);

  const slide = slides[current];
  if (!slide) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 背景: スライドを重ねて opacity でクロスフェード。各レイヤーはシネマティックにズーム＋パン */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1100ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <div className={`absolute inset-0 ${i === current ? KB_CLASSES[i % 3] : ""}`}>
            <PaddyPhoto variant="field" className="absolute inset-0 h-full w-full object-cover" />
            {s.image_url && (
              // eslint-disable-next-line @next/next/no-img-element -- ヒーロー画像（外部/署名URL）はnext/imageを使わない
              <img
                src={s.image_url}
                alt={s.title}
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              />
            )}
          </div>
          {/* シネマスクリム: 下を濃く、上に余韻 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-transparent" />
        </div>
      ))}

      {/* フィルムグレイン */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.13] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_BG, backgroundSize: "140px 140px" }}
        aria-hidden
      />

      {/* 前景: エディトリアルな見出し・インジケーター・CTA */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-6 px-7 pb-12 pt-32">
        <div key={`text-${current}`}>
          {/* アイブロウ（小見出し＋伸びるアクセント線） */}
          <div className="mb-4 flex items-center gap-3">
            <span className="animate-line-grow h-px w-8 bg-green-400" />
            <span
              className="animate-splash-sub text-[11px] font-semibold uppercase tracking-[0.25em] text-green-300"
              style={{ animationDelay: "0.05s" }}
            >
              稲作 × テクノロジー
            </span>
          </div>

          {/* 見出し: マスク・リビール（行の下からせり上がる） */}
          <div className="overflow-hidden">
            <h2 className="animate-mask-rise text-[2rem] font-bold leading-[1.18] tracking-tight text-white drop-shadow-xl">
              {slide.title}
            </h2>
          </div>

          {/* 補助テキスト */}
          <p
            className="animate-splash-sub mt-4 max-w-[20rem] text-sm leading-relaxed text-white/80 drop-shadow"
            style={{ animationDelay: "0.25s" }}
          >
            {slide.body}
          </p>
        </div>

        {/* インジケーター + プログレス */}
        {total > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-white" : "w-3 bg-white/35"
                  }`}
                  aria-label={`スライド ${i + 1}`}
                />
              ))}
            </div>
            <span className="ml-auto font-mono text-[11px] tabular-nums text-white/45">
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "0.45s",
          }}
        >
          <button
            onClick={onEnter}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-green-500 py-5 text-base font-bold text-white shadow-[0_10px_40px_-8px_rgba(34,197,94,0.7)] transition-all hover:bg-green-400 active:scale-[0.98]"
          >
            {/* 走るハイライト */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            アプリへ入る
            <IconChevronRight className="h-5 w-5" />
          </button>
          <p className="mt-3 text-center text-xs tracking-wide text-white/55">未来へつなぐ、農の記録</p>
        </div>
      </div>
    </div>
  );
}

export default function SplashPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("app_entered") === "1") {
      router.replace("/home");
      return;
    }
    loadSiteContent().then((r) => {
      setSlides(r.slides);
      r.slides.forEach((s) => {
        if (s.image_url) {
          const img = new Image();
          img.src = s.image_url;
        }
      });
      setTimeout(() => setReady(true), 80);
    });
  }, [router]);

  const enter = () => {
    sessionStorage.setItem("app_entered", "1");
    router.push("/home");
  };

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black">
      {slides && <SplashHero slides={slides} ready={ready} onEnter={enter} />}

      {/* ロゴ（上部） */}
      <div
        className="absolute left-0 right-0 top-14 z-20 flex flex-col items-center gap-2.5"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0) scale(1)" : "translateY(14px) scale(0.94)",
          transition: "opacity 0.8s ease-out, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          transitionDelay: "0.05s",
        }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <LogoRice className="h-9 w-9 text-white drop-shadow" />
        </span>
        <span className="text-base font-bold tracking-[0.08em] text-white/95 drop-shadow">みらい稲作管理</span>
      </div>
    </div>
  );
}
