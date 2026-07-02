import { cn } from "@/lib/utils";

/**
 * 信号色ステータスバッジ（田んぼOS共通）
 * 緑=正常 / 黄=要確認 / 赤=異常 / 青=解決済み / グレー=経過観察
 * ポリゴン発光色・一覧バッジ・ダッシュボードのグリッドで同じ色系を使う。
 */
export type StatusKey = "normal" | "needs_check" | "issue" | "resolved" | "monitoring" | "open";

export const STATUS_META: Record<StatusKey, { label: string; dot: string; badge: string; badgeDark: string }> = {
  normal: {
    label: "正常",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeDark: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  },
  needs_check: {
    label: "要確認",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    badgeDark: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  issue: {
    label: "異常",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    badgeDark: "bg-red-400/15 text-red-300 border-red-400/30",
  },
  open: {
    label: "未対応",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    badgeDark: "bg-red-400/15 text-red-300 border-red-400/30",
  },
  resolved: {
    label: "解決済み",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    badgeDark: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  },
  monitoring: {
    label: "経過観察",
    dot: "bg-gray-400",
    badge: "bg-gray-50 text-gray-600 border-gray-200",
    badgeDark: "bg-white/10 text-gray-300 border-white/20",
  },
};

type Props = {
  status: StatusKey;
  /** ラベルを上書きする（件数付き表示など） */
  label?: string;
  /** ダークガラスUI（マップ空間）用の配色 */
  dark?: boolean;
  className?: string;
};

export default function StatusBadge({ status, label, dark = false, className }: Props) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        dark ? meta.badgeDark : meta.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {label ?? meta.label}
    </span>
  );
}
