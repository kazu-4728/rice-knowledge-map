"use client";

import { useEffect, useState } from "react";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconChevronLeft, IconChevronRight, IconPause, IconPlayFill } from "../../components/ui/icons";
import type { HeroSlide } from "../../lib/data/siteContent";

const AUTO_PLAY_MS = 6000;

/**
 * ホームのヒーロー（Issue #72確定事項8）。
 * ランディング（/）と同じ hero_slides を使い、手動切替・一時停止・
 * prefers-reduced-motion を追加した版。
 */
export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  // 画像が読み込めないスライドもRemotePhotoのフォールバックで表示する
  // （withImagesで絞ると、既定画像が未配置の環境でヒーロー自体が消えてしまうため）
  const list = slides;
  const total = list.length;

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

  if (total === 0) return null;

  const goTo = (i: number) => setCurrent(((i % total) + total) % total);
  const slide = list[current];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0b1811] text-white shadow-[0_16px_40px_-16px_rgba(6,78,59,0.6)]">
      <div className="relative aspect-[4/5] sm:aspect-[16/9]">
        {list.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <RemotePhoto src={s.image_url} alt="" className="h-full w-full object-cover" fallbackVariant="field" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <h2 className="text-xl font-bold leading-snug drop-shadow sm:text-2xl">{slide.title}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85 drop-shadow">{slide.body}</p>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="前のスライド"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="次のスライド"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "スライドの自動切替を止める" : "スライドの自動切替を再開する"}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              {playing ? <IconPause className="h-4 w-4" /> : <IconPlayFill className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 bg-[#0b1811] py-3">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1}枚目のスライドを表示`}
              aria-current={i === current}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-6 bg-emerald-400" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
