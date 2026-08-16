"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadFieldAttention, type FieldAttentionSummary } from "../../lib/data/fieldAttention";
import { loadFieldLastRecordDates, getSignedPhotoUrls } from "../../lib/data/farm";
import { loadMostRecentFieldId, loadRecords } from "../../lib/data/records";
import { resolveRecordCoverUrl } from "../../lib/data/media";
import { loadImageSlots } from "../../lib/data/siteContent";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { IconBookOpen, IconChevronRight, IconMap, IconPinFill } from "../../components/ui/icons";
import type { RecordItem } from "../../types";

const FIELD_FALLBACKS = [
  "/assets/knowledge/inlet.webp",
  "/assets/knowledge/canal.webp",
  "/assets/knowledge/machine-entry.webp",
];

/** 久しぶりに開いた人が、田んぼと継承知識を写真から探せるログイン後ホーム。 */
export default function HomeDashboard() {
  const [attention, setAttention] = useState<FieldAttentionSummary | null>(null);
  const [attentionError, setAttentionError] = useState(false);
  const [lastDates, setLastDates] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [recentFieldId, setRecentFieldId] = useState<string | null>(null);
  const [reviewRecord, setReviewRecord] = useState<RecordItem | null>(null);
  const [reviewThumbUrl, setReviewThumbUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadFieldAttention(),
      loadFieldLastRecordDates(),
      loadMostRecentFieldId(),
      loadRecords({ limit: 20 }),
      loadImageSlots(),
    ]).then(async ([summary, dates, latestFieldId, recordData, imageSlots]) => {
      if (cancelled) return;
      if (summary.mode === "error") setAttentionError(true);
      else if (summary.mode !== "anon") setAttention(summary);
      setLastDates(dates);
      setRecentFieldId(latestFieldId);

      const review = recordData.records.find((record) => record.status === "needs_check") ?? null;
      setReviewRecord(review);
      if (review) setReviewThumbUrl(resolveRecordCoverUrl(recordData.thumbUrls[review.id], review.category, imageSlots));

      const paths = summary.fields.flatMap((field) => field.photoPath ? [field.photoPath] : []);
      const urls = await getSignedPhotoUrls(paths);
      if (!cancelled) setPhotoUrls(urls);
    }).catch(() => {
      if (!cancelled) setAttentionError(true);
    });
    return () => { cancelled = true; };
  }, []);

  const fieldCards = attention?.fields.map((field, index) => {
    const flagged = attention.attentionFields.find((item) => item.id === field.id);
    const count = (flagged?.issueCount ?? 0) + (flagged?.needsCheckCount ?? 0);
    const status: "issue" | "needs_check" | "normal" = flagged?.issueCount
      ? "issue"
      : flagged?.needsCheckCount
        ? "needs_check"
        : "normal";
    return {
      ...field,
      status,
      statusLabel: status === "normal" ? "通常どおり" : status === "issue" ? `要対応 ${count}件` : `要確認 ${count}件`,
      photoUrl: field.photoPath ? photoUrls[field.photoPath] : FIELD_FALLBACKS[index % FIELD_FALLBACKS.length],
      lastDate: lastDates[field.id] ?? null,
    };
  }) ?? [];
  const recentField = fieldCards.find((field) => field.id === recentFieldId) ?? fieldCards[0];

  return (
    <div className="min-h-full bg-[#fffdf7] px-4 pb-8 pt-5 text-stone-950">
      <header>
        <p className="text-xs font-bold tracking-[0.18em] text-emerald-800">田んぼの知識を次の世代へ</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight">見ればわかる、<br />田んぼの知識</h1>
      </header>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="border-l-4 border-emerald-800 pl-3 text-xl font-black">田んぼから探す</h2>
          <Link href="/map" className="flex min-h-11 items-center gap-1 text-sm font-bold text-emerald-800">マップ<IconChevronRight className="h-4 w-4" /></Link>
        </div>

        {attention === null ? (
          attentionError ? (
            <p className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">田んぼを読み込めませんでした。通信環境を確認してください。</p>
          ) : (
            <div className="space-y-3"><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-28 rounded-3xl" /></div>
          )
        ) : fieldCards.length > 0 ? (
          <div className="space-y-3">
            <Link href={`/fields/${encodeURIComponent(fieldCards[0].id)}`} className="relative block h-64 overflow-hidden rounded-3xl bg-stone-200 shadow-[0_16px_40px_-26px_rgba(6,78,59,0.65)] active:scale-[0.99]">
              <RemotePhoto src={fieldCards[0].photoUrl} alt={fieldCards[0].name || "田んぼの写真"} className="h-full w-full" fallbackVariant="field" />
              <div className="absolute inset-x-0 bottom-0 bg-black/55 p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl font-black">{fieldCards[0].name}</p>
                  <StatusBadge status={fieldCards[0].status} label={fieldCards[0].statusLabel} />
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold"><IconBookOpen className="h-4 w-4" />場所の知識 {fieldCards[0].pointCount}件</p>
              </div>
            </Link>

            {fieldCards.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {fieldCards.slice(1).map((field) => (
                  <Link key={field.id} href={`/fields/${encodeURIComponent(field.id)}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-white active:scale-[0.99]">
                    <RemotePhoto src={field.photoUrl} alt={field.name || "田んぼの写真"} className="h-24 w-full" fallbackVariant="field" />
                    <div className="p-3">
                      <p className="text-lg font-black">{field.name}</p>
                      <p className="mt-1 text-xs font-semibold text-stone-600">場所の知識 {field.pointCount}件</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/map" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-950 text-base font-black text-white shadow-sm active:scale-[0.99]">
              <IconMap className="h-5 w-5" />マップで田んぼを探す<IconChevronRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <Link href="/map?register=1" className="flex min-h-24 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><IconPinFill className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base">田んぼを登録する</strong><span className="text-sm text-stone-500">マップで輪郭をなぞって始めます</span></span>
            <IconChevronRight className="h-5 w-5" />
          </Link>
        )}
      </section>

      <section className="mt-8">
        <h2 className="border-l-4 border-emerald-800 pl-3 text-xl font-black">整理を待っている記録</h2>
        {reviewRecord ? (
          <Link href={`/records/${reviewRecord.id}`} className="mt-3 grid grid-cols-[7rem_1fr] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm active:scale-[0.99]">
            <RemotePhoto src={reviewThumbUrl} alt="" className="h-full min-h-28 w-full" fallbackVariant="water" />
            <div className="flex min-w-0 flex-col justify-center p-4">
              <p className="text-xs font-bold text-amber-700">内容を確認してください</p>
              <p className="mt-1 line-clamp-2 text-base font-black">{reviewRecord.fieldName}・{reviewRecord.title}</p>
              <span className="mt-2 flex items-center gap-1 text-sm font-bold text-emerald-800">内容を確認<IconChevronRight className="h-4 w-4" /></span>
            </div>
          </Link>
        ) : (
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white px-4 py-4">
            <p className="text-sm font-bold text-stone-700">現在、確認待ちの記録はありません</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">LINE連携後は、写真や音声から整理した内容がここに届きます。</p>
          </div>
        )}
      </section>

      {recentField && (
        <section className="mt-8">
          <h2 className="border-l-4 border-emerald-800 pl-3 text-xl font-black">最近確認した知識</h2>
          <Link href={`/fields/${encodeURIComponent(recentField.id)}`} className="mt-3 flex min-h-24 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 active:scale-[0.99]">
            <RemotePhoto src={recentField.photoUrl} alt="" className="h-20 w-28 shrink-0 rounded-xl" fallbackVariant="field" />
            <div className="min-w-0 flex-1"><p className="text-base font-black">{recentField.name}</p><p className="mt-1 text-sm text-stone-600">場所の写真と手順を確認</p></div>
            <IconChevronRight className="h-5 w-5 text-emerald-800" />
          </Link>
        </section>
      )}
    </div>
  );
}
