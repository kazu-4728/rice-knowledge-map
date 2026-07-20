"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadFieldAttention, type FieldAttentionSummary } from "../../lib/data/fieldAttention";
import { loadRecords } from "../../lib/data/records";
import { loadImageSlots } from "../../lib/data/siteContent";
import { resolveRecordCoverUrl } from "../../lib/data/media";
import type { ImageSlots } from "../../lib/supabase/types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { StartChecklist } from "./StartChecklist";
import { HomeShareSheet } from "./HomeShareSheet";
import type { RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconMic,
  IconPinFill,
  IconShare,
} from "../../components/ui/icons";

/**
 * ログイン後ホーム（/）＝今日のダッシュボード専用（再設計フェーズ5・現場モード）。
 * 構成は 田んぼ状態チップ・記録ボタン・最近の記録 のみに絞り、
 * 課題提起・機能紹介などのLP要素は置かない（未ログインのLandingScreenだけが持つ）。
 */
export default function HomeDashboard() {
  const [attention, setAttention] = useState<FieldAttentionSummary | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});

  useEffect(() => {
    let cancelled = false;
    loadImageSlots().then((slots) => {
      if (!cancelled) setImageSlots(slots);
    });
    loadFieldAttention().then((summary) => {
      if (cancelled || summary.mode === "anon" || summary.mode === "error") return;
      setAttention(summary);
    });
    loadRecords({ limit: 5 }).then((data) => {
      if (cancelled) return;
      setRecordsLoaded(true);
      if (data.mode === "anon" || data.mode === "error") return;
      setRecords(data.records);
      setThumbs(data.thumbUrls);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = useCallback(() => setShareOpen(true), []);

  const hasField = attention ? attention.fields.length > 0 : null;

  /** 田んぼ状態チップ（issue > needs_check > normal の優先順で信号色を出す） */
  const fieldChips =
    attention?.fields.map((f) => {
      const a = attention.attentionFields.find((af) => af.id === f.id);
      const status: "issue" | "needs_check" | "normal" = a?.issueCount
        ? "issue"
        : a?.needsCheckCount
          ? "needs_check"
          : "normal";
      return { id: f.id, name: f.name, status };
    }) ?? [];

  return (
    <div className="min-h-full space-y-4 bg-flow-cream px-3 pb-6 pt-3">
      {/* 田んぼ状態チップ */}
      <section>
        <div className="flex items-center justify-between px-1 pb-2">
          <h1 className="font-heading text-lg font-bold text-gray-900">今日の田んぼ</h1>
          <Link href="/map" className="flex items-center gap-0.5 text-xs font-bold text-flow-green">
            マップで見る
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {attention === null ? (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        ) : fieldChips.length > 0 ? (
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {fieldChips.map((f) => (
              <Link
                key={f.id}
                href={`/fields/${encodeURIComponent(f.id)}`}
                className="flex shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-white py-2 pl-2.5 pr-3.5 shadow-sm transition-transform active:scale-95"
              >
                <StatusBadge status={f.status} className="border-0 px-1.5" label="" />
                <span className="text-sm font-bold text-gray-800">{f.name || "名前のない田んぼ"}</span>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/map?register=1"
            className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-98"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flow-green-soft">
              <IconPinFill className="h-5 w-5 text-flow-green" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">まずは田んぼを登録しましょう</p>
              <p className="mt-0.5 text-xs text-gray-500">マップで輪郭をなぞるだけで登録できます</p>
            </div>
            <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-300" />
          </Link>
        )}
      </section>

      {/* 記録ボタン */}
      <section className="flex gap-2.5">
        <Link
          href="/records/new?returnTo=%2Frecords"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-flow-green py-4 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(6,78,59,0.55)] transition-transform active:scale-98"
        >
          <IconCamera className="h-5 w-5" />
          写真で記録
        </Link>
        <Link
          href="/records/new?type=audio&returnTo=%2Frecords"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-flow-green/25 bg-white py-4 text-sm font-bold text-flow-green shadow-sm transition-transform active:scale-98"
        >
          <IconMic className="h-5 w-5" />
          音声メモ
        </Link>
        {hasField === true && (
          <button
            type="button"
            onClick={handleShare}
            aria-label="共有する"
            className="flex shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-gray-600 shadow-sm transition-transform active:scale-95"
          >
            <IconShare className="h-5 w-5" />
          </button>
        )}
      </section>

      {/* 最近の記録 */}
      <section>
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="font-heading text-sm font-bold text-gray-800">最近の記録</h2>
          <Link href="/records" className="flex items-center gap-0.5 text-xs font-bold text-flow-green">
            すべて見る
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!recordsLoaded ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : records.length > 0 ? (
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/records/${r.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm transition-transform active:scale-98"
                >
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl">
                    <RecordThumb
                      media={r.media}
                      thumbUrl={thumbs[r.id]}
                      fallbackUrl={resolveRecordCoverUrl(undefined, r.category, imageSlots)}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{r.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {r.fieldName}・{r.date} {r.time}
                    </p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">まだ記録がありません</p>
            <p className="mt-1 text-xs text-gray-500">上のボタンから今日の様子を残してみましょう</p>
          </div>
        )}
      </section>

      {/* 初回利用時のみのチェックリスト（唯一の案内レイヤー） */}
      <StartChecklist onShareClick={hasField ? handleShare : undefined} />

      <HomeShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
