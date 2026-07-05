import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * セクション見出し（田んぼOS共通の視覚ヒエラルキー）
 *
 * ページタイトル（h1相当）の下位にあたる h2/h3 相当の見出し。
 * 左端のアクセントバーで優先度と種類をひと目で示す:
 * - 緑バー = 通常セクション
 * - 琥珀バー = 要注意・アラート系セクション
 * level 2 は画面内の主要セクション、level 3 はカード内の小見出し。
 */
type Props = {
  /** 2=画面内の主要セクション（h2相当） / 3=カード内の小見出し（h3相当） */
  level?: 2 | 3;
  /** alert は要注意系セクション（琥珀色バー） */
  tone?: "default" | "alert";
  /** 右端に置く要素（「すべて」リンクや件数など） */
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function SectionHeading({
  level = 2,
  tone = "default",
  trailing,
  className,
  children,
}: Props) {
  const bar = tone === "alert" ? "bg-amber-500" : "bg-green-600";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn("shrink-0 rounded-full", bar, level === 2 ? "h-4 w-1" : "h-3.5 w-1")}
      />
      {level === 2 ? (
        <h2 className="text-base font-bold text-gray-900">{children}</h2>
      ) : (
        <h3 className="text-sm font-bold text-gray-800">{children}</h3>
      )}
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
