import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_CHIP: Record<"emerald" | "sky" | "amber", string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
};

const TONE_DOT: Record<"emerald" | "sky" | "amber", string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
};

/**
 * ランディングの「3つの空間」交互レイアウト（grid md:grid-cols-2 + md:order-2）を汎用化。
 * 説明文＋ビジュアルを左右反転させたいセクションで使う（/fields/[id] 概要タブ等）。
 */
export function AlternatingFeatureRow({
  eyebrow,
  eyebrowTone = "emerald",
  title,
  description,
  bullets,
  visual,
  reverse = false,
  className,
}: {
  eyebrow: string;
  eyebrowTone?: "emerald" | "sky" | "amber";
  title: ReactNode;
  description?: string;
  bullets?: string[];
  visual: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid items-center gap-6 md:grid-cols-2", className)}>
      <div className={reverse ? "md:order-2" : undefined}>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", TONE_CHIP[eyebrowTone])}>
          {eyebrow}
        </span>
        <h3 className="mt-3 text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>}
        {bullets && bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[eyebrowTone])} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={reverse ? "md:order-1" : undefined}>{visual}</div>
    </div>
  );
}
