"use client";

import { useEffect, useState } from "react";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import type { HeroSlide } from "../../lib/data/siteContent";

const SLIDE_INTERVAL_MS = 6000;

type Props = {
  slides: HeroSlide[];
};

export default function HeroSection({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % total);
        setTransitioning(false);
      }, 600);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [total]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;

  const imgSrc = slide.image_path
    ? undefined // Storage パスは呼び出し元で署名URL変換済みの場合のみ渡す
    : slide.image_url;

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-md" style={{ height: "56vw", maxHeight: 280, minHeight: 180 }}>
      {/* 背景写真 */}
      <div
        key={current}
        className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        <RemotePhoto
          src={imgSrc}
          alt={slide.title}
          className="h-full w-full object-cover animate-hero-zoom"
          fallbackVariant={current % 2 === 0 ? "field" : "water"}
        />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* テキスト */}
      <div
        key={`text-${current}`}
        className="absolute bottom-0 left-0 right-0 p-4 animate-rise"
      >
        <h2 className="text-base font-bold leading-snug text-white drop-shadow">
          {slide.title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-white/85 drop-shadow">
          {slide.body}
        </p>
      </div>

      {/* ドットインジケーター */}
      {total > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`スライド ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
