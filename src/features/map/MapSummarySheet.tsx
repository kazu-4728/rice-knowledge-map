"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { loadRecords } from "../../lib/data/records";
import { loadFieldAttention, type FieldAttention } from "../../lib/data/fieldAttention";
import { getSeasonPhase } from "../../lib/season";

import type { RecordItem } from "../../types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  IconChevronRight,
  IconGear,
  IconPin,
  IconWarningFill,
  SEASON_ICONS,
} from "../../components/ui/icons";

type Props = {
  visible: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

/**
 * 現場OS下部のサマリーシート（Issue #67: ホーム+マップ統合）。
 * 「今なにが起きてる? 次なにする?」に答える。記録の起点はマップ右下のFAB
 * （写真/音声/異常報告）に一本化し、シートのCTAは未対応の異常があるときだけ
 * 「未対応を確認」を出す（常設CTAを増やさない）。
 * 配色はフェーズ1のデザイントークン（クリーム地・深緑・白+状態チップのみアクセント）。
 */
export default function MapSummarySheet({ visible, onExpandChange }: Props) {
  const [fieldCount, setFieldCount] = useState(0);
  const [attentionFields, setAttentionFields] = useState<FieldAttention[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 未対応の異常/要確認レコードを田んぼ単位で取得（CTA切替と要注意リストの両方に使う）
    loadFieldAttention().then((summary) => {
      if (cancelled) return;
      setOpenIssueCount(summary.openIssueCount);

      // 取得失敗時は空データを「田んぼ0枚」として見せず、サマリー自体を出さない
      if (summary.mode === "error") {
        setErrored(true);
        return;
      }

      setFieldCount(summary.fields.length);
      setAttentionFields(summary.attentionFields);
      setLoaded(true);
    });

    loadRecords({ limit: 5 }).then((data) => {
      if (cancelled) return;
      setRecentRecords(data.records);
      setThumbUrls(data.thumbUrls);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      onExpandChange?.(next);
      return next;
    });
  }, [onExpandChange]);

  useEffect(() => {
    if (!visible) {
      setExpanded(false);
      onExpandChange?.(false);
    }
  }, [visible, onExpandChange]);

  const season = useMemo(() => getSeasonPhase(), []);

  // 信号色の合計（状態サマリー用）
  const totals = useMemo(() => {
    let issue = 0;
    let needsCheck = 0;
    attentionFields.forEach((f) => {
      issue += f.issueCount;
      needsCheck += f.needsCheckCount;
    });
    return { issue, needsCheck };
  }, [attentionFields]);

  // 異常CTA: 未対応の異常があるときだけ表示する
  // （記録の起点はマップ右下のFABに一本化し、平常時の常設CTAを増やさない）
  const issueCta = useMemo(() => {
    if (openIssueCount === null || openIssueCount === 0) return null;
    const top = attentionFields[0];
    return {
      href: "/records?status=open",
      label: `未対応の異常を確認する（${openIssueCount}件）`,
      sub: top?.name ? `まずは「${top.name}」から` : undefined,
    };
  }, [openIssueCount, attentionFields]);

  if (!visible || errored) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={`flex flex-col rounded-t-3xl bg-white/95 shadow-[0_-8px_32px_-8px_rgba(20,60,40,0.22)] backdrop-blur ${
            expanded ? "max-h-[72dvh]" : "max-h-[10.5rem]"
          } overflow-hidden`}
        >
          {/* ピークヘッダー（常時表示） */}
          <button
            onClick={toggleExpand}
            aria-expanded={expanded}
            className="w-full shrink-0 pt-2.5"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />
            <div className="flex items-center gap-3 px-5 py-3">
              {!loaded ? (
                <>
                  <Skeleton className="h-7 w-24 bg-gray-200" />
                  <Skeleton className="h-5 w-16 bg-gray-100" />
                </>
              ) : (
                <>
                  <span className="font-heading text-2xl font-bold leading-none text-gray-900">
                    {fieldCount}
                    <span className="ml-1 text-sm font-semibold text-gray-500">枚の田んぼ</span>
                  </span>
                  {totals.issue + totals.needsCheck > 0 ? (
                    <StatusBadge
                      status={totals.issue > 0 ? "issue" : "needs_check"}
                      label={`気になる ${totals.issue + totals.needsCheck}`}
                    />
                  ) : (
                    <StatusBadge status="normal" label="すべて順調" />
                  )}
                </>
              )}
              <IconChevronRight
                className={`ml-auto h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                  expanded ? "rotate-90" : "-rotate-90"
                }`}
              />
            </div>
          </button>

          {/* 異常CTA（未対応の異常があるときだけ折りたたみ時も見える） */}
          {loaded && issueCta && (
            <div className="shrink-0 px-4 pb-3">
              <Link
                href={issueCta.href}
                className="flex items-center gap-3 rounded-2xl bg-flow-green px-4 py-3 text-white transition-transform active:scale-[0.98]"
              >
                <IconWarningFill className="h-6 w-6 shrink-0 text-amber-300" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold">{issueCta.label}</span>
                  {issueCta.sub && (
                    <span className="mt-0.5 block truncate text-xs text-white/75">{issueCta.sub}</span>
                  )}
                </span>
                <IconChevronRight className="h-5 w-5 shrink-0 text-white/70" />
              </Link>
            </div>
          )}

          {/* 展開コンテンツ（折りたたみ時は描画しない: ピークバーからのはみ出し防止） */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${expanded ? "" : "hidden"}`}
          >
            {/* 季節の目安（旧ホームの農事暦から移設） */}
            <section className="mb-4 flex items-center gap-3 rounded-2xl bg-flow-cream px-3.5 py-3">
              {(() => {
                const SeasonIcon = SEASON_ICONS[season.iconKey];
                return <SeasonIcon className="h-6 w-6 shrink-0 text-flow-green" />;
              })()}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{season.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{season.hint}</p>
              </div>
            </section>

            {/* 状態サマリー（大型タイポ・信号色） */}
            <section className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: "田んぼ", value: fieldCount, unit: "枚", color: "text-gray-900" },
                { label: "異常", value: totals.issue, unit: "件", color: totals.issue > 0 ? "text-red-600" : "text-gray-300" },
                { label: "要確認", value: totals.needsCheck, unit: "件", color: totals.needsCheck > 0 ? "text-amber-600" : "text-gray-300" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-flow-cream px-3 py-3 text-center">
                  <p className={`font-heading text-3xl font-bold leading-none ${s.color}`}>
                    {s.value}
                    <span className="ml-0.5 text-xs font-semibold text-gray-400">{s.unit}</span>
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </section>

            {/* 要注意の田んぼ */}
            {attentionFields.length > 0 && (
              <section className="mb-4">
                <div className="flex items-center gap-1.5 pb-2">
                  <IconWarningFill className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-gray-500">要注意の田んぼ</h3>
                </div>
                <ul className="space-y-1.5">
                  {attentionFields.slice(0, 3).map((af) => (
                    <li key={af.id}>
                      <Link
                        href={`/fields/${encodeURIComponent(af.id)}`}
                        className="flex items-center gap-2.5 rounded-2xl bg-flow-cream px-3.5 py-3 transition-colors active:bg-flow-cream-strong"
                      >
                        <span className="flex-1 truncate text-sm font-bold text-gray-900">
                          {af.name || "名前のない田んぼ"}
                        </span>
                        {af.issueCount > 0 && (
                          <StatusBadge status="issue" label={`異常${af.issueCount}`} />
                        )}
                        {af.needsCheckCount > 0 && (
                          <StatusBadge status="needs_check" label={`要確認${af.needsCheckCount}`} />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 家族のアクティビティ（詳細は今日の流れに集約されている） */}
            {recentRecords.length > 0 && (
              <section className="mb-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-bold text-gray-500">家族のアクティビティ</h3>
                  <Link
                    href="/talk"
                    className="flex items-center gap-0.5 text-xs font-bold text-flow-green"
                  >
                    今日の流れで見る
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="space-y-1">
                  {recentRecords.map((record) => (
                    <li key={record.id}>
                      <Link
                        href={`/records/${record.id}`}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors active:bg-flow-cream"
                      >
                        <RecordThumb
                          media={record.media}
                          variant={
                            record.category === "作業"
                              ? "grass"
                              : record.category === "異常"
                                ? "sprout"
                                : "water"
                          }
                          duration={record.audioDuration}
                          thumbUrl={thumbUrls[record.id]}
                          className="h-11 w-16 shrink-0 rounded-xl"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {record.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                            <IconPin className="h-3 w-3" />
                            {record.fieldName}
                            <span className="text-gray-300">|</span>
                            {record.time}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 管理レイヤーへの退避導線（カレンダー・エクスポート等はメニューに集約） */}
            <Link
              href="/menu"
              className="flex items-center gap-3 rounded-2xl bg-flow-cream px-3.5 py-3 transition-colors active:bg-flow-cream-strong"
            >
              <IconGear className="h-5 w-5 shrink-0 text-flow-green" />
              <span className="flex-1 text-sm font-bold text-gray-800">
                カレンダー・エクスポートなどの管理メニュー
              </span>
              <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
