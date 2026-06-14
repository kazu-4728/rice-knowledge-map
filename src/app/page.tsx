"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { PaddyPhoto } from "../components/ui/PaddyPhoto";
import { IconChevronRight, LogoRice } from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;

/** スプラッシュの大胆なKen Burns — 毎スライドで方向と緩急を変える */
const KB_CLASSES = [
  "animate-splash-kb-a",
  "animate-splash-kb-b",
  "animate-splash-kb-c",
] as const;

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

  // 自動送り（全スライドは常にDOMに載せてクロスフェードするので、indexだけ進める）
  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [current, total]);

  // プログレスバー（RAFで残り時間を表現）
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
      {/* 背景: スライドを重ねて opacity でクロスフェード。各レイヤーは大胆にズーム＋パンし続ける */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* 画像とフォールバックをまとめてKen Burns（実画像が無くても動きが出る） */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
        </div>
      ))}

      {/* 前景: 見出し（大胆に登場）・インジケーター・CTA */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-5 px-7 pb-12 pt-28">
        {/* 見出し（スライドごとに再生。translateY＋scale＋blur解除で大胆に） */}
        <div key={`text-${current}`}>
          <h2 className="animate-splash-title text-center text-3xl font-bold leading-tight text-white drop-shadow-xl">
            {slide.title}
          </h2>
          <p
            className="animate-splash-sub mt-3 text-center text-sm leading-relaxed text-white/85 drop-shadow"
            style={{ animationDelay: "0.18s" }}
          >
            {slide.body}
          </p>
        </div>

        {/* インジケーター + プログレスバー */}
        {total > 1 && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-7 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`スライド ${i + 1}`}
                />
              ))}
            </div>
            <div className="h-0.5 w-28 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/70"
                style={{ width: `${progress * 100}%`, transition: progress === 0 ? "none" : "width 80ms linear" }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            transitionDelay: "0.5s",
          }}
        >
          <button
            onClick={onEnter}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-base font-bold text-white shadow-2xl transition-all hover:bg-green-500 active:scale-95"
          >
            アプリへ入る
            <IconChevronRight className="h-5 w-5" />
          </button>
          <p className="mt-3 text-center text-xs text-white/55">田んぼの記録と知恵を、次の世代へ</p>
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
      // スライド画像を先読みして、表示時にアニメ・写真がすぐ出るようにする
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

      {/* ロゴ（上部・大胆に登場） */}
      <div
        className="absolute left-0 right-0 top-14 z-20 flex flex-col items-center gap-2"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0) scale(1)" : "translateY(16px) scale(0.92)",
          transition: "opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.22,1,0.36,1)",
          transitionDelay: "0.05s",
        }}
      >
        <LogoRice className="h-16 w-16 text-white drop-shadow-lg" />
        <span className="text-xl font-bold tracking-tight text-white drop-shadow-lg">みらい稲作管理</span>
      </div>
    </div>
  );
}
