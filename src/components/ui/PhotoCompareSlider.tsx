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
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPercent((p) => Math.max(0, p - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPercent((p) => Math.min(100, p + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPercent(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPercent(100);
    }
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

      <span className="absolute left-2 top-2 max-w-[45%] truncate rounded-md bg-black/55 px-2 py-1 text-[11px] font-bold text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-2 top-2 max-w-[45%] truncate rounded-md bg-black/55 px-2 py-1 text-[11px] font-bold text-white">
        {afterLabel}
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${beforeLabel}と${afterLabel}の比較位置`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${Math.round(percent)}%`}
        onKeyDown={handleKeyDown}
        className="absolute inset-y-0 flex w-8 -translate-x-1/2 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
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
