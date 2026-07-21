"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadFieldAttention } from "../../lib/data/fieldAttention";
import { loadHasAnyRecord } from "../../lib/data/records";
import { hasSharedOnce } from "../../lib/utils/share";
import { IconCheck, IconChevronRight } from "../../components/ui/icons";

/** 記録タイムラインを一度でも開いたか（記録タイムライン画面が記録する） */
export const RECORDS_SEEN_KEY = "rkm-step-records-seen";

type Step = {
  key: string;
  label: string;
  sub: string;
  /** 指定時はLinkで遷移する。onClickと排他 */
  href?: string;
  /** 指定時はボタンとして扱う（共有シートを開く等、遷移を伴わない操作） */
  onClick?: () => void;
  done: boolean;
};

/**
 * ログイン後ホームの「はじめての流れ」チェックリスト（オーナー承認・2026-07-16）。
 * ホームの説明（バナー1〜5）と同じ順番で、実データの達成状況に✓を付けながら
 * 次にやることへ1タップで進めるようにする。「説明の順番どおりに進めない」対策。
 * 天気・件数などの動的ダイジェストは使わない（達成状態の表示のみ）。
 * 全ステップ達成後は表示しない（経験者には出ない）。
 */
export function StartChecklist({ onShareClick }: { onShareClick?: () => void } = {}) {
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFieldAttention(), loadHasAnyRecord()]).then(([attention, hasRecord]) => {
      if (cancelled) return;
      if (attention.mode === "anon" || attention.mode === "error") return;
      const hasField = attention.fields.length > 0;
      const recordsSeen = (() => {
        try { return localStorage.getItem(RECORDS_SEEN_KEY) === "1"; } catch { return false; }
      })();
      const shared = hasSharedOnce();
      setSteps([
        {
          key: "field",
          label: "田んぼを登録する",
          sub: "マップで輪郭をなぞるだけ",
          href: "/map?register=1",
          done: hasField,
        },
        {
          key: "record",
          label: "記録を残す",
          sub: "写真1枚からでOK",
          href: "/records/new?returnTo=%2Frecords",
          done: hasRecord === true,
        },
        {
          key: "records",
          label: "記録タイムラインを見る",
          sub: "記録が時系列で流れる場所",
          href: "/records",
          done: recordsSeen,
        },
        {
          key: "share",
          label: "共有する",
          sub: "LINEなどで田んぼの様子を送る",
          ...(!hasField
            ? { href: "/map?register=1" }
            : onShareClick
              ? { onClick: onShareClick }
              : { href: "/map" }),
          done: shared,
        },
      ]);
    });
    return () => { cancelled = true; };
  }, [onShareClick]);

  if (!steps) return null;
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;
  const currentKey = steps.find((s) => !s.done)?.key;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">はじめての流れ</h2>
        <span className="text-[11px] text-gray-400">{steps.length - remaining} / {steps.length} 完了</span>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => {
          const isCurrent = s.key === currentKey;
          return (
            <li key={s.key} className="flex items-center gap-2.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  s.done ? "bg-emerald-500 text-white" : isCurrent ? "bg-green-700 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.done ? <IconCheck className="h-3.5 w-3.5" strokeWidth={2.6} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-bold leading-tight ${s.done ? "text-gray-300 line-through" : "text-gray-800"}`}>
                  {s.label}
                </p>
                {!s.done && <p className="text-[11px] leading-tight text-gray-400">{s.sub}</p>}
              </div>
              {isCurrent && (
                s.href ? (
                  <Link
                    href={s.href}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.9)] transition-transform active:scale-95"
                  >
                    今ここ
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={s.onClick}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.9)] transition-transform active:scale-95"
                  >
                    今ここ
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
