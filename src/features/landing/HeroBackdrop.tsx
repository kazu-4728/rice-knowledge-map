"use client";

import { useEffect, useState } from "react";
import type { HeroSlide } from "../../lib/data/siteContent";

/** ヒーロー背景: シネマティックなダーク田園（グラデーション）+ 実写スライド（あれば上に重なる） */
export default function HeroBackdrop({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const withImages = slides.filter((s) => s.image_url);
  const total = withImages.length;

  // スライドの編集・削除でtotalが縮んだ際、currentが範囲外に残って
  // 全スライドがopacity: 0になり写真が消えたままにならないよう丸める
  useEffect(() => {
    setCurrent((c) => (total > 0 && c >= total ? 0 : c));
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearTimeout(t);
  }, [current, total]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ベース: 夜明けの田園を思わせるダークグラデーション */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050d09_0%,#0a1a11_45%,#123222_78%,#1d4a30_100%)]" />
      {/* 地平線のグロー */}
      <div
        className="absolute inset-x-0 bottom-[16%] h-56 animate-horizon-glow"
        style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(52,211,153,0.28) 0%, rgba(52,211,153,0.06) 55%, transparent 100%)" }}
      />
      {/* 水鏡の反射ライン */}
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[linear-gradient(180deg,rgba(110,231,183,0.14),rgba(5,13,9,0.9))]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(80% 60% at 70% 10%, rgba(16,185,129,0.12) 0%, transparent 60%)" }}
      />

      {/* 実写スライド（読み込めた場合のみ表示。壊れたURLは onError で消える） */}
      {withImages.map((s, i) => (
        <div
          key={s.image_url}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ヒーロー画像（外部/署名URL）はnext/imageを使わない */}
          <img
            src={s.image_url}
            alt=""
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            className="absolute inset-0 h-full w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-[#050d09]" />
        </div>
      ))}
    </div>
  );
}
