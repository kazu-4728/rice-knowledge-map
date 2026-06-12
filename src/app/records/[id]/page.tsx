"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PaddyPhoto } from "../../../components/ui/PaddyPhoto";
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClipboard,
  IconCommentFill,
  IconMic,
  IconMore,
  IconMoreVertical,
  IconPinFill,
  IconPlus,
  IconUserFill,
} from "../../../components/ui/icons";
import {
  loadRecordDetail,
  addComment,
  resolveRecord,
  type RecordDetailData,
  type MediaUrls,
} from "../../../lib/data/recordDetail";
import type { RecordDetail } from "../../../types";

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecordDetailData | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRecordDetail(id).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (!data) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">読み込み中…</p>
        </main>
      </div>
    );
  }

  if (data.mode === "notfound") {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-500">この記録は見つかりませんでした。</p>
        </main>
      </div>
    );
  }

  if (data.mode === "anon") {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-gray-600">記録を見るにはログインが必要です。</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/records/${id}`)}`}
            className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white"
          >
            ログイン
          </Link>
        </main>
      </div>
    );
  }

  if (data.mode === "error") {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-500">読み込みに失敗しました。通信環境を確認してください。</p>
        </main>
      </div>
    );
  }

  if (data.mode !== "live" && data.mode !== "demo") return null;
  const record: RecordDetail = data.record;
  const mediaUrls: MediaUrls = data.mediaUrls;
  const isResolved = record.status === "resolved";

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setMessage(null);
    setSubmitting(true);
    const { error } = await addComment(id, commentText.trim());
    if (error) {
      setMessage(`コメントの投稿に失敗しました: ${error}`);
    } else {
      setCommentText("");
      setShowCommentInput(false);
      const refreshed = await loadRecordDetail(id);
      setData(refreshed);
    }
    setSubmitting(false);
  };

  const handleResolve = async () => {
    if (isResolved) return;
    setMessage(null);
    setResolving(true);
    const { error } = await resolveRecord(id);
    if (error) {
      setMessage(`更新に失敗しました: ${error}`);
    } else {
      const refreshed = await loadRecordDetail(id);
      setData(refreshed);
    }
    setResolving(false);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
      {/* ヘッダー */}
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        <button aria-label="その他の操作" className="absolute right-1 p-2.5 text-gray-700">
          <IconMoreVertical className="h-6 w-6" />
        </button>
      </header>

      {/* コンテンツ */}
      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* 写真・地点情報カード */}
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          {mediaUrls.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrls.photos[0]}
              alt="記録写真"
              className="h-52 w-full rounded-xl object-cover"
            />
          ) : (
            <PaddyPhoto variant="water" className="h-52 w-full rounded-xl object-cover" />
          )}

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {record.fieldName && (
                <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                  {record.fieldName}
                </span>
              )}
              {record.pointTypeLabel && (
                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  {record.pointTypeLabel}
                </span>
              )}
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold ${
                  isResolved
                    ? "bg-gray-100 text-gray-500"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {record.statusLabel}
              </span>
            </div>
            <h2 className="mt-2.5 text-lg font-bold text-gray-900">{record.title}</h2>
            {record.address && (
              <p className="mt-1.5 flex items-start gap-1 text-xs text-gray-600">
                <IconPinFill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
                {record.address}
              </p>
            )}
          </div>
        </section>

        {/* 記録情報カード */}
        <section className="rounded-2xl bg-white px-4 py-1 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconUserFill className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録者</span>
            <span className="text-sm text-gray-900">{record.recorder}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconCalendar className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録日時</span>
            <span className="text-sm text-gray-900">{record.recordedAt}</span>
          </div>
          {record.summary && (
            <div className="flex items-start gap-3 border-b border-gray-100 py-3.5">
              <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">状況の概要</span>
              <p className="text-sm leading-relaxed text-gray-900">{record.summary}</p>
            </div>
          )}
          {mediaUrls.audio && (
            <div className="flex items-center gap-3 py-3.5">
              <IconMic className="h-5 w-5 shrink-0 text-green-700" />
              <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">音声メモ</span>
              <audio ref={audioRef} src={mediaUrls.audio} controls className="h-9 flex-1 min-w-0" />
            </div>
          )}
        </section>

        {/* 家族のコメント */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCommentFill className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-bold text-gray-900">家族のコメント</h3>
            </div>
            <button
              onClick={() => setShowCommentInput((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-green-700"
            >
              <IconPlus className="h-4 w-4" strokeWidth={2.2} />
              コメントする
            </button>
          </div>

          {showCommentInput && (
            <div className="mt-3 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力…"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCommentInput(false); setCommentText(""); }}
                  className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-600"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !commentText.trim()}
                  className="flex-1 rounded-xl bg-green-700 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submitting ? "送信中…" : "送信"}
                </button>
              </div>
            </div>
          )}

          {record.comments.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {record.comments.map((comment, i) => (
                <li
                  key={comment.id ?? i}
                  className={`flex gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <IconUserFill className="h-5 w-5 text-green-700" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">{comment.author}</span>
                      {comment.isRecorder && (
                        <>
                          <span className="text-xs text-gray-500">（記録者）</span>
                          <span className="rounded border border-green-600 px-1.5 py-px text-[10px] font-semibold text-green-700">
                            本人
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-800">{comment.text}</p>
                    <p className="mt-1.5 text-xs text-gray-400">{comment.timestamp}</p>
                  </div>
                  <button aria-label="コメントの操作" className="shrink-0 self-start p-1 text-gray-400">
                    <IconMore className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-400">まだコメントはありません</p>
          )}
        </section>

        {message && <p className="px-1 text-sm text-red-600">{message}</p>}
      </main>

      {/* 下部アクション */}
      <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={handleResolve}
          disabled={isResolved || resolving}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
            isResolved
              ? "border-gray-300 bg-gray-50 text-gray-400"
              : "border-green-700 bg-white text-green-700 hover:bg-green-50"
          }`}
        >
          <IconCheck className="h-5 w-5" strokeWidth={2.2} />
          {isResolved ? "対応済み" : resolving ? "更新中…" : "対応済みにする"}
        </button>
        <button
          onClick={() => router.push(`/records/new?type=audio`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          <IconMic className="h-4.5 w-4.5" />
          追記する
        </button>
      </div>
    </div>
  );
}
