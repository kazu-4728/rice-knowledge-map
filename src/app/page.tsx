"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { RemotePhoto } from "../components/ui/RemotePhoto";
import { IconChevronRight, LogoRice } from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;
const TRANSITION_MS = 700;

const KEN_BURNS_CLASSES = [
  "animate-ken-burns-right",
  "animate-ken-burns-left",
  "animate-ken-burns-up",
] as const;

function SplashHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<{ start: number; raf: number } | null>(null);
  const total = slides.length;

  const startProgress = () => {
    if (progressRef.current) cancelAnimationFrame(progressRef.current.raf);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / SLIDE_INTERVAL_MS, 1);
      setProgress(p);
      if (p < 1 && progressRef.current) {
        progressRef.current.raf = requestAnimationFrame(tick);
      }
    };
    progressRef.current = { start, raf: requestAnimationFrame(tick) };
  };

  useEffect(() => {
    startProgress();
    return () => { if (progressRef.current) cancelAnimationFrame(progressRef.current.raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setTimeout(() => {
      const nextIdx = (current + 1) % total;
      setPrev(current);
      setTransitioning(true);
      setProgress(1);
      setTimeout(() => {
        setCurrent(nextIdx);
        setPrev(null);
        setTransitioning(false);
      }, TRANSITION_MS);
    }, SLIDE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [current, total]);

  const goTo = (i: number) => {
    if (i === current) return;
    setPrev(current);
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(i);
      setPrev(null);
      setTransitioning(false);
    }, TRANSITION_MS);
  };

  const slide = slides[current];
  const prevSlide = prev !== null ? slides[prev] : null;
  if (!slide) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 前のスライド（フェードアウト） */}
      {prevSlide && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}>
          <RemotePhoto
            src={prevSlide.image_url}
            alt={prevSlide.title}
            className={`h-full w-full object-cover ${KEN_BURNS_CLASSES[prev! % 3]}`}
            fallbackVariant={prev! % 2 === 0 ? "field" : "water"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/75" />
        </div>
      )}

      {/* 現在のスライド（フェードイン） */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}>
        <RemotePhoto
          key={`img-${current}`}
          src={slide.image_url}
          alt={slide.title}
          className={`h-full w-full object-cover ${KEN_BURNS_CLASSES[current % 3]}`}
          fallbackVariant={current % 2 === 0 ? "field" : "water"}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/75" />
      </div>

      {/* テキスト（時間差フェードイン） */}
      <div
        key={`text-${current}`}
        className={`absolute bottom-44 left-0 right-0 px-8 transition-opacity duration-500 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        <h2
          className="text-2xl font-bold leading-snug text-white drop-shadow-lg text-center animate-rise"
          style={{ animationDelay: "0.15s" }}
        >
          {slide.title}
        </h2>
        <p
          className="mt-2.5 text-sm leading-relaxed text-white/85 drop-shadow text-center animate-rise"
          style={{ animationDelay: "0.35s" }}
        >
          {slide.body}
        </p>
      </div>

      {/* インジケーター＋プログレスバー */}
      {total > 1 && (
        <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-2.5">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"}`}
                aria-label={`スライド ${i + 1}`}
              />
            ))}
          </div>
          <div className="w-28 h-0.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/75 rounded-full"
              style={{ width: `${progress * 100}%`, transition: progress === 0 ? "none" : "width 0.1s linear" }}
            />
          </div>
        </div>
      )}
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
      setTimeout(() => setReady(true), 100);
    });
  }, [router]);

  const enter = () => {
    sessionStorage.setItem("app_entered", "1");
    router.push("/home");
  };

  return (
    <div className="relative flex h-dvh max-w-md mx-auto flex-col items-center justify-end overflow-hidden bg-black">
      {slides && <SplashHero slides={slides} />}

      {/* ロゴ（時間差で浮上） */}
      <div
        className={`absolute top-14 left-0 right-0 flex flex-col items-center gap-2 z-10 animate-rise transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ animationDelay: "0.05s" }}
      >
        <LogoRice className="w-14 h-14 text-white drop-shadow-lg" />
        <span className="text-white font-bold text-xl tracking-tight drop-shadow-lg">みらい稲作管理</span>
      </div>

      {/* 入るボタン（最後に浮上） */}
      <div
        className={`relative z-10 w-full px-8 pb-16 animate-rise transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ animationDelay: "0.55s" }}
      >
        <button
          onClick={enter}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600/90 backdrop-blur-sm py-4.5 text-base font-bold text-white shadow-xl transition-all hover:bg-green-500/90 active:scale-95"
        >
          アプリへ入る
          <IconChevronRight className="h-5 w-5" />
        </button>
        <p className="mt-3 text-center text-xs text-white/55">田んぼの記録と知恵を、次の世代へ</p>
      </div>
    </div>
  );
}
