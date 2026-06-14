"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { PaddyPhoto } from "../components/ui/PaddyPhoto";
import {
  IconCamera,
  IconChevronRight,
  IconCommentFill,
  IconMap,
  LogoRice,
} from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;

/** Ken Burnsアニメーション — 毎スライドで方向を変える */
const KB_CLASSES = [
  "animate-ken-burns-right",
  "animate-ken-burns-left",
  "animate-ken-burns-up",
] as const;

/** 入口で「このアプリで何ができるか」を一目で伝える機能ハイライト */
const FEATURES = [
  { icon: <IconCamera className="h-4.5 w-4.5 text-white" />, label: "写真・音声でその場ですぐ記録" },
  { icon: <IconMap className="h-4.5 w-4.5 text-white" />, label: "国土地理院の空中写真マップ" },
  { icon: <IconCommentFill className="h-4.5 w-4.5 text-white" />, label: "家族みんなで共有して次世代へ" },
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
  // 読み込み完了したスライドのindex。Ken Burnsは画像ロード後に開始する（先に動き切るのを防ぐ）
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
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
      {/* 背景: スライドを重ねて opacity でクロスフェード（残留レイヤーが出ない） */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* フォールバック（画像が遅延/失敗しても黒画面にしない） */}
          <PaddyPhoto variant="field" className="absolute inset-0 h-full w-full object-cover" />
          {s.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- ヒーロー画像（外部/署名URL）はnext/imageを使わない
            <img
              src={s.image_url}
              alt={s.title}
              decoding="async"
              onLoad={() => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === current && loaded.has(i) ? KB_CLASSES[i % 3] : ""
              }`}
              style={{ opacity: loaded.has(i) ? 1 : 0 }}
            />
          )}
        </div>
      ))}

      {/* 前景パネル: 下部にまとめて、見出し・機能・CTAを1つの構成にする */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-6 pb-10 pt-24">
        {/* インジケーター + プログレスバー */}
        {total > 1 && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`スライド ${i + 1}`}
                />
              ))}
            </div>
            <div className="h-0.5 w-24 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/70"
                style={{ width: `${progress * 100}%`, transition: progress === 0 ? "none" : "width 80ms linear" }}
              />
            </div>
          </div>
        )}

        {/* 見出し（スライドごとにフェードイン） */}
        <div key={`text-${current}`}>
          <h2
            className="animate-rise text-center text-2xl font-bold leading-snug text-white drop-shadow-lg"
            style={{ animationDelay: "0.05s", animationFillMode: "both" }}
          >
            {slide.title}
          </h2>
          <p
            className="animate-rise mt-2 text-center text-sm leading-relaxed text-white/85 drop-shadow"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            {slide.body}
          </p>
        </div>

        {/* 機能ハイライト（フロスト化カード） */}
        <ul
          className="animate-rise space-y-2.5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
          style={{ animationDelay: "0.35s", animationFillMode: "both" }}
        >
          {FEATURES.map((f) => (
            <li key={f.label} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/80">
                {f.icon}
              </span>
              <span className="text-sm font-semibold text-white/95">{f.label}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            transitionDelay: "0.45s",
          }}
        >
          <button
            onClick={onEnter}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-2xl transition-all hover:bg-green-500 active:scale-95"
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

      {/* ロゴ（上部） */}
      <div
        className="absolute left-0 right-0 top-12 z-20 flex flex-col items-center gap-2"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
          transitionDelay: "0.05s",
        }}
      >
        <LogoRice className="h-14 w-14 text-white drop-shadow-lg" />
        <span className="text-xl font-bold tracking-tight text-white drop-shadow-lg">みらい稲作管理</span>
      </div>
    </div>
  );
}
