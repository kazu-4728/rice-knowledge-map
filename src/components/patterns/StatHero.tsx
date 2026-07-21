import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./SectionEyebrow";

export type StatHeroStat = {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warning";
};

export type StatHeroTrendBar = {
  label: string;
  count: number;
  color: string;
};

const TONE_TEXT: Record<NonNullable<StatHeroStat["tone"]>, string> = {
  default: "text-gray-900",
  danger: "text-red-600",
  warning: "text-amber-600",
};

/**
 * 数値カード+進捗バーで実データを見せるヒーロー。
 * /records の「積み重ね」ヒーローで使用。
 */
export function StatHero({
  eyebrow,
  stats,
  trendBars,
  className,
}: {
  eyebrow?: string;
  stats: StatHeroStat[];
  trendBars?: StatHeroTrendBar[];
  className?: string;
}) {
  const trendTotal = trendBars?.reduce((s, b) => s + b.count, 0) ?? 0;

  return (
    <section className={cn("rounded-3xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,40,28,0.18)]", className)}>
      {eyebrow && <SectionEyebrow className="mb-2">{eyebrow}</SectionEyebrow>}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
            <p className={cn("font-heading text-3xl font-bold leading-none", TONE_TEXT[s.tone ?? "default"])}>
              {s.value}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      {trendBars && trendBars.length > 0 && trendTotal > 0 && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
            {trendBars.map((b) => (
              <span key={b.label} className={b.color} style={{ width: `${(b.count / trendTotal) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            {trendBars.map((b) => (
              <span key={b.label}>
                {b.label} {b.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
