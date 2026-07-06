import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ランディングページ由来の「短い横線 + 極小uppercaseラベル」見出しパターン。
 * home/fields/menu/calendar 等に個別実装されていたブロックを一本化する。
 */
export function SectionEyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  /** darkはグローカード等の暗い背景上で使う（白系トラック） */
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("h-px w-6", tone === "dark" ? "bg-emerald-300" : "bg-emerald-600")} />
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em]",
          tone === "dark" ? "text-emerald-200" : "text-emerald-700"
        )}
      >
        {children}
      </span>
    </div>
  );
}
