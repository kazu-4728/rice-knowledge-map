"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecordDraft, setRecordDraft, clearRecordDraft, markJustSaved } from "./recordDraft";
import { saveRecord, POINT_TYPE_TO_RECORD_TYPE } from "../../lib/data/recordSave";
import { TYPE_TO_CATEGORY, ISSUE_POINT_TYPES } from "../../lib/data/records";
import { TYPE_LABELS } from "../map/mapPins";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
  IconPencil,
  IconPinFill,
} from "../../components/ui/icons";

type StatusChoice = { key: "open" | "needs_check" | "monitoring"; label: string };
const STATUS_CHOICES: StatusChoice[] = [
  { key: "open", label: "通常" },
  { key: "needs_check", label: "要確認" },
  { key: "monitoring", label: "経過観察" },
];

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
  const [status, setStatus] = useState<StatusChoice["key"] | undefined>(
    draft?.status === "needs_check" || draft?.status === "monitoring" ? draft.status : undefined
  );
  const [nextAction, setNextAction] = useState(draft?.nextAction ?? "");

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

  // 撮影画面へ戻る前に、この画面で入力した状況・次のアクションを下書きへ反映する
  // （撮影画面の「次へ」がdraftを作り直すため、反映しないとここでの入力が消える）
  const handleBack = () => {
    setRecordDraft({ ...draft, status, nextAction: nextAction.trim() || undefined });
  };

  // 保存時の実際の分類（saveRecord()と同じ優先順位: 音声は無条件でvoice、
  // それ以外はpointType由来、無ければphoto）に合わせてカテゴリチップを表示する
  const recordType = draft.kind === "audio" ? "voice" : (draft.pointType && POINT_TYPE_TO_RECORD_TYPE[draft.pointType]) || "photo";
  const categoryLabel = TYPE_TO_CATEGORY[recordType] ?? "作業";

  // 異常系のポイント種別（caution/levee_damage/poor_drainage）を選んだ記録は、
  // 未選択のままDB既定値'open'で保存すると記録詳細では「未対応」表示になる
  // （isUnresolvedIssue()が異常記録のopen/needs_checkを未対応として集計するため）。
  // ここで「通常」を選べてしまうと、保存後の実際の表示・集計と食い違うため選択肢から除く（制約1）
  const isIssueDraft = !!draft.pointType && ISSUE_POINT_TYPES.includes(draft.pointType);
  const visibleStatusChoices = isIssueDraft ? STATUS_CHOICES.filter((c) => c.key !== "open") : STATUS_CHOICES;

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await saveRecord({ ...draft, status, nextAction: nextAction.trim() || undefined });
    if (result.status === "saved") {
      clearRecordDraft();
      const dest = returnTo ?? "/records";
      markJustSaved();
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
    <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-[#fffdf7]">
      <header className="relative flex h-14 shrink-0 items-center justify-center bg-emerald-950 text-white">
        <Link href={backHref} onClick={handleBack} aria-label="戻る" className="absolute left-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-black">記録内容の確認</h1>
      </header>

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-emerald-950">内容を整理しました</h2>
          <p className="mt-1 text-sm text-stone-600">間違いがあれば修正してから保存してください</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          {draft.previewUrl &&
            (draft.kind === "audio" ? (
              <div className="p-4"><audio controls src={draft.previewUrl} className="w-full" /></div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- ローカルBlobのプレビュー
              <img
                src={draft.previewUrl}
                alt="撮影した写真"
                className="h-72 w-full bg-stone-900 object-cover"
              />
            ))}
          <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* 圃場 */}
            {draft.fieldName && (
              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-900">
                {draft.fieldName}
              </span>
            )}
            {/* 場所（ポイント種別） */}
            {draft.pointType && (
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">
                {TYPE_LABELS[draft.pointType] ?? draft.pointType}
              </span>
            )}
            {/* カテゴリ（場所種別から自動判定。将来のAI出力JSONと1対1になる項目） */}
            <span className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-bold text-stone-700">
              {categoryLabel}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1 text-xs text-stone-600">
            <IconPinFill className="h-3.5 w-3.5 text-emerald-800" />
            {formatRecordedAt(draft.recordedAt)}
            {draft.location ? "・現在地を記録します" : "・位置情報なし"}
          </p>
          </div>
        </section>

        {/* 状況（今回の観測状態。将来AIが初期値を埋める予定の項目） */}
        <section className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
          <p className="text-base font-black text-stone-900">状態</p>
          {isIssueDraft && (
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              異常の記録は既定で「未対応」として保存されます。対応不要になったら記録詳細からいつでも変更できます
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {visibleStatusChoices.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setStatus((cur) => (cur === c.key ? undefined : c.key))}
                className={`min-h-11 rounded-xl px-2 text-sm font-bold transition-colors ${
                  status === c.key
                    ? "bg-emerald-900 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white px-4 py-1">
          <div className="flex items-start gap-3 py-3.5">
            <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-700">内容</p>
              <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-stone-950">
                {draft.memo.trim() || "（メモなし）"}
              </p>
            </div>
          </div>
        </section>

        {/* 次のアクション（任意。将来AIが初期値を埋める予定の項目） */}
        <section className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
          <div className="flex items-start gap-3">
            <IconChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
            <div className="min-w-0 flex-1">
              <label htmlFor="next-action" className="text-sm font-bold text-stone-700">
                対応・次に確認すること（任意）
              </label>
              <input
                id="next-action"
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="例: 夕方にもう一度確認する"
                className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 px-3 py-2 text-base text-stone-950 placeholder-stone-400 outline-none focus:border-emerald-700"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-emerald-900 bg-emerald-50/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-white"><IconCheck className="h-5 w-5" /></span>
            <div><p className="text-base font-black text-emerald-950">今年の記録として保存</p><p className="mt-1 text-sm leading-relaxed text-stone-600">引き継ぐ固定の知識や手順は変更しません</p></div>
          </div>
        </section>

        {message && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</p>
        )}
      </main>

      <div className="flex shrink-0 gap-3 border-t border-stone-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Link
          href={backHref}
          onClick={handleBack}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-900 bg-white text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50"
        >
          <IconPencil className="h-4.5 w-4.5" />
          修正する
        </Link>
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-950 text-sm font-black text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
        >
          <IconCheck className="h-5 w-5" strokeWidth={2.2} />
          {busy ? "保存中…" : "確認して保存"}
        </button>
      </div>
    </div>
  );
}
