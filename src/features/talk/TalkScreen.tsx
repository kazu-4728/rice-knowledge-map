"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteComment, loadTalkTimeline, sendTalkText, type TalkMessage } from "../../lib/data/talk";
import { deleteRecord } from "../../lib/data/recordDetail";
import { loadFarmData } from "../../lib/data/farm";
import { useToast } from "../../components/ui/Toast";
import { MemberAvatar } from "../../components/ui/avatar";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { useTransceiver, TransceiverOverlay, TalkMicButton } from "./Transceiver";
import { IconCamera, IconChevronRight, IconPlayFill, IconTrash } from "../../components/ui/icons";

/**
 * 家族の統合トークルーム（田んぼOS「話す」空間）。
 * 全田んぼの記録・コメントが1本のタイムラインに時系列で流れる。
 * メッセージの田んぼチップをタップするとその田んぼだけに絞り込める
 * （別ルームは作らない: どこの履歴か分からなくなるのを防ぐ）。
 */

type FieldChip = { id: string; name: string };

export default function TalkScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "anon" | "error">("loading");
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [fields, setFields] = useState<FieldChip[]>([]);
  const [filterId, setFilterId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  // フィルタ切替の連打で古いレスポンスが後から届いて上書きするのを防ぐ（レース対策）
  const reloadTokenRef = useRef(0);

  const filterName = filterId ? fields.find((f) => f.id === filterId)?.name ?? null : null;

  const reload = useCallback(async (fieldId: string | null) => {
    const token = ++reloadTokenRef.current;
    const data = await loadTalkTimeline(fieldId ? { fieldId } : undefined);
    if (token !== reloadTokenRef.current) return; // 待っている間に新しいreloadが発行された
    if (data.mode === "anon" || data.mode === "error") {
      setMode(data.mode);
      return;
    }
    setMode(data.mode);
    setMessages(data.messages);
    setHasMore(data.hasMore);
    stickToBottomRef.current = true;
  }, []);

  useEffect(() => {
    setMode("loading");
    reload(filterId);
  }, [filterId, reload]);

  useEffect(() => {
    loadFarmData().then((farm) => {
      if (farm.mode === "error") return;
      setFields(
        farm.fieldsGeoJSON.features.map((f) => ({
          id: String(f.id ?? f.properties?.id ?? ""),
          name: String(f.properties?.name ?? "名前のない田んぼ"),
        }))
      );
    });
  }, []);

  // 初期表示・新着時に最下部へスクロール
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    // reload と同じトークンを共有する。応答が届くまでの間に田んぼチップが切り替わった場合、
    // 古い絞り込みの結果が現在の絞り込みへ混入するのを防ぐ
    const token = ++reloadTokenRef.current;
    const data = await loadTalkTimeline({
      fieldId: filterId ?? undefined,
      before: messages[0].atISO,
    });
    if (token === reloadTokenRef.current && (data.mode === "live" || data.mode === "demo")) {
      stickToBottomRef.current = false;
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.key));
        return [...data.messages.filter((m) => !seen.has(m.key)), ...prev];
      });
      setHasMore(data.hasMore);
      // 読み込み前に見ていた位置を維持する
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
    setLoadingOlder(false);
  }, [loadingOlder, messages, filterId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const { error } = await sendTalkText(trimmed, filterId);
    setSending(false);
    if (error) {
      showToast(error, "error");
      return;
    }
    setText("");
    await reload(filterId);
  }, [text, sending, filterId, reload, showToast]);

  // 自分のコメント／メディアなしの「ひとこと」記録のみ削除できる（写真・音声の削除は記録詳細から）
  const handleDelete = useCallback(
    async (m: TalkMessage) => {
      // 記録の削除はスレッドの返信も一緒に消える（cascade）ため、その旨を明示して確認する
      const confirmText =
        m.kind === "record" && m.commentCount != null && m.commentCount > 0
          ? `この記録には返信が${m.commentCount}件付いています。記録と返信をまとめて削除しますか？`
          : "このメッセージを削除しますか？";
      if (!window.confirm(confirmText)) return;
      if (m.kind === "comment") {
        const { error } = await deleteComment(m.key.replace(/^c-/, ""));
        if (error) {
          showToast(error, "error");
          return;
        }
      } else {
        const result = await deleteRecord(m.recordId);
        if (result.status !== "deleted") {
          showToast(
            result.status === "demo" ? "デモ環境では削除できません" : "削除できませんでした",
            "error"
          );
          return;
        }
      }
      showToast("削除しました");
      await reload(filterId);
    },
    [filterId, reload, showToast]
  );

  const transceiver = useTransceiver({
    onSaved: (fieldName) => {
      showToast(fieldName ? `🌾 ${fieldName} に送信しました` : "音声を送信しました");
      reload(filterId);
    },
    onError: (message) => showToast(message, "error"),
  });

  if (mode === "anon") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-base font-bold text-gray-900">ログインすると家族のトークが表示されます</p>
        <Link
          href="/login?redirect=%2Ftalk"
          className="rounded-full bg-green-700 px-8 py-3.5 text-sm font-bold text-white"
        >
          ログイン
        </Link>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-gray-600">トークを読み込めませんでした。通信環境を確認してください。</p>
        <button
          onClick={() => reload(filterId)}
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#eef2ea]">
      {/* 田んぼ絞り込みチップ */}
      <div className="shrink-0 border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilterId(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filterId === null ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            すべて
          </button>
          {fields.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterId((cur) => (cur === f.id ? null : f.id))}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filterId === f.id ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              🌾 {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* タイムライン */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {mode === "loading" ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="ml-10 h-16 w-56 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-44 rounded-2xl" />
            <Skeleton className="ml-10 h-40 w-60 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-3xl">🌾</p>
            <p className="text-sm font-bold text-gray-700">
              {filterName ? `「${filterName}」のやり取りはまだありません` : "まだやり取りがありません"}
            </p>
            <p className="text-xs text-gray-500">下のカメラやマイクから、最初の記録を送ってみましょう</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="pb-2 text-center">
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-500 shadow-sm"
                >
                  {loadingOlder ? "読み込み中…" : "以前のやり取りを見る"}
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageRow
                key={m.key}
                message={m}
                showDate={i === 0 || messages[i - 1].dateLabel !== m.dateLabel}
                showAuthor={!m.isMine && (i === 0 || messages[i - 1].author !== m.author || messages[i - 1].dateLabel !== m.dateLabel)}
                onOpen={() => router.push(`/records/${m.recordId}`)}
                onFieldTap={(id) => setFilterId(id)}
                onDelete={
                  // 自分のコメント、または自分の「ひとこと」（record_type=other かつメディア行なし）のみ。
                  // photoUrl（署名URL）は圏外等で発行に失敗しても hasMedia は record_media 由来で
                  // 常に判定できるため、写真付き記録に誤って削除ボタンが出ることはない
                  m.isMine &&
                  (m.kind === "comment" || (m.recordType === "other" && !m.hasMedia))
                    ? () => handleDelete(m)
                    : undefined
                }
              />
            ))}
          </>
        )}
      </div>

      {/* 入力バー */}
      <div className="shrink-0 border-t border-black/5 bg-white px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {mode === "demo" && (
          <p className="pb-1.5 text-center text-[10px] text-gray-400">デモ環境: 送信は保存されません</p>
        )}
        <div className="flex items-end gap-1.5">
          <Link
            href={`/records/new?returnTo=%2Ftalk${filterId ? `&field=${encodeURIComponent(filterId)}` : ""}`}
            aria-label="写真で記録"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-green-700 transition-colors active:bg-emerald-100"
          >
            <IconCamera className="h-5.5 w-5.5" />
          </Link>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={filterName ? `${filterName}へひとこと…` : "家族へひとこと…"}
            className="h-11 min-w-0 flex-1 rounded-full bg-gray-100 px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={sending}
              aria-label="送信"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              <IconChevronRight className="h-6 w-6" />
            </button>
          ) : (
            <TalkMicButton transceiver={transceiver} />
          )}
        </div>
      </div>

      <TransceiverOverlay transceiver={transceiver} />
    </div>
  );
}

function MessageRow({
  message: m,
  showDate,
  showAuthor,
  onOpen,
  onFieldTap,
  onDelete,
}: {
  message: TalkMessage;
  showDate: boolean;
  showAuthor: boolean;
  onOpen: () => void;
  onFieldTap: (fieldId: string) => void;
  /** 自分のコメント/ひとことのみ削除可能（undefinedなら非表示） */
  onDelete?: () => void;
}) {
  const fieldChip = m.fieldId && m.fieldName && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onFieldTap(m.fieldId!);
      }}
      // 親を div role="button" 化したため、keydownはclickと違いstopPropagationだけでは
      // 止まらず親のonOpenまでバブリングする。Enter/Spaceでの二重発火を防ぐ
      onKeyDown={(e) => e.stopPropagation()}
      className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
    >
      🌾 {m.fieldName}
    </button>
  );

  return (
    <div>
      {showDate && (
        <div className="flex justify-center py-2.5">
          <span className="rounded-full bg-black/10 px-3 py-1 text-[10px] font-semibold text-gray-600">
            {m.dateLabel}
          </span>
        </div>
      )}
      <div className={`flex items-end gap-1.5 pb-1.5 ${m.isMine ? "justify-end" : ""}`}>
        {!m.isMine && (
          <span className="w-8 shrink-0">
            {showAuthor && <MemberAvatar name={m.author} />}
          </span>
        )}
        {m.isMine && (
          <span className="mb-0.5 flex shrink-0 flex-col items-end gap-1">
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="このメッセージを削除"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition-colors active:bg-red-50 active:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
            <span className="text-[9px] text-gray-400">{m.timeLabel}</span>
          </span>
        )}

        <div className={`max-w-[76%] ${m.isMine ? "items-end" : ""}`}>
          {showAuthor && (
            <p className="mb-0.5 ml-1 text-[10px] font-semibold text-gray-500">{m.author}</p>
          )}

          {m.kind === "comment" ? (
            // fieldChip がボタンのためネストボタンを避け、div+role="button" で代用する
            <div
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className={`block cursor-pointer rounded-2xl px-3 py-2 text-left text-sm leading-relaxed shadow-sm ${
                m.isMine
                  ? "rounded-br-sm bg-green-600 text-white"
                  : "rounded-bl-sm bg-white text-gray-800"
              }`}
            >
              {/* 返信先の記録を引用表示（どのメッセージへの返信かを明示。タップで元記録=スレッドへ） */}
              {m.recordTitle && (
                <span
                  className={`mb-1 block truncate border-l-2 pl-2 text-[11px] ${
                    m.isMine ? "border-white/50 text-white/80" : "border-emerald-400 text-gray-500"
                  }`}
                >
                  ↩ {m.fieldName ? `${m.fieldName}・` : ""}
                  {m.recordTitle}
                </span>
              )}
              {!m.isMine && !m.recordTitle && fieldChip && <span className="mr-1.5">{fieldChip}</span>}
              {m.text}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className={`block cursor-pointer overflow-hidden rounded-2xl text-left shadow-sm ${
                m.isMine ? "rounded-br-sm border border-emerald-200 bg-emerald-50" : "rounded-bl-sm bg-white"
              }`}
            >
              {m.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- 署名URLの記録写真
                <img src={m.photoUrl} alt="" className="h-40 w-60 max-w-full object-cover" />
              )}
              {m.audioUrl && (
                <div className="flex items-center gap-2 px-3 pt-2.5" onClick={(e) => e.stopPropagation()}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <IconPlayFill className="h-4 w-4" />
                  </span>
                  <audio controls preload="none" src={m.audioUrl} className="h-9 w-44 max-w-full" />
                </div>
              )}
              <div className="px-3 py-2">
                <p className="text-sm font-bold leading-snug text-gray-900">{m.title}</p>
                {m.note && m.note !== m.title && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">{m.note}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {fieldChip}
                  {/* records.status は既定値が 'open' のため、異常系（isIssue）以外の
                      ふつうの記録（写真/作業/ひとこと等）にまで「未対応」を出さない。
                      isIssueでも解決済み（resolved等）になっていれば表示しない。
                      需要確認（needs_check）は明示的に付けられた状態なので種別を問わず表示する */}
                  {((m.isIssue && (m.status === "open" || m.status === "needs_check")) ||
                    m.status === "needs_check") && (
                    <StatusBadge
                      status={m.isIssue && m.status === "open" ? "open" : "needs_check"}
                      className="text-[10px]"
                    />
                  )}
                  {m.photoCount != null && m.photoCount > 1 && (
                    <span className="text-[10px] text-gray-400">📷 {m.photoCount}枚</span>
                  )}
                  {/* スレッドの存在を明示（返信の履歴は元記録に集約されている） */}
                  {m.commentCount != null && m.commentCount > 0 && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      💬 返信{m.commentCount}件
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!m.isMine && <span className="mb-0.5 shrink-0 text-[9px] text-gray-400">{m.timeLabel}</span>}
      </div>
    </div>
  );
}
