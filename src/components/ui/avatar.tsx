import { cn } from "@/lib/utils";

/**
 * メンバーアバター（イニシャル+名前ハッシュで安定した配色）
 * トーク空間の記録者・コメント表示で共通利用する。
 */
const AVATAR_COLORS = [
  "bg-green-600",
  "bg-sky-600",
  "bg-amber-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-teal-600",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

type Props = {
  name: string;
  className?: string;
};

export function MemberAvatar({ name, className }: Props) {
  const initial = name.trim().charAt(0) || "?";
  const color = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        color,
        className
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
