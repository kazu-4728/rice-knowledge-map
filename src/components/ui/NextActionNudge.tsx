"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronRight, IconClose } from "./icons";

const STORAGE_KEY = "rkm-next-action";
/** 操作完了から60秒以内の遷移でだけ表示する（古い保留分を後から出さない） */
const FRESH_MS = 60_000;
const AUTO_HIDE_MS = 12_000;

type NextAction =
  | { kind: "field_registered"; fieldId: string | null; fieldName: string; ts: number }
  | { kind: "record_saved"; fieldId: string | null; ts: number };

/** Omitをユニオンの各メンバーに分配する（素のOmitだと共通プロパティしか残らない） */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * 操作完了直後に「次の推奨操作」を1つだけ提案する小さなポップアップを予約する。
 * 田んぼ登録→最初の記録、記録保存→みんなの記録で確認、のように利用の流れを
 * その場で案内する（オーナー要望・2026-07-16）。TodayStoryのような起動時の
 * 強制表示ではなく、ユーザー自身の操作をきっかけに短時間だけ出す。
 */
export function scheduleNextAction(action: DistributiveOmit<NextAction, "ts">) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...action, ts: Date.now() }));
    // 同一ページ内で完了する操作（マップ上の田んぼ登録等）は遷移が起きないため、
    // マウント時のsessionStorage読取りに加えてイベントでも即時通知する
    window.dispatchEvent(new Event("rkm-next-action"));
  } catch {
    // ストレージが使えない環境では演出なしで進める
  }
}

/** 予約された「次の推奨操作」ポップアップの表示本体。AppShellとホーム(/)に常駐する */
export default function NextActionNudge() {
  const [action, setAction] = useState<NextAction | null>(null);

  useEffect(() => {
    const consume = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        sessionStorage.removeItem(STORAGE_KEY);
        const parsed = JSON.parse(raw) as NextAction;
        if (Date.now() - parsed.ts > FRESH_MS) return;
        setAction(parsed);
      } catch {
        // 破損データは無視
      }
    };
    consume();
    window.addEventListener("rkm-next-action", consume);
    return () => window.removeEventListener("rkm-next-action", consume);
  }, []);

  useEffect(() => {
    if (!action) return;
    const t = setTimeout(() => setAction(null), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [action]);

  if (!action) return null;

  const close = () => setAction(null);

  const primaryClass =
    "inline-flex items-center gap-1 rounded-full bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800";
  const secondaryClass =
    "inline-flex items-center gap-1 rounded-full border border-green-700 bg-white px-4 py-2 text-xs font-bold text-green-700";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 print:hidden">
      <div className="pointer-events-auto w-full max-w-md animate-fab-pop rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_16px_40px_-12px_rgba(6,78,59,0.45)]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {action.kind === "field_registered" && (
              <>
                <p className="text-sm font-bold text-gray-900">
                  「{action.fieldName || "田んぼ"}」を登録しました 🎉
                </p>
                <p className="mt-0.5 text-xs text-gray-600">次は最初の記録を残してみましょう</p>
              </>
            )}
            {action.kind === "record_saved" && (
              <>
                <p className="text-sm font-bold text-gray-900">記録を保存しました</p>
                <p className="mt-0.5 text-xs text-gray-600">みんなの記録に流れています。LINEなどへの共有もここからできます</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {action.kind === "field_registered" && (
            <Link
              href={
                action.fieldId
                  ? `/records/new?field=${encodeURIComponent(action.fieldId)}&returnTo=%2Fmap`
                  : "/records/new?returnTo=%2Fmap"
              }
              onClick={close}
              className={primaryClass}
            >
              写真で記録する
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {action.kind === "record_saved" && (
            <>
              <Link href="/talk" onClick={close} className={primaryClass}>
                みんなの記録で見る
                <IconChevronRight className="h-3.5 w-3.5" />
              </Link>
              {action.fieldId && (
                <Link
                  href={`/fields/${encodeURIComponent(action.fieldId)}`}
                  onClick={close}
                  className={secondaryClass}
                >
                  共有する
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
