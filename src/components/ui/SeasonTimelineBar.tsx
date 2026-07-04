"use client";

import { useMemo, useState } from "react";
import { getSeasonTimeline } from "../../lib/season";
import { cn } from "@/lib/utils";

/**
 * 農事暦シーズンエンジン（田んぼOS レイヤー4）の通年表示。
 * 9フェーズを幅比例の区間バーで並べ、現在フェーズをハイライト。
 * タップしたフェーズのヒントを下に表示する。
 */
export default function SeasonTimelineBar() {
  const timeline = useMemo(() => getSeasonTimeline(), []);
  const currentIndex = timeline.findIndex((p) => p.isCurrent);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = timeline[openIndex ?? currentIndex];

  return (
    <div>
      {/* 9フェーズ+gapで最小でも356px前後必要になるため、幅の狭い端末では
          横スクロールで全フェーズに到達できるようにする（overflow-hiddenだと
          右側のフェーズが見えず・タップもできなくなる） */}
      <ul className="flex h-12 list-none gap-1 overflow-x-auto rounded-xl p-0" aria-label="農事暦（1年の作業フェーズ）">
        {timeline.map((p, i) => (
          <li key={p.key} style={{ flexGrow: Math.max(1, (p.endFraction - p.startFraction) * 100) }} className="min-w-[2.25rem] shrink-0">
            <button
              aria-label={`${p.label}${p.isCurrent ? "（現在）" : ""}。タップで詳しく`}
              aria-pressed={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className={cn(
                "flex h-12 w-full items-center justify-center text-xl transition-transform",
                p.isCurrent ? "bg-green-600 scale-y-110" : "bg-green-100 hover:bg-green-200",
                openIndex === i && !p.isCurrent && "bg-green-200"
              )}
            >
              <span className={p.isCurrent ? "" : "opacity-70"}>{p.emoji}</span>
            </button>
          </li>
        ))}
      </ul>
      {active && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-bold text-gray-900">{active.label}</span>
          {active.isCurrent ? "（いまの時期）" : ""}：{active.hint}
        </p>
      )}
      <p className="mt-1 text-xs text-gray-400">アイコンをタップすると各時期の説明が見られます</p>
    </div>
  );
}
