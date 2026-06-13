"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { PaddyPhoto } from "../components/ui/PaddyPhoto";
import { IconChevronRight, LogoRice } from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;
const TRANSITION_MS = 800;

/** Ken Burnsアニメーション — 毎スライドで方向を変える */
const KB_CLASSES = [
  "animate-ken-burns-right",
  "animate-ken-burns-left",
  "animate-ken-burns-up",
] as const;

function SplashHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);         // 表示中のスライド
  const [leaving, setLeaving] = useState<number | null>(null);  // フェードアウト中のスライド
  const [leavingVisible, setLeavingVisible] = useState(false);  // overlayの透明度
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());
  const total = slides.length;

  /** プログレスバーをRAFでアニメーション */
  const startProgress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    startRef.current = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - startRef.current) / SLIDE_INTERVAL_MS, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    startProgress();
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, startProgress]);

  /** スライドを nextIdx に進める */
  const advanceTo = useCallback((nextIdx: number) => {
    setCurrent((prev) => {
      setLeaving(prev);        // 古いスライドをoverlay へ
      setLeavingVisible(true); // overlay は最初 opacity-100
      // 1フレーム後に opacity-0 を適用してフェードアウト開始
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setLeavingVisible(false))
      );
      // フェード完了後にoverlayを消す
      setTimeout(() => setLeaving(null), TRANSITION_MS + 50);
      return nextIdx;
    });
  }, []);

  /** 自動送り */
  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => advanceTo((current + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [current, total, advanceTo]);

  const slide = slides[current];
  const leaveSlide = leaving !== null ? slides[leaving] : null;
  if (!slide) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ベースレイヤー: 新しいスライド（常に表示、Kenバーンズで動く） */}
      <div className="absolute inset-0">
        <PaddyPhoto variant="field" className="absolute inset-0 h-full w-full object-cover" />
        {slide.image_url && (
          <img
            key={`base-${current}`}
            src={slide.image_url}
            alt={slide.title}
            className={`absolute inset-0 h-full w-full object-cover ${KB_CLASSES[current % 3]}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/80" />
      </div>

      {/* オーバーレイ: 古いスライド（フェードアウト） */}
      {leaveSlide && (
        <div
          className="absolute inset-0 z-10"
          style={{
            opacity: leavingVisible ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          }}
        >
          <PaddyPhoto variant="field" className="absolute inset-0 h-full w-full object-cover" />
          {leaveSlide.image_url && (
            <img
              key={`leave-${leaving}`}
              src={leaveSlide.image_url}
              alt={leaveSlide.title}
              className={`absolute inset-0 h-full w-full object-cover ${KB_CLASSES[leaving! % 3]}`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/80" />
        </div>
      )}

      {/* テキスト（スライドと独立してフェードイン） */}
      <div
        key={`text-${current}`}
        className="absolute bottom-44 left-0 right-0 z-20 px-8"
      >
        <h2
          className="text-center text-2xl font-bold leading-snug text-white drop-shadow-lg animate-rise"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          {slide.title}
        </h2>
        <p
          className="mt-3 text-center text-sm leading-relaxed text-white/85 drop-shadow animate-rise"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          {slide.body}
        </p>
      </div>

      {/* インジケーター + プログレスバー */}
      {total > 1 && (
        <div className="absolute bottom-32 left-0 right-0 z-20 flex flex-col items-center gap-3">
          <div className="flex gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => advanceTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-7 bg-white" : "w-1.5 bg-white/40"
                }`}
                aria-label={`スライド ${i + 1}`}
              />
            ))}
          </div>
          <div className="w-32 h-0.5 rounded-full overflow-hidden bg-white/20">
            <div
              className="h-full bg-white/70 rounded-full"
              style={{
                width: `${progress * 100}%`,
                transition: progress === 0 ? "none" : "width 80ms linear",
              }}
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
      setTimeout(() => setReady(true), 80);
    });
  }, [router]);

  const enter = () => {
    sessionStorage.setItem("app_entered", "1");
    router.push("/home");
  };

  return (
    <div className="relative flex h-dvh max-w-md mx-auto flex-col items-center justify-end overflow-hidden bg-black">
      {slides && <SplashHero slides={slides} />}

      {/* ロゴ */}
      <div
        className="absolute top-12 left-0 right-0 z-20 flex flex-col items-center gap-2"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "0.05s",
        }}
      >
        <LogoRice className="w-14 h-14 text-white drop-shadow-lg" />
        <span className="text-white font-bold text-xl tracking-tight drop-shadow-lg">みらい稲作管理</span>
      </div>

      {/* 入るボタン */}
      <div
        className="relative z-20 w-full px-8 pb-16"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "0.5s",
        }}
      >
        <button
          onClick={enter}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600/90 backdrop-blur-sm py-5 text-base font-bold text-white shadow-2xl transition-all hover:bg-green-500/95 active:scale-95"
        >
          アプリへ入る
          <IconChevronRight className="h-5 w-5" />
        </button>
        <p className="mt-3 text-center text-xs text-white/50">田んぼの記録と知恵を、次の世代へ</p>
      </div>
    </div>
  );
}
