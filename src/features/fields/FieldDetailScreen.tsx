"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { loadFarmData, updateFieldPhoto } from "../../lib/data/farm";
import { loadRecords, isUnresolvedIssue } from "../../lib/data/records";
import { consumeJustSaved } from "../records/recordDraft";
import { getSupabase } from "../../lib/supabase/client";
import { compressImage } from "../../lib/utils/imageCompress";
import { useToast } from "../../components/ui/Toast";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { FieldPoint, RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconMic,
  IconPinFill,
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

/** ピンの状態バッジ。要対応（issue/needs_check）を上位に並べる */
const POINT_STATUS_META: Record<FieldPoint["status"], { label: string; cls: string; order: number }> = {
  issue: { label: "異常", cls: "bg-red-100 text-red-700", order: 0 },
  needs_check: { label: "要確認", cls: "bg-amber-100 text-amber-700", order: 1 },
  normal: { label: "正常", cls: "bg-green-50 text-green-700", order: 2 },
  resolved: { label: "対応済み", cls: "bg-blue-50 text-blue-600", order: 3 },
};

const CATEGORY_CHIP: Record<RecordItem["category"], string> = {
  水管理: "bg-blue-50 text-blue-600",
  作業: "bg-green-50 text-green-700",
  異常: "bg-orange-50 text-orange-600",
  音声: "bg-teal-50 text-teal-600",
};

async function uploadFieldPhoto(groupId: string, fieldId: string, file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const blob = await compressImage(file);
  const path = `groups/${groupId}/fields/${fieldId}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) { console.warn("[field-detail] upload failed", error); return null; }
  return path;
}

type Props = { fieldId: string };

export default function FieldDetailScreen({ fieldId }: Props) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldName, setFieldName] = useState("");
  const [fieldColor, setFieldColor] = useState("#22C55E");
  const [fieldGroupId, setFieldGroupId] = useState("");
  const [areaSqm, setAreaSqm] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 記録保存直後にこの画面へ戻ってきた場合はトーストを出す
  useEffect(() => {
    if (consumeJustSaved()) showToast("記録を保存しました");
  }, [showToast]);

  useEffect(() => {
    // この田んぼの記録を全件取得する（状態サマリーの未対応集計が最新100件外の古い異常を
    // 取りこぼして「異常なし」と誤表示しないよう all:true。デモ時は全件返るため下でクライアント絞り込み）
    Promise.all([loadFarmData(), loadRecords({ fieldId, all: true })]).then(async ([farm, rec]) => {
      const feature = farm.fieldsGeoJSON.features.find(
        (f) => String(f.id ?? f.properties?.id ?? "") === fieldId
      );
      if (!feature) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setFieldName(String(feature.properties?.name ?? ""));
      setFieldColor(String(feature.properties?.color ?? "#22C55E"));
      setFieldGroupId(feature.properties?.group_id ?? farm.groupId ?? "");
      setAreaSqm(typeof feature.properties?.area_sqm === "number" ? feature.properties.area_sqm : null);
      const pPath: string | null = feature.properties?.photo_path ?? null;

      if (pPath) {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.storage.from("images").createSignedUrls([pPath], 3600);
          if (data?.[0]?.signedUrl && !data[0].error) setPhotoUrl(data[0].signedUrl);
        }
      }

      const fieldPoints = farm.points.filter((p) => p.fieldId === fieldId);
      setPoints(fieldPoints);

      const fieldRecords = rec.records.filter((r) => r.fieldId === fieldId);
      setRecords(fieldRecords);
      setThumbUrls(rec.thumbUrls);
      setLoading(false);
    });
  }, [fieldId]);

  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
    return `${sqm.toFixed(0)}㎡`;
  };

  const handlePhotoSelect = async (file: File) => {
    if (!fieldGroupId) return;
    const path = await uploadFieldPhoto(fieldGroupId, fieldId, file);
    if (!path) return;
    const saved = await updateFieldPhoto(fieldId, path);
    if (!saved) return;
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  };

  if (loading) {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-16 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-20 text-center">
        <p className="text-base font-bold text-gray-900">田んぼが見つかりません</p>
        <p className="text-sm text-gray-500">削除されたか、アクセス権限がない可能性があります。</p>
        <Link href="/home" className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white">
          田んぼ一覧に戻る
        </Link>
      </div>
    );
  }

  // 要対応（異常・要確認）のピンを抽出し、状態順に並べ替える
  const attention = points.filter((p) => p.status === "issue" || p.status === "needs_check");
  const sortedPoints = [...points].sort(
    (a, b) => POINT_STATUS_META[a.status].order - POINT_STATUS_META[b.status].order
  );

  // この田んぼの概要（実データから集計）。「未対応」= 未解決の異常記録のみ
  const openRecords = records.filter(isUnresolvedIssue);
  const photoRecords = records.filter((r) => r.media === "photo");
  const lastRecord = records[0]; // loadRecords は新しい順に返す
  const lastRecordLabel = lastRecord
    ? `${new Date(lastRecord.recordedAt).getMonth() + 1}/${new Date(lastRecord.recordedAt).getDate()}`
    : "—";
  const categoryOrder: RecordItem["category"][] = ["水管理", "作業", "異常", "音声"];
  const categoryCounts = categoryOrder
    .map((cat) => ({ cat, count: records.filter((r) => r.category === cat).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      {/* カバー写真 */}
      <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ height: "56vw", maxHeight: 280, minHeight: 180 }}>
        <RemotePhoto
          key={photoUrl ?? "fallback"}
          src={photoUrl ?? undefined}
          alt={fieldName}
          className="h-full w-full object-cover animate-ken-burns-up"
          fallbackVariant="field"
        />
        {!photoUrl && (
          <span className="absolute inset-0 opacity-40" style={{ background: fieldColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-white drop-shadow">{fieldName || "名前のない田んぼ"}</h1>
          {areaSqm !== null && (
            <p className="mt-0.5 text-sm text-white/80">{formatArea(areaSqm)}</p>
          )}
        </div>

        {/* 写真あり: 変更ボタン。写真なし: 追加の促し */}
        {fieldGroupId && photoUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-semibold text-white"
            aria-label="写真を変更"
          >
            <IconCamera className="h-3.5 w-3.5" />
            写真を変更
          </button>
        )}
        {fieldGroupId && !photoUrl && (
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

      {/* 状態サマリー — 今この田んぼがどういう状態か（要対応ポイント or 未対応の異常記録） */}
      {attention.length > 0 || openRecords.length > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <IconWarningFill className="h-4.5 w-4.5 text-amber-600" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-800">
              {[
                attention.length > 0 ? `要対応のポイント${attention.length}件` : null,
                openRecords.length > 0 ? `未対応の異常記録${openRecords.length}件` : null,
              ].filter(Boolean).join(" ・ ")}があります
            </p>
            <p className="mt-0.5 text-xs text-amber-600">下の「ポイントの状態」や記録で確認してください</p>
          </div>
        </div>
      ) : points.length > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3.5 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <IconPinFill className="h-4.5 w-4.5 text-green-700" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-green-800">
              {points.every((p) => p.status === "normal") ? "異常なし・順調です" : "要対応はありません"}
            </p>
            <p className="mt-0.5 text-xs text-green-600">
              {points.every((p) => p.status === "normal")
                ? `登録ポイント${points.length}件はすべて正常です`
                : "要対応のポイントはありません（対応済みを含む）"}
            </p>
          </div>
        </div>
      ) : (
        <Link href="/map" className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm active:scale-98 transition-transform">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <IconPinFill className="h-4.5 w-4.5 text-gray-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">ポイントが未登録です</p>
            <p className="mt-0.5 text-xs text-gray-500">マップで入水口・異常箇所などを登録できます</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
        </Link>
      )}

      {/* この田んぼの概要 — 実データの集計 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          <div className="px-1 text-center">
            <p className="text-lg font-bold text-gray-900">{formatArea(areaSqm) ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">面積</p>
          </div>
          <div className="px-1 text-center">
            <p className="text-lg font-bold text-gray-900">{points.length}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">ポイント</p>
          </div>
          <div className="px-1 text-center">
            <p className="text-lg font-bold text-gray-900">{records.length}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">記録</p>
          </div>
          <div className="px-1 text-center">
            <p className={`text-lg font-bold ${openRecords.length > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {openRecords.length}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">未対応</p>
          </div>
        </div>
        {(categoryCounts.length > 0 || lastRecord) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
            {categoryCounts.map(({ cat, count }) => (
              <span key={cat} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${CATEGORY_CHIP[cat]}`}>
                {cat} {count}
              </span>
            ))}
            {lastRecord && (
              <span className="ml-auto text-xs text-gray-400">最終記録 {lastRecordLabel}</span>
            )}
          </div>
        )}
      </section>

      {/* この田んぼを記録する — 次にすべきこと */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-900">この田んぼを記録する</p>
        <div className="mt-3 flex gap-3">
          <Link
            href={`/records/new?field=${encodeURIComponent(fieldId)}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            <IconCamera className="h-4.5 w-4.5" />
            写真で記録
          </Link>
          <Link
            href={`/records/new?type=audio&field=${encodeURIComponent(fieldId)}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
          >
            <IconMic className="h-4.5 w-4.5" />
            音声メモ
          </Link>
        </div>
      </section>

      {/* ポイントの状態（要対応を上に） */}
      {points.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <IconPinFill className="h-5 w-5 text-green-700" />
            <h2 className="text-sm font-bold text-gray-900">ポイントの状態</h2>
            <span className="ml-auto text-xs text-gray-400">{points.length}件</span>
          </div>
          <ul className="space-y-2">
            {sortedPoints.map((point) => {
              const meta = POINT_TYPE_LABELS[point.type] ?? POINT_TYPE_LABELS["caution"];
              const status = POINT_STATUS_META[point.status];
              return (
                <li key={point.id}>
                  <Link
                    href={`/records/new?field=${encodeURIComponent(fieldId)}&point=${encodeURIComponent(point.id)}&pointType=${encodeURIComponent(point.type)}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 transition-all hover:bg-gray-50 active:scale-95"
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
        </section>
      )}

      {/* 写真の記録（ギャラリー） */}
      {photoRecords.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <IconCamera className="h-5 w-5 text-green-700" />
            <h2 className="text-sm font-bold text-gray-900">写真の記録</h2>
            <span className="ml-auto text-xs text-gray-400">{photoRecords.length}件</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photoRecords.slice(0, 6).map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl active:scale-95 transition-transform"
              >
                <RecordThumb
                  media="photo"
                  variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
                  thumbUrl={thumbUrls[record.id]}
                  className="h-full w-full"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 py-1">
                  <span className="block truncate text-[10px] font-semibold text-white">{record.time}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* この田んぼの最近の記録（3件） */}
      {records.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">最近の記録</h2>
            <Link href={`/records?field=${encodeURIComponent(fieldId)}`} className="flex items-center text-xs font-semibold text-green-700">
              すべて見る <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul>
            {records.slice(0, 3).map((record, i) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className={`flex items-center gap-3 py-2.5 active:scale-95 transition-transform ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <RecordThumb
                    media={record.media}
                    variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
                    duration={record.audioDuration}
                    thumbUrl={thumbUrls[record.id]}
                    className="h-12 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{record.date} {record.time}</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {records.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">まだ記録がありません</p>
          <p className="mt-1 text-xs text-gray-400">上のボタンから最初の記録を作りましょう</p>
        </div>
      )}

      {/* 二次導線 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/records?field=${encodeURIComponent(fieldId)}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 active:scale-95 transition-transform shadow-sm"
        >
          記録一覧
          <IconChevronRight className="h-4 w-4 text-gray-400" />
        </Link>
        <Link
          href="/map"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700 active:scale-95 transition-transform shadow-sm"
        >
          <IconPinFill className="h-4 w-4" />
          マップを開く
        </Link>
      </div>
    </div>
  );
}
