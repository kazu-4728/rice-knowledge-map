"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecordDraft, clearRecordDraft, markJustSaved } from "./recordDraft";
import { saveRecord } from "../../lib/data/recordSave";
import { TYPE_LABELS } from "../map/mapPins";
import {
  IconCheck,
  IconChevronLeft,
  IconClipboard,
  IconPencil,
  IconPinFill,
} from "../../components/ui/icons";

function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${youbi}）${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 保存前確認画面。recordDraft の実データを表示して保存する */
function isValidReturnTo(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export default function ConfirmRecordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft] = useState(() => getRecordDraft());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = rawReturnTo && isValidReturnTo(rawReturnTo) ? rawReturnTo : null;

  // リロード等で下書きが消えていたら撮影画面へ戻す
  useEffect(() => {
    if (!draft) router.replace("/records/new");
  }, [draft, router]);

  if (!draft) return null;

  // 「戻る」「修正する」は来た画面（写真 or 音声）へ戻す（returnToも引き継ぐ）
  const backBase = draft.kind === "audio" ? "/records/new?type=audio" : "/records/new";
  const backHref = returnTo ? `${backBase}${backBase.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}` : backBase;

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await saveRecord(draft);
    if (result.status === "saved") {
      clearRecordDraft();
      const dest = returnTo ?? "/home";
      if (dest === "/records" || dest.startsWith("/fields/")) {
        markJustSaved();
      }
      router.replace(dest);
      return;
    }
    setBusy(false);
    if (result.status === "demo") {
      setMessage("ログインしていないため保存できません。ログインしてからやり直してください");
    } else if (result.step === "upload") {
      setMessage(
        draft.kind === "audio"
          ? "音声のアップロードに失敗しました。通信環境を確認してもう一度お試しください"
          : "写真のアップロードに失敗しました。通信環境を確認してもう一度お試しください"
      );
    } else {
      setMessage("保存に失敗しました。通信環境を確認してもう一度お試しください");
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <Link href={backHref} aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-green-700">保存前の確認</h1>
      </header>

      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          {draft.previewUrl &&
            (draft.kind === "audio" ? (
              <audio controls src={draft.previewUrl} className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- ローカルBlobのプレビュー
              <img
                src={draft.previewUrl}
                alt="撮影した写真"
                className="max-h-72 w-full rounded-xl bg-gray-900 object-contain"
              />
            ))}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {draft.fieldName && (
              <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                {draft.fieldName}
              </span>
            )}
            {draft.pointType && (
              <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                {TYPE_LABELS[draft.pointType] ?? draft.pointType}
              </span>
            )}
          </div>
          <p className="mt-2.5 flex items-center gap-1 text-xs text-gray-600">
            <IconPinFill className="h-3.5 w-3.5 text-green-700" />
            {formatRecordedAt(draft.recordedAt)}
            {draft.location ? "・現在地を記録します" : "・位置情報なし"}
          </p>
        </section>

        <section className="rounded-2xl bg-white px-4 py-1 shadow-sm">
          <div className="flex items-start gap-3 py-3.5">
            <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">メモ</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                {draft.memo.trim() || "（メモなし）"}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</p>
        )}
      </main>

      <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Link
          href={backHref}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <IconPencil className="h-4.5 w-4.5" />
          修正する
        </Link>
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
        >
          <IconCheck className="h-5 w-5" strokeWidth={2.2} />
          {busy ? "保存中…" : "保存する"}
        </button>
      </div>
    </div>
  );
}
