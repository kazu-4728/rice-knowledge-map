import type { ReactNode } from "react";

/**
 * スマホ実機風の枠（ノッチ付き）。ランディングページ用に作られたが、
 * ガイド画面等でも使い回せる汎用部品として昇格。
 */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19] overflow-hidden rounded-[2.4rem] border-[6px] border-black bg-black shadow-[0_24px_80px_-16px_rgba(0,0,0,0.75)] ring-1 ring-white/15 ${className}`}
    >
      <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">{children}</div>
    </div>
  );
}
