"use client";

import HeroBackdrop from "../landing/HeroBackdrop";
import type { HeroSlide } from "../../lib/data/siteContent";

/** /menu/site から呼び出す、ランディングページ（未ログイン時の入口）のヒーロー確認用プレビュー。
 * 保存前の編集中の内容もそのまま表示する（slidesは呼び出し元から渡す）。 */
export default function LandingPreview({ slides }: { slides: HeroSlide[] }) {
  const hero = slides[0];

  return (
    <div className="relative mt-2 h-56 overflow-hidden rounded-2xl text-white">
      <HeroBackdrop slides={slides} />
      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
          未ログイン時にはじめて表示される画面
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug drop-shadow">
          {hero?.title ?? "田んぼの“今”が、家族みんなに届く。"}
        </h3>
        {hero?.body && (
          <p className="mt-1 line-clamp-2 text-xs text-white/80">{hero.body}</p>
        )}
      </div>
    </div>
  );
}
