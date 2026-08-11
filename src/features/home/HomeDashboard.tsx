"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadFieldAttention, type FieldAttentionSummary } from "../../lib/data/fieldAttention";
import { loadFieldLastRecordDates, getSignedPhotoUrls } from "../../lib/data/farm";
import { loadMostRecentFieldId } from "../../lib/data/records";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { StartChecklist } from "./StartChecklist";
import { HomeShareSheet } from "./HomeShareSheet";
import {
  IconCamera,
  IconChevronRight,
  IconMic,
  IconPinFill,
  IconShare,
} from "../../components/ui/icons";

/**
 * ログイン後ホーム（/）＝田んぼボード。
 * 「どの田んぼがどうなっているか」を固定順（display_order）のカードで見せる場所であり、
 * 時系列の一覧は持たない（タイムラインは記録タブに一本化。2026-08-09オーナー指摘:
 * ホームがタイムラインと同じで、どこの記録かすぐ分からなくなるため）。
 */
export default function HomeDashboard() {
  const [attention, setAttention] = useState<FieldAttentionSummary | null>(null);
  const [attentionError, setAttentionError] = useState(false);
  const [lastDates, setLastDates] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [recentFieldId, setRecentFieldId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFieldAttention().then(async (summary) => {
      if (cancelled || summary.mode === "anon") return;
      // errorのまま何もしないとattentionがnullのまま=スケルトン表示が永久に残るため、
      // エラー状態を明示してスケルトンから抜け出す
      if (summary.mode === "error") { setAttentionError(true); return; }
      setAttention(summary);
      const paths = summary.fields.flatMap((f) => (f.photoPath ? [f.photoPath] : []));
      const urls = await getSignedPhotoUrls(paths);
      if (!cancelled) setPhotoUrls(urls);
    });
    loadFieldLastRecordDates().then((dates) => {
      if (!cancelled) setLastDates(dates);
    });
    // 「見くらべる」の遷移先に使う直近記録の田んぼだけ取得する（一覧表示はしない）。
    // field_id IS NOT NULL をサーバ側で絞り込むため、田んぼ未選択の記録が
    // 直近に連続していても実際に最後に記録した田んぼを取りこぼさない
    loadMostRecentFieldId().then((fieldId) => {
      if (!cancelled) setRecentFieldId(fieldId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = useCallback(() => setShareOpen(true), []);

  const hasField = attention ? attention.fields.length > 0 : null;

  /** 「見くらべる」の遷移先。直近に記録した田んぼを優先し、無ければ最初の田んぼ */
  const compareFieldId = recentFieldId ?? attention?.fields[0]?.id ?? null;

  /** 田んぼカード（issue > needs_check > normal の優先順で信号色を出す） */
  const fieldCards =
    attention?.fields.map((f) => {
      const a = attention.attentionFields.find((af) => af.id === f.id);
      const count = (a?.issueCount ?? 0) + (a?.needsCheckCount ?? 0);
      const status: "issue" | "needs_check" | "normal" = a?.issueCount
        ? "issue"
        : a?.needsCheckCount
          ? "needs_check"
          : "normal";
      return {
        id: f.id,
        name: f.name,
        color: f.color,
        photoUrl: f.photoPath ? photoUrls[f.photoPath] : undefined,
        status,
        statusLabel:
          status === "normal" ? "順調" : status === "issue" ? `要対応 ${count}件` : `要確認 ${count}件`,
        lastDate: lastDates[f.id] ?? null,
      };
    }) ?? [];

  return (
    <div className="min-h-full space-y-4 bg-flow-cream px-3 pb-6 pt-3">
      {/* 田んぼボード */}
      <section>
        <div className="flex items-center justify-between px-1 pb-2">
          <h1 className="font-heading text-lg font-bold text-gray-900">今日の田んぼ</h1>
          <Link href="/map" className="flex items-center gap-0.5 text-xs font-bold text-flow-green">
            マップで見る
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {attention === null ? (
          attentionError ? (
            <p className="rounded-2xl bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
              田んぼの状態を読み込めませんでした。通信環境を確認してもう一度開いてください
            </p>
          ) : (
            <div className="space-y-2.5">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          )
        ) : fieldCards.length > 0 ? (
          <ul className="space-y-2.5">
            {fieldCards.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/fields/${encodeURIComponent(f.id)}`}
                  className="block overflow-hidden rounded-2xl bg-white shadow-sm transition-transform active:scale-98"
                >
                  <div className="relative h-32">
                    <RemotePhoto
                      src={f.photoUrl}
                      alt={f.name || "名前のない田んぼ"}
                      className="h-full w-full"
                      fallbackVariant="field"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-base font-bold text-white drop-shadow">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/70"
                          style={{ backgroundColor: f.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{f.name || "名前のない田んぼ"}</span>
                      </p>
                      <StatusBadge status={f.status} label={f.statusLabel} className="shrink-0" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <p className="text-xs text-gray-500">
                      {f.lastDate ? `最終記録 ${f.lastDate}` : "まだ記録がありません"}
                    </p>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-flow-green">
                      この田んぼを見る
                      <IconChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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

      {/* 定点観測への導線（場所詳細の3番目のタブ。これまで画面内にたどり着く導線が無かった）。
          直近で記録した田んぼ、無ければ最初の田んぼの写真タブを直接開く */}
      {compareFieldId && (
        <Link
          href={`/fields/${encodeURIComponent(compareFieldId)}?tab=photos`}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-98"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flow-green-soft">
            <IconCamera className="h-5 w-5 text-flow-green" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">同じ場所の写真を見くらべる</p>
            <p className="mt-0.5 text-xs text-gray-500">前に撮った写真と並べて、田んぼの変化を確認できます</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-300" />
        </Link>
      )}

      {/* 初回利用時のみのチェックリスト（唯一の案内レイヤー） */}
      <StartChecklist onShareClick={hasField ? handleShare : undefined} />

      <HomeShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
