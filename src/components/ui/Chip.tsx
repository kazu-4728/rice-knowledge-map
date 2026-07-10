import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * フィルターチップ（田んぼOS共通・今日の流れで採用）
 * 状態を問わず選択/非選択の2値のみで表現し、カテゴリごとに色を変えない
 * （色のアクセントはStatusBadgeの状態チップに一本化する原則のため）。
 */
export function Chip({
  active = false,
  onClick,
  icon,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
        active
          ? "bg-flow-green text-white"
          : "border border-black/10 bg-white text-gray-600",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
