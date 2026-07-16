"use client";

import { useEffect, useState } from "react";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconPause, IconPlayFill } from "../../components/ui/icons";

export type ScreenStep = {
  /** アプリ実画面のスクリーンショットURL（縦長390x844想定） */
  src: string | undefined;
  /** そのステップで何をしているかの短い説明 */
  caption: string;
};

const STEP_MS = 2800;

/**
 * アプリ実画面を数枚のステップとして自動再生する説明プレイヤー（ホーム・ガイド共用）。
 * 動画ファイルを使わず、実画面スクリーンショットのクロスフェード+キャプション切替で
 * 「動きのある説明」を実現する（容量が軽く、prefers-reduced-motionにも対応できる）。
 * タップ/ボタンで一時停止・手動送りが可能。
 */
export function ScreenSequence({ steps, className = "" }: { steps: ScreenStep[]; className?: string }) {
  const total = steps.length;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), STEP_MS);
    return () => clearTimeout(t);
  }, [current, playing, total]);

  if (total === 0) return null;
  const step = steps[current];

  return (
    <div className={className}>
      {/* スマホ枠風の実画面表示（縦長スクショの上部を見せる） */}
      <div className="relative mx-auto aspect-[39/60] w-full max-w-[13rem] overflow-hidden rounded-[1.4rem] border-4 border-gray-800 bg-gray-100 shadow-lg">
        {steps.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <RemotePhoto src={s.src} alt={s.caption} className="absolute inset-0 h-full w-full object-cover object-top" fallbackVariant="field" />
          </div>
        ))}
      </div>

      {/* キャプション（高さ固定でジャンプ防止） */}
      <p className="mx-auto mt-2 flex min-h-[2.5rem] max-w-[16rem] items-center justify-center text-center text-xs font-semibold leading-snug text-gray-700">
        {step.caption}
      </p>

      {/* ステップドット + 一時停止 */}
      {total > 1 && (
        <div className="mt-1 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setCurrent(i); setPlaying(false); }}
                aria-label={`ステップ${i + 1}: ${s.caption}`}
                aria-current={i === current}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-green-700" : "w-1.5 bg-gray-300"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "自動再生を止める" : "自動再生を再開する"}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            {playing ? <IconPause className="h-3.5 w-3.5" /> : <IconPlayFill className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
