import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SEASON_ICONS } from "../ui/icons";
import type { SeasonIconKey } from "../../lib/season";
import { RemotePhoto } from "../ui/RemotePhoto";

/**
 * ランディングの StoryMockup（グラデーション背景+進捗バー）の拡大版。
 * /calendar のヒーローで「次の農作業タイミング」を主役化する。
 * coverImageUrl を渡すと季節に応じた実写を背景にし、スクリムで可読性を保つ。
 */
export function SeasonProgressHero({
  seasonLabel,
  seasonIconKey,
  hint,
  yearProgress,
  nextScheduleLabel,
  coverImageUrl,
  className,
  children,
}: {
  seasonLabel: string;
  seasonIconKey: SeasonIconKey;
  hint: string;
  yearProgress: number;
  nextScheduleLabel?: string | null;
  coverImageUrl?: string;
  className?: string;
  children?: ReactNode;
}) {
  const SeasonIcon = SEASON_ICONS[seasonIconKey];
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl p-4 text-white shadow-[0_16px_40px_-16px_rgba(6,78,59,0.6)]",
        !coverImageUrl && "bg-gradient-to-b from-emerald-800 via-emerald-900 to-black",
        className
      )}
    >
      {coverImageUrl ? (
        <>
          <RemotePhoto
            src={coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackVariant="grass"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-emerald-950/60 to-black/85" />
        </>
      ) : (
        <span className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 animate-horizon-glow rounded-full bg-emerald-400/25 blur-3xl" />
      )}
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <SeasonIcon className="h-6 w-6 text-emerald-200" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-bold">いまは「{seasonLabel}」の時期</p>
          <p className="mt-0.5 text-sm text-emerald-100/90">{hint}</p>
        </div>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(yearProgress * 100)}%` }} />
      </div>
      {nextScheduleLabel && (
        <p className="relative mt-2.5 text-sm font-semibold text-emerald-100">次の予定: {nextScheduleLabel}</p>
      )}
      {children && <div className="relative">{children}</div>}
    </section>
  );
}
