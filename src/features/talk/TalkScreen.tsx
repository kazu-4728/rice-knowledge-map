"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { fadeRise } from "../../lib/motion/variants";
import { deleteComment, sendTalkText, type TalkMessage } from "../../lib/data/talk";
import { deleteRecord } from "../../lib/data/recordDetail";
import { loadFieldAttention } from "../../lib/data/fieldAttention";
import { useToast } from "../../components/ui/Toast";
import { MemberAvatar } from "../../components/ui/avatar";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import { TalkPreviewCard } from "../../components/patterns/TalkPreviewCard";
import { useTalkTimeline } from "./hooks/useTalkTimeline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { useTransceiver, TransceiverOverlay, TalkMicButton } from "./Transceiver";
import {
  IconCamera,
  IconChat,
  IconChevronRight,
  IconPlayFill,
  IconSprout,
  IconTrash,
} from "../../components/ui/icons";

/**
 * 家族の統合トークルーム（田んぼOS「話す」空間）。
 * 全田んぼの記録・コメントが1本のタイムラインに時系列で流れる。
 * メッセージの田んぼチップをタップするとその田んぼだけに絞り込める
 * （別ルームは作らない: どこの履歴か分からなくなるのを防ぐ）。
 */

export default function TalkScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [filterId, setFilterId] = useState<string | null>(null);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [attentionFieldName, setAttentionFieldName] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TalkMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const timeline = useTalkTimeline(filterId);
  const { mode, messages, hasMore, fields, loadingOlder, reload, loadOlder, stickToBottomRef } = timeline;

  const filterName = filterId ? fields.find((f) => f.id === filterId)?.name ?? null : null;

  useEffect(() => {
    loadFieldAttention().then((summary) => {
      if (summary.attentionFields.length > 0) setAttentionFieldName(summary.attentionFields[0].name || null);
    });
  }, []);

  // 初期表示・新着時に最下部へスクロール
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottomRef]);

  const handleLoadOlder = async () => {
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    await loadOlder();
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const handleSend = async () => {
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
  };

  // 自分のメッセージ（コメント・記録とも）を削除できる。確認はAlertDialogで行う
  // 記録の削除は添付（写真・音声）とスレッドの返信も一緒に消える（cascade）ため、
  // 消えるものを明示して確認する
  const deleteExtrasText = (m: TalkMessage): string | null => {
    if (m.kind !== "record") return null;
    const extras = [
      m.hasMedia ? "写真・音声の添付" : null,
      m.commentCount != null && m.commentCount > 0 ? `返信${m.commentCount}件` : null,
    ].filter(Boolean);
    return extras.length > 0 ? `${extras.join("と")}も一緒に削除されます。元には戻せません。` : "元には戻せません。";
  };

  const handleDelete = async () => {
    const m = pendingDelete;
    if (!m || deleting) return;
    setDeleting(true);
    if (m.kind === "comment") {
      const { error } = await deleteComment(m.key.replace(/^c-/, ""));
      if (error) {
        showToast(error, "error");
        setDeleting(false);
        return;
      }
    } else {
      const result = await deleteRecord(m.recordId);
      if (result.status !== "deleted") {
        showToast(
          result.status === "demo" ? "デモ環境では削除できません" : "削除できませんでした",
          "error"
        );
        setDeleting(false);
        return;
      }
    }
    setDeleting(false);
    setPendingDelete(null);
    showToast("削除しました");
    await reload(filterId);
  };

  const transceiver = useTransceiver({
    onSaved: (fieldName) => {
      showToast(fieldName ? `${fieldName} に送信しました` : "音声を送信しました");
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

  const todayCount = messages.length > 0 ? messages.filter((m) => m.dateLabel === messages[messages.length - 1].dateLabel).length : 0;

  return (
    <div className="flex h-full flex-col bg-talk-surface">
      {/* 主役ヒーロー: 「今日の会話の温度」を折りたたみ式で表示（MapSummarySheetのpeek/expand設計を踏襲） */}
      {mode !== "loading" && (
        <button
          onClick={() => setHeroExpanded((v) => !v)}
          className="shrink-0 border-b border-black/5 bg-white/60 px-3 pt-2 text-left backdrop-blur-sm"
          aria-expanded={heroExpanded}
        >
          <motion.div layout transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            <TalkPreviewCard
              latestMessages={heroExpanded ? messages.slice(-2).reverse() : []}
              todayCount={todayCount}
              attentionFieldName={attentionFieldName}
              className="bg-transparent p-0 pb-2"
            />
          </motion.div>
        </button>
      )}

      {/* 田んぼ絞り込みチップ */}
      <div className="shrink-0 border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilterId(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
              filterId === null
                ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_4px_16px_-4px_rgba(16,185,129,0.6)]"
                : "border border-white/60 bg-white/70 text-gray-600"
            }`}
          >
            すべて
          </button>
          {fields.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterId((cur) => (cur === f.id ? null : f.id))}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
                filterId === f.id
                  ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_4px_16px_-4px_rgba(16,185,129,0.6)]"
                  : "border border-white/60 bg-white/70 text-gray-600"
              }`}
            >
              <IconSprout className="h-3.5 w-3.5" />
              {f.name}
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
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <IconSprout className="h-7 w-7" />
            </span>
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
                  onClick={handleLoadOlder}
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
                  // 自分のメッセージのみ削除可（コメント・写真/音声付き記録とも）。
                  // 家族の誤削除を防ぐため他人のメッセージには出さない
                  m.isMine ? () => setPendingDelete(m) : undefined
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
        {!text.trim() && (
          <p className="pb-1.5 text-center text-xs text-gray-500">
            小さいマイク=声で文字入力　大きいマイク=音声メモをそのまま送信
          </p>
        )}
        <div className="flex items-end gap-1.5">
          <Link
            href={`/records/new?returnTo=%2Ftalk${filterId ? `&field=${encodeURIComponent(filterId)}` : ""}`}
            aria-label="写真で記録"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-green-700 transition-colors active:bg-emerald-100"
          >
            <IconCamera className="h-5.5 w-5.5" />
          </Link>
          {/* テキスト入力。中の小さいマイクは「音声入力」（音声→文字起こし）で、
              右端の大きいマイク（トランシーバー=音声メモ送信）とは別機能 */}
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-gray-100 pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-emerald-400">
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
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <VoiceInputButton
              onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))}
              disabled={sending}
              className="shrink-0"
            />
          </div>
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

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {pendingDelete?.kind === "record" ? "この記録を削除しますか？" : "このメッセージを削除しますか？"}
          </AlertDialogTitle>
          {pendingDelete && (
            <AlertDialogDescription>{deleteExtrasText(pendingDelete)}</AlertDialogDescription>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting}>
              {deleting ? "削除中…" : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      className="flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
    >
      <IconSprout className="h-3 w-3" />
      {m.fieldName}
    </button>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={fadeRise}>
      {showDate && (
        <div className="flex justify-center py-2.5">
          <span className="rounded-full bg-black/10 px-3 py-1 text-[10px] font-semibold text-gray-600">
            {m.dateLabel}
          </span>
        </div>
      )}
      <div className={`flex items-end gap-2 pb-1.5 ${m.isMine ? "justify-end" : ""}`}>
        {!m.isMine && (
          <span className="w-8 shrink-0">
            {showAuthor && <MemberAvatar name={m.author} />}
          </span>
        )}
        {m.isMine && (
          <span className="mb-0.5 flex shrink-0 flex-col items-end gap-1.5">
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="このメッセージを削除"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition-colors active:bg-red-50 active:text-red-500"
              >
                <IconTrash className="h-4.5 w-4.5" />
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
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <IconCamera className="h-3 w-3" />
                      {m.photoCount}枚
                    </span>
                  )}
                  {/* スレッドの存在を明示（返信の履歴は元記録に集約されている） */}
                  {m.commentCount != null && m.commentCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      <IconChat className="h-3 w-3" />
                      返信{m.commentCount}件
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!m.isMine && <span className="mb-0.5 shrink-0 text-[9px] text-gray-400">{m.timeLabel}</span>}
      </div>
    </motion.div>
  );
}
