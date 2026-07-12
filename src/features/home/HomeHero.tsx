"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconChevronLeft, IconChevronRight, IconPause, IconPlayFill } from "../../components/ui/icons";
import type { HeroSlide } from "../../lib/data/siteContent";

const AUTO_PLAY_MS = 6000;

/**
 * ホームのヒーロー（Issue #72確定事項8）。
 * ランディング（/）と同じ hero_slides のコピー+実写を表示し、
 * 下部に機能クイックアクセス帯（quickAccess）を重ねる。
 * 手動切替（ドット・前後）・一時停止・prefers-reduced-motion に対応する。
 */
export function HomeHero({ slides, quickAccess }: { slides: HeroSlide[]; quickAccess?: ReactNode }) {
  const total = slides.length;

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    setCurrent((c) => (total > 0 && c >= total ? 0 : c));
  }, [total]);

  useEffect(() => {
    if (!playing || total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), AUTO_PLAY_MS);
    return () => clearTimeout(t);
  }, [current, total, playing]);

  const goTo = (i: number) => setCurrent(((i % total) + total) % total);
  const slide = slides[current] as HeroSlide | undefined;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#12281a] shadow-[0_16px_40px_-16px_rgba(6,78,59,0.55)]">
      {/* 背景の実写スライド（クロスフェード） */}
      {total === 0 ? (
        <RemotePhoto src={undefined} alt="" className="absolute inset-0 h-full w-full" fallbackVariant="field" />
      ) : (
        slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <RemotePhoto src={s.image_url} alt="" className="absolute inset-0 h-full w-full" fallbackVariant="field" />
          </div>
        ))
      )}
      {/* 文字の可読性を確保するスクリム */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/55" />

      <div className="relative px-4 pb-3 pt-7 sm:px-7 sm:pt-10">
        {/* コピー（スライドで切り替わる。高さを固定してレイアウトのジャンプを防ぐ） */}
        <div className="min-h-[7.5rem] max-w-md sm:min-h-[6.5rem]">
          <h2 className="whitespace-pre-line font-heading text-[1.65rem] font-bold leading-[1.3] tracking-tight text-white drop-shadow-lg sm:text-3xl">
            {slide?.title}
          </h2>
          <p className="mt-2 max-w-[26rem] text-[13px] leading-relaxed text-white/90 drop-shadow sm:text-sm">
            {slide?.body}
          </p>
        </div>

        {/* 機能クイックアクセス帯（モックのヒーロー内ショートカット） */}
        {quickAccess && <div className="mt-4">{quickAccess}</div>}

        {/* ドットインジケーター + 手動切替 + 一時停止 */}
        {total > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="前のスライド"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}枚目のスライドを表示`}
                  aria-current={i === current}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="次のスライド"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "スライドの自動切替を止める" : "スライドの自動切替を再開する"}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
            >
              {playing ? <IconPause className="h-4 w-4" /> : <IconPlayFill className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
