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
  IconMap,
  IconMic,
  IconMoreVertical,
  IconPinFill,
  IconPlus,
  IconTrash,
  IconUserFill,
} from "../../../components/ui/icons";
import {
  loadRecordDetail,
  addComment,
  resolveRecord,
  deleteRecord,
  type RecordDetailData,
  type MediaUrls,
} from "../../../lib/data/recordDetail";
import type { RecordDetail } from "../../../types";
import { VoiceInputButton } from "../../../components/ui/VoiceInputButton";

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecordDetailData | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRecordDetail(id).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
  }, [id]);

  const goBack = () => {
    // 履歴があれば前画面に戻る。直接URLで開いた等で履歴が無いときは記録一覧へ
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/records");
    }
  };

  if (!data) {
    return (
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
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
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
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
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
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
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
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
  const canDelete = data.canDelete;

  // 「追記する」のクエリ: 現在の記録と同じ田んぼ・ピンに紐づくよう field/point/pointType を引き継ぐ
  // （未指定だと新規記録画面はGPSで田んぼを自動選択するため、隣接圃場で別の田んぼに保存される事故を防ぐ）
  const followupQuery = (() => {
    const params = new URLSearchParams({ type: "audio" });
    if (record.fieldId) params.set("field", record.fieldId);
    if (record.pointId) params.set("point", record.pointId);
    if (record.pointType) params.set("pointType", record.pointType);
    params.set("returnTo", `/records/${id}`);
    return params.toString();
  })();

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
    // ステータス更新自体は成功している可能性があるため、エラー有無に関わらず再読込する
    const refreshed = await loadRecordDetail(id);
    setData(refreshed);
    if (error) setMessage(error);
    setResolving(false);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setMessage(null);
    setDeleting(true);
    const result = await deleteRecord(id);
    if (result.status === "deleted") {
      // 削除後はこの記録の詳細URLが404になるため、戻る先を明示的に置き換える。
      // 田んぼが分かっていれば田んぼ詳細へ（記録が消えた状態で再描画される）、なければ記録一覧へ
      const dest = record.fieldId ? `/fields/${encodeURIComponent(record.fieldId)}` : "/records";
      router.replace(dest);
      return;
    }
    setDeleting(false);
    setConfirmDelete(false);
    if (result.status === "denied") {
      setMessage("削除できませんでした（権限がありません）");
    } else if (result.status === "demo") {
      setMessage("デモモードでは削除できません");
    } else if (result.status === "anon") {
      setMessage("ログインが必要です");
    } else {
      setMessage(`削除に失敗しました: ${result.message}`);
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
      {/* ヘッダー */}
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <button onClick={goBack} aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        {canDelete && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="その他の操作"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="absolute right-1 p-2.5 text-gray-700"
          >
            <IconMoreVertical className="h-6 w-6" />
          </button>
        )}
        {menuOpen && (
          <>
            {/* 背景をタップしたらメニューを閉じる（aria-hiddenの装飾要素） */}
            <button
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 cursor-default bg-transparent"
            />
            <div
              role="menu"
              className="absolute right-2 top-12 z-40 min-w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <IconTrash className="h-4 w-4" />
                記録を削除
              </button>
            </div>
          </>
        )}
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
                record.fieldId ? (
                  <Link
                    href={`/fields/${encodeURIComponent(record.fieldId)}`}
                    className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800 underline-offset-2 hover:bg-green-200 hover:underline"
                  >
                    {record.fieldName}
                  </Link>
                ) : (
                  <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                    {record.fieldName}
                  </span>
                )
              )}
              {record.pointTypeLabel && (
                record.pointId ? (
                  <Link
                    href={`/records?point=${encodeURIComponent(record.pointId)}`}
                    className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 underline-offset-2 hover:bg-blue-200 hover:underline"
                  >
                    {record.pointTypeLabel}
                  </Link>
                ) : (
                  <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                    {record.pointTypeLabel}
                  </span>
                )
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

        {/* マップで見る — 田んぼ or 座標がある場合 */}
        {(record.fieldId || (record.latitude !== null && record.longitude !== null)) && (() => {
          const params = new URLSearchParams();
          if (record.fieldId) params.set("field", record.fieldId);
          if (record.pointId) params.set("point", record.pointId);
          if (record.latitude !== null && record.longitude !== null) {
            params.set("lat", String(record.latitude));
            params.set("lng", String(record.longitude));
          }
          return (
            <Link
              href={`/map?${params.toString()}`}
              className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3.5 shadow-sm transition-transform active:scale-98"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <IconMap className="h-4.5 w-4.5 text-green-700" />
              </span>
              <span className="text-sm font-bold text-green-700">マップで見る</span>
            </Link>
          );
        })()}

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
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">コメント</span>
                <VoiceInputButton onText={(t) => setCommentText((prev) => prev ? prev + " " + t : t)} />
              </div>
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
            <div className="mt-3 flex flex-col gap-3">
              {record.comments.map((comment, i) => (
                <div
                  key={comment.id ?? i}
                  className={`flex items-end gap-2 ${comment.isMine ? "flex-row-reverse" : ""}`}
                >
                  {!comment.isMine && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <IconUserFill className="h-4 w-4 text-green-700" />
                    </span>
                  )}
                  <div className={`flex min-w-0 max-w-[76%] flex-col ${comment.isMine ? "items-end" : "items-start"}`}>
                    {!comment.isMine && (
                      <div className="mb-1 flex items-center gap-1 px-1">
                        <span className="text-xs font-bold text-gray-600">{comment.author}</span>
                        {comment.isRecorder && (
                          <span className="rounded border border-green-600 px-1 text-[10px] font-semibold text-green-700">
                            本人
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                        comment.isMine
                          ? "rounded-br-md bg-green-600 text-white"
                          : "rounded-bl-md bg-gray-100 text-gray-800"
                      }`}
                    >
                      {comment.text}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-gray-400">{comment.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
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
          onClick={() => router.push(`/records/new?${followupQuery}`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          <IconMic className="h-4.5 w-4.5" />
          追記する
        </button>
      </div>

      {/* 削除確認モーダル（親の overflow-hidden を抜けるため fixed） */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-base font-bold text-gray-900">この記録を削除しますか？</h2>
            <p className="mt-1 text-xs text-gray-500">
              写真・音声・コメントもまとめて削除されます。元には戻せません。
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
