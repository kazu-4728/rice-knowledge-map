import Link from "next/link";
import { IconChevronRight } from "../../components/ui/icons";

export type FlowStepKey = "map" | "record" | "talk" | "fields";

/**
 * アプリの「使い方の流れ」の正（縦の導線の単一ソース）。
 * ①マップで登録 → ②記録を残す → ③みんなで確認 → ④振り返り・共有（ゴール）。
 * ホームのStartChecklist・バナー並び順と同じ順序を、各画面の上部にも常設表示して
 * 「いま流れのどこにいて、次にどこへ進むのか」を画面単体で分かるようにする。
 */
const FLOW_STEPS: { key: FlowStepKey; label: string; href: string }[] = [
  { key: "map", label: "マップで登録", href: "/map" },
  { key: "record", label: "記録を残す", href: "/records/new?returnTo=%2Ftalk" },
  { key: "talk", label: "みんなで確認", href: "/talk" },
  { key: "fields", label: "振り返り・共有", href: "/fields" },
];

/** 各ステップの「この画面の役割」と「次にすること」 */
const STEP_GUIDE: Record<FlowStepKey, { role: string; next: { label: string; href: string } | null }> = {
  map: {
    role: "田んぼを登録して、状態を地図で見る",
    next: { label: "記録を残す", href: "/records/new?returnTo=%2Ftalk" },
  },
  record: {
    role: "写真・音声・メモで今日の記録を残す",
    next: { label: "みんなの記録で確認", href: "/talk" },
  },
  talk: {
    role: "みんなの記録と会話を時系列で確認する",
    next: { label: "各場所の記録で田んぼごとに見る", href: "/fields" },
  },
  fields: {
    role: "田んぼごとに振り返り、アプリの外へ共有する（ここがゴール）",
    next: null,
  },
};

/**
 * 「使い方の流れ」の現在地バー。主要画面の見出し直下に置く。
 * 現在のステップを塗りつぶしで示し、他のステップはタップでそのまま移動できる。
 */
export function FlowGuide({ current }: { current: FlowStepKey }) {
  const guide = STEP_GUIDE[current];
  return (
    <nav aria-label="使い方の流れ" className="rounded-2xl bg-white p-3 shadow-sm">
      {/* 4ステップ全体（ゴールまで）が常に見えるよう、はみ出しは横スクロールでなく折り返す */}
      <div className="flex flex-wrap items-center gap-1">
        {FLOW_STEPS.map((step, i) => {
          const isCurrent = step.key === current;
          const chip = (
            <span
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                isCurrent ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  isCurrent ? "bg-white/25 text-white" : "bg-white text-gray-500"
                }`}
              >
                {i + 1}
              </span>
              {step.label}
            </span>
          );
          return (
            <span key={step.key} className="flex shrink-0 items-center gap-1">
              {i > 0 && <IconChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-gray-300" />}
              {isCurrent ? chip : <Link href={step.href}>{chip}</Link>}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5">
        <p className="text-xs text-gray-500">{guide.role}</p>
        {guide.next && (
          <Link
            href={guide.next.href}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-green-700"
          >
            次は: {guide.next.label}
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </nav>
  );
}
