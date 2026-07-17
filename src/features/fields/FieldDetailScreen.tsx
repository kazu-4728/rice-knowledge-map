"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { consumeJustSaved } from "../records/recordDraft";
import { formatAreaSqm } from "../../lib/utils/geo";
import { useAreaUnit } from "../../lib/hooks/useAreaUnit";
import { useToast } from "../../components/ui/Toast";
import { useEffect } from "react";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import PhotoCompareSlider from "../../components/ui/PhotoCompareSlider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { CATEGORY_BADGE, CATEGORY_THEME } from "../../components/ui/categoryStyles";
import StatusBadge, { type StatusKey } from "../../components/ui/StatusBadge";
import SectionHeading from "../../components/ui/SectionHeading";
import { useFieldDetail, type ObservationPhoto } from "./hooks/useFieldDetail";
import { useAuth } from "../auth/useAuth";
import { shareFieldStory } from "../../lib/utils/share";
import type { FieldPoint } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconFieldGrid,
  IconMic,
  IconPinFill,
  IconShare,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

const POINT_TYPE_LABELS: Record<string, { label: string; icon: ReactNode; color: string }> = {
  inlet: { label: "入水口", icon: <IconDropFill className="h-4 w-4 text-sky-500" />, color: "bg-sky-50" },
  outlet: { label: "出水口", icon: <IconWaves className="h-4 w-4 text-blue-500" />, color: "bg-blue-50" },
  canal: { label: "水路", icon: <IconWaves className="h-4 w-4 text-cyan-500" />, color: "bg-cyan-50" },
  weed: { label: "雑草", icon: <IconSprout className="h-4 w-4 text-green-600" />, color: "bg-green-50" },
  caution: { label: "異常", icon: <IconWarningFill className="h-4 w-4 text-amber-500" />, color: "bg-amber-50" },
  levee_damage: { label: "畦崩れ", icon: <IconWarningFill className="h-4 w-4 text-red-500" />, color: "bg-red-50" },
  poor_drainage: { label: "水抜け不良", icon: <IconDropFill className="h-4 w-4 text-orange-500" />, color: "bg-orange-50" },
  other: { label: "その他", icon: <IconPinFill className="h-4 w-4 text-gray-500" />, color: "bg-gray-50" },
};

/** ピンの状態バッジ */
const POINT_STATUS_META: Record<FieldPoint["status"], { label: string; cls: string }> = {
  issue: { label: "異常", cls: "bg-red-100 text-red-700" },
  needs_check: { label: "要確認", cls: "bg-amber-100 text-amber-700" },
  normal: { label: "正常", cls: "bg-green-50 text-green-700" },
  resolved: { label: "解決済み", cls: "bg-blue-50 text-blue-600" },
};

/** 未対応・要確認のみ写真上に対応状況バッジを出す（解決済み/経過観察は既定状態のため出さない） */
const STATUS_BADGE: Partial<Record<string, { label: string; cls: string }>> = {
  open: { label: "未対応", cls: "border-transparent bg-red-600 text-white" },
  needs_check: { label: "要確認", cls: "border-transparent bg-amber-500 text-white" },
};

/** 記録タブで一度に描画する件数（大量の写真付きカードを一括描画しないための上限） */
const RECORDS_PAGE_SIZE = 20;

type TabKey = "overview" | "records" | "photos";
const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概要" },
  { key: "records", label: "記録" },
  { key: "photos", label: "定点観測" },
];

/**
 * 定点観測タイムマシン（田んぼOS レイヤー5）の1グループ分。
 * 「基準（以前）」写真を固定し、スライダーで比較対象（今）を時系列に動かして見比べる。
 * 写真を主役にするため、操作説明はスライダー側の視覚ヒント（パルス）に譲り最小限にする。
 */
function ObservationGroup({
  label,
  icon,
  photos,
}: {
  label: string;
  icon: ReactNode;
  photos: ObservationPhoto[];
}) {
  const [baseIndex, setBaseIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(photos.length - 1);

  const safeBaseIndex = Math.min(baseIndex, photos.length - 1);
  const safeCompareIndex = Math.min(compareIndex, photos.length - 1);

  useEffect(() => {
    if (baseIndex > photos.length - 1) setBaseIndex(Math.max(0, photos.length - 1));
    if (compareIndex > photos.length - 1) setCompareIndex(Math.max(0, photos.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  if (photos.length === 1) {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 p-3 pb-2">
          {icon}
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <span className="ml-auto text-xs text-gray-400">1枚</span>
        </div>
        <Link href={`/records/${photos[0].id}`} className="block aspect-square overflow-hidden">
          <RemotePhoto src={photos[0].url} alt={label} className="h-full w-full object-cover" fallbackVariant="field" />
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-2 p-3 pb-2">
        {icon}
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <span className="ml-auto text-xs text-gray-400">{photos.length}枚</span>
      </div>

      <PhotoCompareSlider
        beforeUrl={photos[safeBaseIndex].url}
        afterUrl={photos[safeCompareIndex].url}
        beforeLabel={photos[safeBaseIndex].shortDate}
        afterLabel={photos[safeCompareIndex].shortDate}
        className="rounded-none"
      />

      <div className="p-3">
        {/* 比較対象（今）を時系列に動かすスライダー */}
        <input
          type="range"
          min={0}
          max={photos.length - 1}
          value={safeCompareIndex}
          onChange={(e) => setCompareIndex(Number(e.target.value))}
          className="w-full accent-green-700"
          aria-label={`${label}の写真を時系列で比較する`}
        />

        <div className="mt-1.5 flex items-center justify-between text-xs">
          <Link href={`/records/${photos[safeBaseIndex].id}`} className="font-semibold text-green-700">
            「以前」の記録を見る
          </Link>
          <Link href={`/records/${photos[safeCompareIndex].id}`} className="font-semibold text-green-700">
            「今」の記録を見る
          </Link>
        </div>

        {/* 基準（以前）の写真はフィルムストリップからタップして選び直せる */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setBaseIndex(i)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ${
                i === safeBaseIndex ? "ring-2 ring-green-600" : ""
              }`}
              aria-label={`${p.date}の写真を基準にする`}
              aria-pressed={i === safeBaseIndex}
            >
              <RemotePhoto src={p.url} alt={p.date} className="h-full w-full object-cover" fallbackVariant="field" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

type Props = { fieldId: string };

export default function FieldDetailScreen({ fieldId }: Props) {
  const { showToast } = useToast();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [recordsShown, setRecordsShown] = useState(RECORDS_PAGE_SIZE);

  const {
    loading,
    notFound,
    field,
    points,
    sortedPoints,
    records,
    thumbUrls,
    attention,
    openRecords,
    observationGroups,
    categoryCounts,
    lastRecord,
    handlePhotoSelect,
    coverImageUrl,
  } = useFieldDetail(fieldId);

  // 記録保存直後にこの画面へ戻ってきた場合はトーストを出す
  useEffect(() => {
    if (consumeJustSaved()) showToast("記録を保存しました");
  }, [showToast]);

  const [areaUnit, cycleAreaUnit] = useAreaUnit();
  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    return formatAreaSqm(sqm, areaUnit);
  };

  if (loading) {
    return (
      <div className="min-h-full space-y-3 bg-flow-cream px-3 pb-6 pt-3">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-16 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-flow-cream px-6 pt-20 text-center">
        <p className="text-base font-bold text-gray-900">田んぼが見つかりません</p>
        <p className="text-sm text-gray-500">
          {session
            ? "削除されたか、アクセス権限がない可能性があります。"
            : "ログインしていないため表示できない可能性があります。ログインするとこのページの田んぼを確認できます。"}
        </p>
        {!session ? (
          <Link
            href={`/login?redirect=${encodeURIComponent(`/fields/${fieldId}`)}`}
            className="rounded-xl bg-flow-green px-6 py-3 text-sm font-bold text-white"
          >
            ログインする
          </Link>
        ) : (
          <Link href="/fields" className="rounded-xl bg-flow-green px-6 py-3 text-sm font-bold text-white">
            各場所の記録に戻る
          </Link>
        )}
        {!session && (
          <Link href="/fields" className="text-sm font-semibold text-gray-500 underline-offset-2 hover:underline">
            各場所の記録に戻る
          </Link>
        )}
      </div>
    );
  }

  const lastRecordLabel = lastRecord
    ? `${new Date(lastRecord.recordedAt).getMonth() + 1}/${new Date(lastRecord.recordedAt).getDate()}`
    : "—";
  const hasAttention = attention.length > 0 || openRecords.length > 0;
  const pointById = new Map(points.map((p) => [p.id, p]));
  // 状態チップ（色のアクセントは状態チップのみに絞る田んぼOSデザイン原則）
  const overallStatus: StatusKey =
    attention.some((p) => p.status === "issue") || openRecords.some((r) => r.status === "open")
      ? "issue"
      : attention.length > 0 || openRecords.length > 0
        ? "needs_check"
        : "normal";
  const attentionCount = attention.length + openRecords.length;

  const handleShare = async () => {
    const url = `${window.location.origin}/fields/${encodeURIComponent(fieldId)}`;
    const statusLabel = hasAttention ? "気になるところがあります" : "順調に育っています";
    const result = await shareFieldStory({ fieldName: field.name || "名前のない田んぼ", statusLabel, url });
    if (result === "copied") showToast("リンクをコピーしました。LINEなどに貼り付けて共有できます");
    else if (result === "failed") showToast("共有に失敗しました", "error");
  };

  return (
    <div className="min-h-full space-y-3 bg-flow-cream px-3 pb-6 pt-3">
      {/* カバー写真 */}
      <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ height: "56vw", maxHeight: 280, minHeight: 180 }}>
        <RemotePhoto
          src={coverImageUrl}
          alt={field.name}
          className="h-full w-full object-cover animate-ken-burns-up"
          fallbackVariant="field"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-white drop-shadow">{field.name || "名前のない田んぼ"}</h1>
          {field.areaSqm !== null && (
            <button
              onClick={cycleAreaUnit}
              className="mt-0.5 border-b border-dotted border-white/50 text-sm text-white/80 active:opacity-70"
            >
              {formatArea(field.areaSqm)}
            </button>
          )}
        </div>

        {/* 写真あり: 変更ボタン。写真なし: 追加の促し */}
        {field.groupId && field.photoUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-semibold text-white"
            aria-label="写真を変更"
          >
            <IconCamera className="h-3.5 w-3.5" />
            写真を変更
          </button>
        )}
        {field.groupId && !field.photoUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl bg-black/45 px-5 py-3.5 text-center backdrop-blur-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
              <IconCamera className="h-5 w-5 text-green-700" />
            </span>
            <span className="text-sm font-bold text-white">カバー写真を追加</span>
            <span className="text-[11px] text-white/80">一覧で見分けやすくなります</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); e.currentTarget.value = ""; }}
        />
      </div>

      {/* 主役ヒーロー: 統計+状態サマリー+記録アクションを1枚に統合（色は深緑単色+状態チップのみアクセント） */}
      <section className="rounded-3xl bg-flow-green p-4 text-white shadow-[0_16px_40px_-16px_rgba(6,78,59,0.5)]">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <IconPinFill className="h-6 w-6 text-white/90" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-heading text-lg font-bold">{field.name || "名前のない田んぼ"}</p>
              {points.length > 0 && (
                <StatusBadge
                  dark
                  status={overallStatus}
                  label={
                    overallStatus === "normal"
                      ? "順調"
                      : overallStatus === "issue"
                        ? `要対応 ${attentionCount}件`
                        : `要確認 ${attentionCount}件`
                  }
                />
              )}
            </div>
            <p className="mt-0.5 text-sm text-white/85">
              {hasAttention
                ? "下の「記録」タブ、または「ポイントの状態」で確認してください"
                : points.length > 0
                  ? `登録ポイント${points.length}件はすべて正常です`
                  : "マップで入水口・異常箇所などを登録できます"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 divide-x divide-white/15 rounded-2xl bg-white/10 py-2.5">
          <div className="px-1 text-center">
            <p className="font-heading text-lg font-bold">{field.areaSqm !== null ? formatArea(field.areaSqm) : "—"}</p>
            <p className="mt-0.5 text-[11px] text-white/60">面積</p>
          </div>
          <div className="px-1 text-center">
            <p className="font-heading text-lg font-bold">{points.length}</p>
            <p className="mt-0.5 text-[11px] text-white/60">ポイント</p>
          </div>
          <div className="px-1 text-center">
            <p className="font-heading text-lg font-bold">{records.length}</p>
            <p className="mt-0.5 text-[11px] text-white/60">記録</p>
          </div>
          <div className="px-1 text-center">
            <p className={`font-heading text-lg font-bold ${openRecords.length > 0 ? "text-amber-300" : ""}`}>
              {openRecords.length}
            </p>
            <p className="mt-0.5 text-[11px] text-white/60">未対応</p>
          </div>
        </div>

        {categoryCounts.length > 0 && (
          <div className="mt-3">
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              {categoryCounts.map(({ cat, count }) => (
                <span
                  key={cat}
                  className={CATEGORY_THEME[cat].dot}
                  style={{ width: `${(count / records.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70">
              {categoryCounts.map(({ cat, count }) => (
                <span key={cat}>{cat} {count}</span>
              ))}
              {lastRecord && <span className="ml-auto">最終記録 {lastRecordLabel}</span>}
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2.5">
          <Button asChild variant="primary" className="flex-1">
            <Link href={`/records/new?field=${encodeURIComponent(fieldId)}&returnTo=${encodeURIComponent(`/fields/${fieldId}`)}`}>
              <IconCamera className="h-4.5 w-4.5" />
              写真で記録
            </Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/15">
            <Link href={`/records/new?type=audio&field=${encodeURIComponent(fieldId)}&returnTo=${encodeURIComponent(`/fields/${fieldId}`)}`}>
              <IconMic className="h-4.5 w-4.5" />
              音声メモ
            </Link>
          </Button>
        </div>
      </section>

      {/* アプリ外への手動共有（Issue #70・段階1: リンク+テキストのみ） */}
      <div>
        <Button variant="secondary" className="w-full" onClick={handleShare}>
          <IconShare className="h-4 w-4" />
          共有する
        </Button>
        <p className="mt-1.5 text-center text-xs text-gray-500">
          LINEなど、アプリの外にいる人へ送ります（仲間にはすでに「みんなの記録」で見えています）
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList aria-label="田んぼ詳細の表示切り替え">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 概要タブ: ポイントの状態一覧 */}
        <TabsContent value="overview" className="mt-3 space-y-2">
          {points.length > 0 ? (
            <>
              <SectionHeading level={3}>ポイントの状態</SectionHeading>
              <ul className="space-y-2">
                {sortedPoints.map((point) => {
                    const meta = POINT_TYPE_LABELS[point.type] ?? POINT_TYPE_LABELS["caution"];
                    const status = POINT_STATUS_META[point.status];
                    return (
                      <li key={point.id}>
                        <Link
                          href={`/map?field=${encodeURIComponent(fieldId)}&point=${encodeURIComponent(point.id)}`}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                            {meta.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900">{point.name || meta.label}</p>
                            <p className="text-xs text-gray-400">{meta.label}・{point.lastRecord}</p>
                          </div>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                          <IconChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </>
          ) : (
            <Link href="/map" className="block active:scale-98 transition-transform">
              <Card accent="monitoring" className="flex items-center gap-3 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <IconPinFill className="h-4.5 w-4.5 text-gray-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">ポイントが未登録です</p>
                  <p className="mt-0.5 text-xs text-gray-500">マップで入水口・異常箇所などを登録できます</p>
                </div>
                <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
              </Card>
            </Link>
          )}
        </TabsContent>

        {/* 記録タブ: 写真主体のタイムライン（大量記録時に一括描画しないようページング） */}
        <TabsContent value="records" className="mt-3">
          {records.length > 0 ? (
            <>
              <div className="space-y-3">
                {records.slice(0, recordsShown).map((record) => {
                  const statusBadge = STATUS_BADGE[record.status];
                  return (
                    <Link key={record.id} href={`/records/${record.id}`} className="block active:scale-98 transition-transform">
                      <Card className="overflow-hidden">
                        <div className="relative h-40">
                          <RecordThumb
                            media={record.media}
                            variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
                            duration={record.audioDuration}
                            thumbUrl={thumbUrls[record.id]}
                            className="h-full w-full"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                          <Badge className={`absolute left-3 top-3 ${CATEGORY_BADGE[record.category]}`}>
                            {record.category}
                          </Badge>
                          {statusBadge && (
                            <Badge className={`absolute right-3 top-3 ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="px-4 py-3">
                          <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{record.date} {record.time}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              {recordsShown < records.length && (
                <Button
                  variant="tertiary"
                  className="mt-3 w-full"
                  onClick={() => setRecordsShown((n) => n + RECORDS_PAGE_SIZE)}
                >
                  もっと見る（残り{records.length - recordsShown}件）
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">まだ記録がありません</p>
              <p className="mt-1 text-xs text-gray-400">上のボタンから最初の記録を作りましょう</p>
            </div>
          )}
        </TabsContent>

        {/* 定点観測タイムマシン: 同じ地点の写真を時系列比較（写真を主役に） */}
        <TabsContent value="photos" className="mt-3">
          {observationGroups.length > 0 ? (
            <div className="space-y-3">
              {observationGroups.map((g) => {
                const point = g.pointId ? pointById.get(g.pointId) : undefined;
                const meta = point ? POINT_TYPE_LABELS[point.type] ?? POINT_TYPE_LABELS["caution"] : null;
                const label = point ? point.name || meta!.label : "田んぼ全体";
                const icon = meta ? meta.icon : <IconFieldGrid className="h-4 w-4 text-green-700" />;
                return <ObservationGroup key={g.key} label={label} icon={icon} photos={g.photos} />;
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">まだ写真がありません</p>
              <p className="mt-1 text-xs text-gray-400">「写真で記録」から追加すると、同じ地点の変化を見比べられます</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 二次導線 */}
      <Button asChild variant="secondary" className="w-full">
        <Link href={`/map?field=${encodeURIComponent(fieldId)}`}>
          <IconPinFill className="h-4 w-4" />
          マップで見る
        </Link>
      </Button>
    </div>
  );
}
