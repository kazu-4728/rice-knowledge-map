"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { getSeasonPhase } from "../../lib/season";
import SeasonTimelineBar from "../../components/ui/SeasonTimelineBar";
import SectionHeading from "../../components/ui/SectionHeading";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import TodayStory from "../story/TodayStory";
import { Card } from "../../components/ui/card";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { SectionEyebrow } from "../../components/patterns/SectionEyebrow";
import { RevealCard } from "../../components/patterns/RevealCard";
import { PlotGlowMap, type PlotGlowField } from "../../components/patterns/PlotGlowMap";
import { useHomeSummary } from "./hooks/useHomeSummary";
import { fadeRise } from "../../lib/motion/variants";
import {
  IconCamera,
  IconChevronRight,
  IconFieldGrid,
  IconMap,
  IconChat,
  IconPin,
  IconWarningFill,
  SEASON_ICONS,
} from "../../components/ui/icons";

export default function HomeScreen() {
  const { attention, recentRecords, thumbUrls, recordsMode, loaded, loadError, isAnon, heroImageUrl } = useHomeSummary();
  const season = useMemo(() => getSeasonPhase(), []);
  const SeasonIcon = SEASON_ICONS[season.iconKey];

  const attentionFieldIds = useMemo(() => {
    const m = new Map(attention?.attentionFields.map((f) => [f.id, f]) ?? []);
    return m;
  }, [attention]);

  const plotFields: PlotGlowField[] = useMemo(() => {
    if (!attention) return [];
    return attention.fields.map((f) => {
      const a = attentionFieldIds.get(f.id);
      const status: PlotGlowField["status"] = a?.issueCount ? "issue" : a?.needsCheckCount ? "needs_check" : "normal";
      return { id: f.id, name: f.name || "名前のない田んぼ", status };
    });
  }, [attention, attentionFieldIds]);

  const hasIssues = (attention?.totalIssue ?? 0) > 0 || (attention?.totalNeedsCheck ?? 0) > 0;

  return (
    <div className="space-y-4 px-3 pb-8 pt-3">
      <TodayStory />

      {/* 導入ヒーロー: 実写だけで世界観を伝える（時期説明・統計・操作は重ねない） */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeRise}
        className="overflow-hidden rounded-3xl shadow-[0_8px_24px_-12px_rgba(16,40,28,0.18)]"
      >
        <RemotePhoto
          src={heroImageUrl}
          alt="田んぼの風景"
          className="h-36 w-full object-cover md:h-48"
          fallbackVariant="field"
        />
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={fadeRise} className="px-1">
        <SectionEyebrow className="mb-1">Manage</SectionEyebrow>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900">管理</h1>
        <p className="mt-0.5 text-sm text-gray-500">田んぼ全体を見わたす場所</p>
      </motion.div>

      {/* 農事暦シーズンエンジン: 淡い緑背景・濃い文字で読みやすさ優先（PR #55基準） */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeRise}
        className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80">
            <SeasonIcon className="h-6 w-6 text-green-700" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-gray-900">{season.label}</p>
            <p className="mt-0.5 text-sm text-gray-600">{season.hint}</p>
          </div>
        </div>
        <Button asChild variant="primary" className="mt-3 w-full">
          <Link href="/records/new?returnTo=%2Fhome">
            {season.action}
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <div className="mt-4">
          <SeasonTimelineBar />
        </div>
      </motion.section>

      {/* 未対応の異常（未ログイン時は実データが取得できていないため出さない） */}
      {!isAnon && attention?.openIssueCount != null && attention.openIssueCount > 0 && (
        <Link href="/records?status=open" className="block active:scale-98 transition-transform">
          <Card accent="open" className="flex items-center gap-3 bg-amber-50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <IconWarningFill className="h-5 w-5 text-amber-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-800">
                未対応の異常が{attention.openIssueCount}件あります
              </p>
              <p className="mt-0.5 text-xs text-amber-600">タップして確認・対応する</p>
            </div>
            <StatusBadge status="open" label={`${attention.openIssueCount}件`} />
            <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-amber-400" />
          </Card>
        </Link>
      )}
      {!isAnon && loaded && attention?.openIssueCount === 0 && !hasIssues && (
        <Card accent="normal" className="flex items-center gap-2 bg-green-50 p-4">
          <StatusBadge status="normal" />
          <p className="text-sm font-semibold text-green-700">未対応の異常はありません</p>
        </Card>
      )}
      {!isAnon && !loadError && !loaded && <Skeleton className="h-14 w-full rounded-2xl" />}

      {/* ログイン促進 */}
      {isAnon && (
        <Link
          href="/login?redirect=%2Fhome"
          className="block rounded-3xl bg-white p-5 text-center shadow-[0_8px_24px_-12px_rgba(16,40,28,0.18)]"
        >
          <p className="text-sm font-bold text-gray-900">
            ログインするとすべての情報が表示されます
          </p>
          <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
        </Link>
      )}

      {/* 要注意の田んぼ（地図的な一覧性をPlotGlowMapで追加） */}
      {!isAnon && loaded && plotFields.length > 0 && (
        <RevealCard as="section" className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-12px_rgba(16,40,28,0.18)]">
          <SectionHeading tone={hasIssues ? "alert" : undefined} className="p-4 pb-2">
            田んぼの状態
          </SectionHeading>
          <div className="px-4 pb-3">
            <PlotGlowMap fields={plotFields} className="aspect-[2/1]" />
          </div>
          {attention && attention.attentionFields.length > 0 && (
            <ul className="px-4 pb-3">
              {attention.attentionFields.map((af, i) => (
                <li key={af.id}>
                  <Link
                    href={`/fields/${encodeURIComponent(af.id)}`}
                    className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <IconWarningFill className="h-4 w-4 text-amber-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{af.name || "名前のない田んぼ"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {af.issueCount > 0 && <StatusBadge status="issue" label={`異常${af.issueCount}`} />}
                        {af.needsCheckCount > 0 && <StatusBadge status="needs_check" label={`要確認${af.needsCheckCount}`} />}
                      </div>
                    </div>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </RevealCard>
      )}

      {/* クイックアクション（緑塗り=最優先/緑枠=第二/グレー枠=第三、の3層を維持） */}
      <RevealCard as="div" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Button asChild variant="primary">
          <Link href="/records/new?returnTo=%2Fhome">
            <IconCamera className="h-5 w-5" />
            写真で記録
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/talk">
            <IconChat className="h-5 w-5" />
            トーク
          </Link>
        </Button>
        <Button asChild variant="tertiary">
          <Link href="/map">
            <IconMap className="h-5 w-5 text-green-700" />
            マップ
          </Link>
        </Button>
        <Button asChild variant="tertiary">
          <Link href="/fields">
            <IconFieldGrid className="h-5 w-5 text-green-700" />
            田んぼ
          </Link>
        </Button>
      </RevealCard>

      {/* 管理メニュー（ナビ4系統化に伴い、二次導線をここに集約） */}
      <RevealCard as="div" delay={0.05} className="grid grid-cols-3 gap-2">
        {[
          { href: "/calendar", label: "カレンダー" },
          { href: "/export", label: "エクスポート" },
          { href: "/guide", label: "使い方" },
        ].map(({ href, label }) => (
          <Button key={href} asChild variant="tertiary" className="border-0 shadow-sm">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </RevealCard>

      {/* 最近の記録 */}
      <RevealCard as="section" delay={0.1} className="rounded-3xl bg-white shadow-[0_8px_24px_-12px_rgba(16,40,28,0.18)]">
        <SectionHeading
          className="p-4 pb-2"
          trailing={
            <Link
              href="/records"
              className="flex items-center gap-0.5 text-sm font-semibold text-green-700"
            >
              すべて
              <IconChevronRight className="h-4 w-4" />
            </Link>
          }
        >
          最近の記録
        </SectionHeading>
        {recentRecords.length === 0 ? (
          recordsMode === "loading" ? (
            <div className="space-y-2 px-4 pb-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <p className="px-4 pb-4 text-sm text-gray-400">
              {recordsMode === "anon"
                ? "ログインすると記録が表示されます"
                : recordsMode === "error"
                  ? "記録を読み込めませんでした"
                  : "まだ記録がありません"}
            </p>
          )
        ) : (
          <ul className="px-4 pb-3">
            {recentRecords.map((record, i) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
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
                    className="h-12 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {record.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <IconPin className="h-3.5 w-3.5" />
                      {record.fieldName}
                      {record.fieldArea ? `（${record.fieldArea}）・` : "・"}
                      {record.time}
                    </p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RevealCard>

      {loadError && (
        <p className="px-1 text-center text-sm text-gray-500">
          田んぼを読み込めませんでした。通信環境を確認して開き直してください。
        </p>
      )}
    </div>
  );
}
