"use client";

import { useCallback, useRef, useState } from "react";
import { RemotePhoto } from "./RemotePhoto";
import { IconSliders } from "./icons";

type Props = {
  beforeUrl?: string;
  afterUrl?: string;
  beforeLabel: string;
  afterLabel: string;
  className?: string;
};

/**
 * 定点観測タイムマシン（田んぼOS レイヤー5）の比較スライダー。
 * 同じ地点の「以前」「今」の写真を1枚の枠に重ね、ドラッグで境界を動かして見比べる。
 */
export default function PhotoCompareSlider({ beforeUrl, afterUrl, beforeLabel, afterLabel, className }: Props) {
  const [percent, setPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.max(0, Math.min(100, ratio)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-gray-100 ${className ?? ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <RemotePhoto src={afterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" fallbackVariant="field" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
      >
        <RemotePhoto src={beforeUrl} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" fallbackVariant="field" />
      </div>

      <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-bold text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-bold text-white">
        {afterLabel}
      </span>

      <div
        className="absolute inset-y-0 flex w-8 -translate-x-1/2 items-center justify-center"
        style={{ left: `${percent}%` }}
      >
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/90 shadow" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          <IconSliders className="h-4 w-4 text-green-700" />
        </span>
      </div>
    </div>
  );
}
