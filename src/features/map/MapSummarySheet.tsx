"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { loadFieldAttention, type FieldAttention } from "../../lib/data/fieldAttention";
import { loadHasAnyRecord } from "../../lib/data/records";
import { useAuth } from "../../features/auth/useAuth";
import { getSeasonPhase } from "../../lib/season";

import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  IconCamera,
  IconChevronRight,
  IconFieldGrid,
  IconUser,
  IconWarningFill,
  SEASON_ICONS,
} from "../../components/ui/icons";

type Props = {
  visible: boolean;
  onExpandChange?: (expanded: boolean) => void;
  /** 「最初の田んぼを登録する」CTAタップ時。同一ページ内のMapCanvasの場所合わせを起動する（Issue #69） */
  onRegisterField: () => void;
};

type NextAction =
  | { kind: "login" }
  | { kind: "register" }
  | { kind: "firstRecord" }
  | { kind: "issue"; href: string; label: string; sub?: string }
  | { kind: "season"; label: string; sub: string };

/**
 * 現場OS下部のサマリーシート（Issue #67: ホーム+マップ統合、Issue #69: 初回利用者向けCTA）。
 * 「次の一手」は5状態の優先順位で1つに絞る:
 * 未ログイン > 田んぼ未登録 > 記録なし > 未対応の異常あり > 通常時（季節ヒント）。
 * 初回状態（未ログイン/田んぼ未登録/記録なし）では「現在状態」「要注意の田んぼ」を出さない
 * （0件・空リストが並ぶだけで意味がないため）。
 * 「今日の流れ」「メニュー」は主ナビ本体にあるため、シート内に重複導線は置かない。
 * 記録の起点はマップ右下のFAB（写真/音声/異常報告）に一本化する。
 * 配色はフェーズ1のデザイントークン（クリーム地・深緑・白+状態チップのみアクセント）。
 */
export default function MapSummarySheet({ visible, onExpandChange, onRegisterField }: Props) {
  const { configured, loading: authLoading, session } = useAuth();
  const [fieldCount, setFieldCount] = useState(0);
  const [attentionFields, setAttentionFields] = useState<FieldAttention[]>([]);
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [hasAnyRecord, setHasAnyRecord] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 未対応の異常/要確認レコードを田んぼ単位で取得（次の一手・要注意リストの両方に使う）
    // 記録の有無（0件判定）も同時に取得する（Issue #69）
    Promise.all([loadFieldAttention(), loadHasAnyRecord()])
      .then(([summary, hasRecord]) => {
        if (cancelled) return;
        setOpenIssueCount(summary.openIssueCount);

        // 取得失敗時は空データを「田んぼ0枚」として見せず、サマリー自体を出さない
        if (summary.mode === "error") {
          setErrored(true);
          return;
        }

        setFieldCount(summary.fields.length);
        setAttentionFields(summary.attentionFields);
        setHasAnyRecord(hasRecord);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
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

  // 次の一手（優先順位1つに絞る。Issue #69）:
  // 1.未ログイン 2.田んぼ未登録 3.記録なし 4.未対応異常あり 5.通常時（季節ヒント）
  const nextAction: NextAction | null = useMemo(() => {
    if (authLoading) return null;
    if (configured && !session) return { kind: "login" };
    if (!loaded) return null;
    if (fieldCount === 0) return { kind: "register" };
    if (hasAnyRecord === false) return { kind: "firstRecord" };
    if (openIssueCount !== null && openIssueCount > 0) {
      const top = attentionFields[0];
      return {
        kind: "issue",
        // TODO(フェーズ2残課題): 現状は記録一覧への遷移。理想は最優先の田んぼへ
        // /map?field=... で地図上を直接注視させる導線だが、MapCanvasの初期ナビは
        // マウント時の一度きりの map "load" イベントでのみURLパラメータを読むため、
        // 既にマウント済みの/mapへの遷移では再度flyToされない。次フェーズで対応する。
        href: "/records?status=open",
        label: `未対応の異常を確認する（${openIssueCount}件）`,
        sub: top?.name ? `まずは「${top.name}」から` : undefined,
      };
    }
    return { kind: "season", label: season.label, sub: season.hint };
  }, [authLoading, configured, session, loaded, fieldCount, hasAnyRecord, openIssueCount, attentionFields, season]);

  // 初回状態（未ログイン/田んぼ未登録/記録なし）では現在状態・要注意一覧を出さない
  const isOnboarding =
    nextAction?.kind === "login" || nextAction?.kind === "register" || nextAction?.kind === "firstRecord";

  if (!visible || errored) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={`flex flex-col rounded-t-3xl bg-white/95 shadow-[0_-8px_32px_-8px_rgba(20,60,40,0.22)] backdrop-blur ${
            expanded ? "max-h-[72dvh]" : "max-h-[11.5rem]"
          } overflow-hidden`}
        >
          {/* ピークヘッダー（常時表示。現在状態の要約。初回状態では展開しても中身がないため非活性表示） */}
          {isOnboarding ? (
            <div className="w-full shrink-0 pt-2.5">
              <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />
              <div className="flex items-center px-5 py-3">
                <span className="font-heading text-lg font-bold leading-none text-gray-900">
                  {nextAction?.kind === "login" && "はじめましょう"}
                  {nextAction?.kind === "register" && "田んぼを登録しましょう"}
                  {nextAction?.kind === "firstRecord" && "最初の記録を残しましょう"}
                </span>
              </div>
            </div>
          ) : (
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
          )}

          {/* 次の一手（折りたたみ時も見える。5状態から1つに絞る） */}
          {nextAction && (
            <div className="shrink-0 px-4 pb-3">
              {nextAction.kind === "login" && (
                <Link
                  href="/login?redirect=%2Fmap"
                  className="flex items-center gap-3 rounded-2xl bg-flow-green px-4 py-3 text-white transition-transform active:scale-[0.98]"
                >
                  <IconUser className="h-6 w-6 shrink-0 text-white/85" />
                  <span className="min-w-0 flex-1 text-base font-bold">ログインして始める</span>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                </Link>
              )}
              {nextAction.kind === "register" && (
                <button
                  onClick={onRegisterField}
                  className="flex w-full items-center gap-3 rounded-2xl bg-flow-green px-4 py-3 text-left text-white transition-transform active:scale-[0.98]"
                >
                  <IconFieldGrid className="h-6 w-6 shrink-0 text-white/85" />
                  <span className="min-w-0 flex-1 text-base font-bold">最初の田んぼを登録する</span>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                </button>
              )}
              {nextAction.kind === "firstRecord" && (
                <Link
                  href="/records/new?returnTo=%2Fmap"
                  className="flex items-center gap-3 rounded-2xl bg-flow-green px-4 py-3 text-white transition-transform active:scale-[0.98]"
                >
                  <IconCamera className="h-6 w-6 shrink-0 text-white/85" />
                  <span className="min-w-0 flex-1 text-base font-bold">最初の記録を残す</span>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                </Link>
              )}
              {nextAction.kind === "issue" && (
                <Link
                  href={nextAction.href}
                  className="flex items-center gap-3 rounded-2xl bg-flow-green px-4 py-3 text-white transition-transform active:scale-[0.98]"
                >
                  <IconWarningFill className="h-6 w-6 shrink-0 text-amber-300" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold">{nextAction.label}</span>
                    {nextAction.sub && (
                      <span className="mt-0.5 block truncate text-xs text-white/75">{nextAction.sub}</span>
                    )}
                  </span>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                </Link>
              )}
              {nextAction.kind === "season" && (
                <div className="flex items-center gap-3 rounded-2xl bg-flow-cream px-4 py-3">
                  {(() => {
                    const SeasonIcon = SEASON_ICONS[season.iconKey];
                    return <SeasonIcon className="h-6 w-6 shrink-0 text-flow-green" />;
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">{nextAction.label}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{nextAction.sub}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 展開コンテンツ（折りたたみ時は描画しない。初回状態では中身自体を出さない） */}
          {!isOnboarding && (
            <div
              className={`min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${expanded ? "" : "hidden"}`}
            >
              {/* 現在状態（大型タイポ・信号色） */}
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
                <section>
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
