"use client";

import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
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
  IconCamera,
  IconChat,
  IconChevronRight,
  IconFieldGrid,
  IconHome,
  IconPin,
  IconWarningFill,
  SEASON_ICONS,
} from "../../components/ui/icons";

type AttentionField = FieldAttention;

type NextAction = {
  key: string;
  Icon: (props: { className?: string }) => JSX.Element;
  label: string;
  sub?: string;
  href: string;
  tone: "alert" | "normal";
};

type Props = {
  visible: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

/**
 * マップ下部のダークガラス・サマリーシート（田んぼOS レイヤー2+6）
 * 折りたたみ時はピークバー、展開時はネクストアクション+状態サマリー+最近の記録。
 */
export default function MapSummarySheet({ visible, onExpandChange }: Props) {
  const [fieldCount, setFieldCount] = useState(0);
  const [attentionFields, setAttentionFields] = useState<AttentionField[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 未対応の異常/要確認レコードを田んぼ単位で取得（バッジ件数と要注意リストの両方に使う）
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

  // 信号色の合計（大型タイポのサマリー用）
  const totals = useMemo(() => {
    let issue = 0;
    let needsCheck = 0;
    attentionFields.forEach((f) => {
      issue += f.issueCount;
      needsCheck += f.needsCheckCount;
    });
    return { issue, needsCheck };
  }, [attentionFields]);

  // ネクストアクション（レイヤー6: 次に何をすべきかを常に示す）
  const nextActions = useMemo((): NextAction[] => {
    const actions: NextAction[] = [];
    const SeasonIcon = SEASON_ICONS[season.iconKey];
    if (openIssueCount !== null && openIssueCount > 0) {
      const top = attentionFields[0];
      actions.push({
        key: "issues",
        Icon: IconWarningFill,
        label: `未対応を確認する（${openIssueCount}件）`,
        sub: top?.name ? `まずは「${top.name}」から` : undefined,
        href: "/records?status=open",
        tone: "alert",
      });
    }
    const latest = recentRecords[0];
    const today = new Date();
    const hasTodayRecord =
      !!latest &&
      new Date(latest.recordedAt).toDateString() === today.toDateString();
    if (!hasTodayRecord) {
      actions.push({
        key: "today-record",
        Icon: IconCamera,
        label: "今日の記録を残す",
        sub: `${season.label}: ${season.action}`,
        href: "/records/new?returnTo=%2Fmap",
        tone: "normal",
      });
    } else {
      actions.push({
        key: "season",
        Icon: SeasonIcon,
        label: season.action,
        sub: `いまは「${season.label}」の時期`,
        href: "/records/new?returnTo=%2Fmap",
        tone: "normal",
      });
    }
    return actions.slice(0, 2);
  }, [openIssueCount, attentionFields, recentRecords, season]);

  if (!visible || errored) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={`flex flex-col rounded-t-3xl glass-light-strong ${
            expanded ? "max-h-[72dvh]" : "max-h-[9.5rem]"
          } overflow-hidden`}
        >
          {/* ピークヘッダー（常時表示。折りたたみ時も「次にやること」が1件見えるようにする） */}
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
            {/* 折りたたみ時のピーク表示: 展開せずとも「次にやること」の先頭1件が見える */}
            {!expanded && loaded && nextActions[0] && (
              <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                {(() => {
                  const PeekIcon = nextActions[0].Icon;
                  return <PeekIcon className="h-5 w-5 shrink-0 text-emerald-700" />;
                })()}
                <span className="min-w-0 flex-1 truncate text-left text-sm font-bold text-gray-800">
                  {nextActions[0].label}
                </span>
                <IconChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>
            )}
          </button>

          {/* 展開コンテンツ（折りたたみ時は描画しない: ピークバーからのはみ出し防止） */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${expanded ? "" : "hidden"}`}
          >
            {/* ネクストアクション（次に何をすべきか） */}
            <section className="mb-4">
              <h3 className="pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                次にやること
              </h3>
              <ul className="space-y-2">
                {nextActions.map((a) => (
                  <li key={a.key}>
                    <Link
                      href={a.href}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-transform active:scale-[0.98] ${
                        a.tone === "alert"
                          ? "border-red-200 bg-red-50"
                          : "border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      <a.Icon className={`h-6 w-6 shrink-0 ${a.tone === "alert" ? "text-red-600" : "text-emerald-700"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-gray-900">
                          {a.label}
                        </span>
                        {a.sub && (
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {a.sub}
                          </span>
                        )}
                      </span>
                      <IconChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* 状態サマリー（大型タイポ・信号色） */}
            <section className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: "田んぼ", value: fieldCount, unit: "枚", color: "text-gray-900" },
                { label: "異常", value: totals.issue, unit: "件", color: totals.issue > 0 ? "text-red-600" : "text-gray-300" },
                { label: "要確認", value: totals.needsCheck, unit: "件", color: totals.needsCheck > 0 ? "text-amber-600" : "text-gray-300" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    要注意の田んぼ
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {attentionFields.slice(0, 3).map((af) => (
                    <li key={af.id}>
                      <Link
                        href={`/fields/${encodeURIComponent(af.id)}`}
                        className="flex items-center gap-2.5 rounded-2xl bg-gray-50 px-3.5 py-3 transition-colors active:bg-gray-100"
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

            {/* 最近の記録 */}
            {recentRecords.length > 0 && (
              <section>
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    最近の記録
                  </h3>
                  <Link
                    href="/talk"
                    className="flex items-center gap-0.5 text-xs font-bold text-emerald-700"
                  >
                    トークで見る
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="space-y-1">
                  {recentRecords.map((record) => (
                    <li key={record.id}>
                      <Link
                        href={`/records/${record.id}`}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors active:bg-gray-100"
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

            {/* 3空間へのクイックリンク */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { href: "/talk", label: "トーク", Icon: IconChat },
                { href: "/home", label: "管理", Icon: IconHome },
                { href: "/fields", label: "田んぼ一覧", Icon: IconFieldGrid },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3 text-xs font-bold text-gray-700 transition-colors active:bg-gray-100"
                >
                  <Icon className="h-5.5 w-5.5 text-emerald-600" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
