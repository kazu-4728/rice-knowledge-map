"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { fadeRise } from "../../lib/motion/variants";
import { deleteComment, sendTalkText, type TalkMessage } from "../../lib/data/talk";
import { deleteRecord } from "../../lib/data/recordDetail";
import { useToast } from "../../components/ui/Toast";
import { MemberAvatar } from "../../components/ui/avatar";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import { Chip } from "../../components/ui/Chip";
import { TYPE_TO_CATEGORY } from "../../lib/data/records";
import { TALK_SEEN_KEY } from "../home/StartChecklist";
import { FlowGuide } from "../flow/FlowGuide";
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
  IconDrop,
  IconMic,
  IconPlayFill,
  IconSprout,
  IconTrash,
  IconWarningFill,
} from "../../components/ui/icons";

/** 記録カテゴリ（既存の記録一覧と同じ4分類）+「会話」。みんなの記録のフィルターチップに使う */
type FlowCategory = "すべて" | "作業" | "水管理" | "異常" | "音声" | "会話";

const CATEGORY_CHIPS: { label: FlowCategory; icon: typeof IconSprout | null }[] = [
  { label: "すべて", icon: null },
  { label: "作業", icon: IconSprout },
  { label: "水管理", icon: IconDrop },
  { label: "異常", icon: IconWarningFill },
  { label: "音声", icon: IconMic },
  { label: "会話", icon: IconChat },
];

/**
 * メッセージの分類を判定する（記録はrecord_type→カテゴリ表、コメントは「会話」固定）。
 * record_type='other' は入力バーから送った「ひとこと」テキスト（sendTalkText）のため、
 * records.ts の TYPE_TO_CATEGORY（/records用、other→作業）とは別に「会話」として扱う。
 */
function messageCategory(m: TalkMessage): FlowCategory {
  if (m.kind === "comment" || m.recordType === "other") return "会話";
  const type = (m.recordType ?? "other") as keyof typeof TYPE_TO_CATEGORY;
  return TYPE_TO_CATEGORY[type] ?? "作業";
}

/**
 * 「みんなの記録」（田んぼOSのトーク+記録を統合した空間。家族に限らず作業仲間も含む）。
 * 全田んぼの記録・コメントが1本のタイムラインに時系列で流れる。
 * メッセージの田んぼチップをタップするとその田んぼだけに絞り込める
 * （別ルームは作らない: どこの履歴か分からなくなるのを防ぐ）。
 */

export default function TalkScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [filterId, setFilterId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FlowCategory>("すべて");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TalkMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const timeline = useTalkTimeline(filterId);
  const { mode, messages, hasMore, fields, loadingOlder, reload, loadOlder, stickToBottomRef } = timeline;

  const filterName = filterId ? fields.find((f) => f.id === filterId)?.name ?? null : null;

  const filteredMessages =
    categoryFilter === "すべて" ? messages : messages.filter((m) => messageCategory(m) === categoryFilter);

  // 初期表示・新着時に最下部へスクロール
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottomRef]);

  // ホームの「はじめての流れ」チェックリスト用: この画面を開いたことを記録する
  useEffect(() => {
    try {
      localStorage.setItem(TALK_SEEN_KEY, "1");
    } catch {
      // 記録できない環境ではチェックリストの達成表示だけが付かない（実害なし）
    }
  }, []);

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
        <p className="text-base font-bold text-gray-900">ログインするとみんなの記録が表示されます</p>
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
        <p className="text-sm text-gray-600">みんなの記録を読み込めませんでした。通信環境を確認してください。</p>
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
    <div className="flex h-full flex-col bg-flow-cream">
      {/* 画面タイトル（文字階層1）。ブロックは タイトル/チップ/タイムライン/入力バー の4つに収める */}
      <div className="shrink-0 px-4 pb-1 pt-3">
        <h1 className="font-heading text-lg font-bold text-gray-900">みんなの記録</h1>
      </div>

      {/* 使い方の流れの現在地（ステップ3）。この画面の役割と次の行き先を常設表示する */}
      <div className="shrink-0 px-3 pb-1">
        <FlowGuide current="talk" />
      </div>

      {/* カテゴリ絞り込みチップ */}
      <div className="shrink-0">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORY_CHIPS.map(({ label, icon: Icon }) => (
            <Chip
              key={label}
              active={categoryFilter === label}
              onClick={() => setCategoryFilter(label)}
              icon={Icon ? <Icon className="h-3.5 w-3.5" /> : undefined}
            >
              {label}
            </Chip>
          ))}
        </div>

        {/* 田んぼ絞り込みチップ */}
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
          <Chip active={filterId === null} onClick={() => setFilterId(null)}>
            すべての田んぼ
          </Chip>
          {fields.map((f) => (
            <Chip
              key={f.id}
              active={filterId === f.id}
              onClick={() => setFilterId((cur) => (cur === f.id ? null : f.id))}
              icon={<IconSprout className="h-3.5 w-3.5" />}
            >
              {f.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* タイムライン */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {mode === "loading" ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="ml-14 h-16 rounded-2xl" />
            <Skeleton className="ml-14 h-40 rounded-2xl" />
            <Skeleton className="ml-14 h-16 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* 絞り込みで現在ページに一致がなくても、hasMoreなら過去ページに
                一致がある可能性があるため空状態と排他にしない */}
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
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-flow-green-soft text-flow-green">
                  <IconSprout className="h-7 w-7" />
                </span>
                <p className="text-sm font-bold text-gray-700">
                  {categoryFilter !== "すべて"
                    ? `「${categoryFilter}」のやり取りはまだありません`
                    : filterName
                      ? `「${filterName}」のやり取りはまだありません`
                      : "まだやり取りがありません"}
                </p>
                <p className="text-xs text-gray-500">
                  {hasMore ? "上の「以前のやり取りを見る」から遡れます" : "下のカメラやマイクから、最初の記録を送ってみましょう"}
                </p>
              </div>
            ) : (
              filteredMessages.map((m, i) => (
                <TimelineEntry
                  key={m.key}
                  message={m}
                  showDate={i === 0 || filteredMessages[i - 1].dateLabel !== m.dateLabel}
                  isLast={i === filteredMessages.length - 1}
                  onOpen={() => router.push(`/records/${m.recordId}`)}
                  onFieldTap={(id) => setFilterId(id)}
                  onDelete={
                    // 自分のメッセージのみ削除可（コメント・写真/音声付き記録とも）。
                    // 家族の誤削除を防ぐため他人のメッセージには出さない
                    m.isMine ? () => setPendingDelete(m) : undefined
                  }
                />
              ))
            )}
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flow-green-soft text-flow-green transition-colors active:bg-flow-green-soft/70"
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
              placeholder={filterName ? `${filterName}へひとこと…` : "みんなへひとこと…"}
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flow-green text-white transition-transform active:scale-95 disabled:opacity-50"
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

/**
 * タイムラインの1エントリ（縦タイムライン構造）。
 * 左に時刻の軸（時刻+ノード+縦線）、右に統一カード。自分/他人で左右を振り分けない
 * （チャットではなく「今日の出来事の流れ」として全員分を1本の軸に載せる）。
 */
function TimelineEntry({
  message: m,
  showDate,
  isLast,
  onOpen,
  onFieldTap,
  onDelete,
}: {
  message: TalkMessage;
  showDate: boolean;
  /** 最後のエントリは軸の縦線を伸ばさない */
  isLast: boolean;
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
      className="flex items-center gap-1 rounded-full bg-flow-green-soft px-2 py-0.5 text-[10px] font-bold text-flow-green"
    >
      <IconSprout className="h-3 w-3" />
      {m.fieldName}
    </button>
  );

  const openHandlers = {
    role: "button" as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: React.KeyboardEvent) => {
      // audio等のネストしたフォーカス可能要素のkeydownまで拾わないよう、
      // コンテナ自身がフォーカスされている時だけEnter/Spaceを処理する
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    },
  };

  return (
    <motion.div initial="hidden" animate="show" variants={fadeRise}>
      {/* 日付見出し（文字階層2）。モック同様に左寄せ+カレンダーへの導線 */}
      {showDate && (
        <div className="flex items-center justify-between px-1 pb-2 pt-3">
          <span className="font-heading text-sm font-bold text-gray-800">{m.dateLabel}</span>
          <Link href="/calendar" className="text-xs font-semibold text-flow-green">
            カレンダー
          </Link>
        </div>
      )}
      <div className="flex gap-2">
        {/* 時刻の軸 */}
        <span className="w-10 shrink-0 pt-0.5 text-right text-[11px] font-semibold tabular-nums text-gray-500">
          {m.timeLabel}
        </span>
        <span className="relative w-3 shrink-0" aria-hidden>
          <span className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-flow-green" />
          {!isLast && (
            <span className="absolute -bottom-1 left-1/2 top-4 w-px -translate-x-1/2 bg-flow-green/20" />
          )}
        </span>

        {/* 本文カード */}
        <div className="min-w-0 flex-1 pb-4">
          <div className="flex items-center gap-1.5 pb-1">
            <MemberAvatar name={m.author} className="h-5 w-5 text-[9px]" />
            <span className="text-xs font-semibold text-gray-600">{m.author}</span>
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="このメッセージを削除"
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors active:bg-red-50 active:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>

          {m.kind === "comment" ? (
            // fieldChip がボタンのためネストボタンを避け、div+role="button" で代用する
            <div
              {...openHandlers}
              className="cursor-pointer rounded-2xl bg-white px-4 py-3 text-left shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]"
            >
              {/* 返信先の記録を引用表示（どのメッセージへの返信かを明示。タップで元記録=スレッドへ） */}
              {m.recordTitle && (
                <span className="mb-1 block truncate border-l-2 border-flow-green/40 pl-2 text-[11px] text-gray-500">
                  ↩ {m.fieldName ? `${m.fieldName}・` : ""}
                  {m.recordTitle}
                </span>
              )}
              <p className="text-sm leading-relaxed text-gray-800">{m.text}</p>
              {!m.recordTitle && fieldChip && <div className="mt-1.5 flex">{fieldChip}</div>}
            </div>
          ) : (
            <div
              {...openHandlers}
              className="cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]"
            >
              {/* 写真は主役: カード幅いっぱいで統一した比率に切り出す */}
              {m.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- 署名URLの記録写真
                <img src={m.photoUrl} alt="" className="aspect-[16/10] w-full object-cover" />
              )}
              <div className="px-4 py-3">
                <p className="text-sm font-bold leading-snug text-gray-900">{m.title}</p>
                {m.note && m.note !== m.title && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">{m.note}</p>
                )}
                {m.audioUrl && (
                  <div
                    className="mt-2 flex items-center gap-2 rounded-full bg-flow-green-soft py-1.5 pl-1.5 pr-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-flow-green text-white">
                      <IconPlayFill className="h-3.5 w-3.5" />
                    </span>
                    <audio controls preload="none" src={m.audioUrl} className="h-8 w-full min-w-0" />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
      </div>
    </motion.div>
  );
}
