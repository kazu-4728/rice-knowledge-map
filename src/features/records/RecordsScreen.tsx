"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "../../lib/motion/variants";
import { ISSUE_POINT_TYPES } from "../../lib/data/records";
import { TYPE_LABELS } from "../map/mapPins";
import { consumeJustSaved } from "./recordDraft";
import { isUnresolvedIssue } from "../../lib/data/records";
import type { RecordItem } from "../../types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { CATEGORY_BADGE, CATEGORY_THEME } from "../../components/ui/categoryStyles";
import { StatHero } from "../../components/patterns/StatHero";
import { RevealCard } from "../../components/patterns/RevealCard";
import { useRecordsList, type RecordsFilterLabel } from "./hooks/useRecordsList";
import {
  IconCamera,
  IconDrop,
  IconMic,
  IconPin,
  IconSearch,
  IconSprout,
} from "../../components/ui/icons";

const filterChips: { label: RecordsFilterLabel; Icon: typeof IconCamera | null }[] = [
  { label: "すべて", Icon: null },
  { label: "写真", Icon: IconCamera },
  { label: "音声", Icon: IconMic },
  { label: "作業", Icon: IconSprout },
  { label: "水管理", Icon: IconDrop },
];

/** 未対応・要確認のみ写真上に対応状況バッジを出す（解決済み/経過観察は既定状態のため出さない） */
const STATUS_BADGE: Partial<Record<RecordItem["status"], { label: string; cls: string }>> = {
  open: { label: "未対応", cls: "border-transparent bg-red-600 text-white" },
  needs_check: { label: "要確認", cls: "border-transparent bg-amber-500 text-white" },
};

const thumbVariant = (record: RecordItem) =>
  record.category === "作業" ? ("grass" as const) : record.category === "異常" ? ("sprout" as const) : ("water" as const);

export default function RecordsScreen() {
  const searchParams = useSearchParams();
  const pointFilter = searchParams.get("point");
  const fieldFilter = searchParams.get("field");
  // status=open は「未対応（open / needs_check）」をまとめて表示する
  const statusFilter = searchParams.get("status");

  const [filter, setFilter] = useState<RecordsFilterLabel>("すべて");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const { mode, records, groups, thumbUrls, categoryCounts } = useRecordsList({
    pointFilter,
    fieldFilter,
    statusFilter,
    filterChip: filter,
    query,
  });

  useEffect(() => {
    // 保存直後の遷移ならトーストを出す
    if (consumeJustSaved()) setToast("記録を保存しました");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    return records.filter((r) => r.date.startsWith(ym)).length;
  }, [records]);

  return (
    <div className="px-3 pb-6 pt-3">
      {/* 主役ヒーロー: 記録の積み重ねを可視化 */}
      {mode !== "loading" && records.length > 0 && (
        <motion.div initial="hidden" animate="show" variants={staggerItem} className="mb-3">
          <StatHero
            eyebrow="Records"
            stats={[
              { label: "読み込み済み", value: records.length },
              { label: "読み込み分・今月", value: thisMonthCount },
              { label: "表示中", value: groups.reduce((s, g) => s + g.items.length, 0) },
            ]}
            trendBars={categoryCounts.map(({ cat, count }) => ({
              label: cat,
              count,
              color: CATEGORY_THEME[cat].dot,
            }))}
          />
        </motion.div>
      )}

      {/* ピン/田んぼ/未対応 絞り込みバナー */}
      {(pointFilter || fieldFilter || statusFilter === "open") && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
          <p className="text-sm font-semibold text-green-800">
            {statusFilter === "open"
              ? "未対応の記録を表示中"
              : fieldFilter
                ? "この田んぼの記録を表示中"
                : "このピンの記録を表示中"}
          </p>
          <Link href="/records" className="text-xs font-bold text-green-700 underline">
            解除
          </Link>
        </div>
      )}

      {/* フィルターチップ */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-[0_8px_24px_-14px_rgba(16,40,28,0.18)]">
        {filterChips.map(({ label, Icon }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
              filter === label
                ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.6)]"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* 検索バー */}
      <div className="mt-3">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <IconSearch className="h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードで検索（圃場名・作業内容など）"
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
        </label>
      </div>

      {/* 未ログイン */}
      {mode === "anon" && (
        <Link href="/login?redirect=%2Frecords" className="mt-8 block rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">ログインすると家族の記録が表示されます</p>
          <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
        </Link>
      )}

      {/* 取得失敗 */}
      {mode === "error" && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">記録を読み込めませんでした</p>
          <p className="mt-1 text-xs text-gray-500">通信環境を確認して開き直してください</p>
        </div>
      )}

      {/* 記録がまだ1件もないとき */}
      {mode === "live" && records.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-base font-bold text-gray-900">最初の記録を作りましょう</p>
          <p className="mt-1 text-xs text-gray-500">田んぼの様子を写真で残すと、ここに一覧で並びます</p>
          <Button asChild variant="primary" size="lg" className="mt-4">
            <Link href="/records/new?returnTo=%2Frecords">
              <IconCamera className="h-5 w-5" />
              写真で記録する
            </Link>
          </Button>
        </div>
      )}

      {/* 絞り込み結果が空のとき */}
      {records.length > 0 && groups.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">該当する記録がありません</p>
          <p className="mt-1 text-xs text-gray-500">条件を変えて試してください</p>
        </div>
      )}

      {/* 保存完了トースト */}
      {toast && (
        <div className="fixed bottom-24 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="rounded-xl bg-gray-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg pointer-events-auto">
            {toast}
          </div>
        </div>
      )}

      {/* 読み込み中 */}
      {mode === "loading" && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* 日付グループ（写真主体のメディアカード。田んぼ詳細の記録タブと同じ見た目） */}
      {groups.map((group, gi) => (
        <RevealCard key={group.date} as="section" delay={gi * 0.04} className="mt-5">
          <div className="flex items-center gap-2 px-1">
            <span className="h-px w-4 shrink-0 bg-emerald-600" />
            <h2 className="shrink-0 font-heading text-sm font-bold text-gray-800">{group.date}</h2>
            <span className="h-px flex-1 bg-gray-200" />
            <span className="shrink-0 text-xs text-gray-400">{group.items.length}件</span>
          </div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="mt-2.5 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            {group.items.map((record) => {
              const statusBadge = ISSUE_POINT_TYPES.includes(record.pointType)
                ? STATUS_BADGE[record.status]
                : undefined;
              return (
                <motion.div key={record.id} variants={staggerItem}>
                  <Link href={`/records/${record.id}`} className="block transition-transform active:scale-[0.99]">
                    <Card accent={isUnresolvedIssue(record) ? "issue" : undefined} className="overflow-hidden">
                      <div className="relative h-36">
                        <RecordThumb
                          media={record.media}
                          variant={thumbVariant(record)}
                          duration={record.audioDuration}
                          thumbUrl={thumbUrls[record.id]}
                          className="h-full w-full"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className={`absolute left-3 top-3 ${CATEGORY_BADGE[record.category]}`}>
                          {record.category}
                        </Badge>
                        {statusBadge && (
                          <Badge className={`absolute right-3 top-3 ${statusBadge.cls}`}>
                            {statusBadge.label}
                          </Badge>
                        )}
                        <span className="absolute bottom-2 right-3 text-xs font-bold text-white drop-shadow">
                          {record.time}
                        </span>
                      </div>
                      <CardContent className="px-3.5 py-2.5">
                        <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <IconPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {record.fieldName}
                            {record.fieldArea && `（${record.fieldArea}）`}
                            {record.pointName
                              ? `・${record.pointName}`
                              : record.pointId && TYPE_LABELS[record.pointType]
                                ? `・${TYPE_LABELS[record.pointType]}`
                                : ""}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </RevealCard>
      ))}
    </div>
  );
}
